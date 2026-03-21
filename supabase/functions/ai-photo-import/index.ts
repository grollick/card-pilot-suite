import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed domains for the download proxy to prevent SSRF
const ALLOWED_DOWNLOAD_PROTOCOLS = ["https:"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { url, action } = await req.json();

    // ── Step 1: Scan URL for images ──
    if (action === "scan") {
      if (!url) throw new Error("URL is required");

      const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
      if (!FIRECRAWL_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Photo import requires Firecrawl to be connected. Please enable it in Settings." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      console.log("Scanning URL for images:", formattedUrl);

      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ["html", "links", "markdown"],
          onlyMainContent: false,
          waitFor: 3000,
        }),
      });

      if (!scrapeResponse.ok) {
        const errData = await scrapeResponse.json().catch(() => ({}));
        console.error("Firecrawl error:", scrapeResponse.status, errData);
        if (scrapeResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "Firecrawl credits exhausted. Please top up your Firecrawl account." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(errData.error || `Failed to scan URL (${scrapeResponse.status})`);
      }

      const scrapeData = await scrapeResponse.json();
      const html = scrapeData.data?.html || scrapeData.html || "";
      const pageTitle = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || "";

      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
      const ogRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
      
      const images: { url: string; alt: string; width?: number }[] = [];
      const seen = new Set<string>();

      let ogMatch;
      while ((ogMatch = ogRegex.exec(html)) !== null) {
        const imgUrl = ogMatch[1];
        if (!seen.has(imgUrl)) {
          seen.add(imgUrl);
          images.push({ url: imgUrl, alt: "Featured image" });
        }
      }

      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const imgUrl = match[1];
        const alt = match[2] || "";

        if (
          seen.has(imgUrl) ||
          imgUrl.includes("data:image/svg") ||
          imgUrl.includes("favicon") ||
          imgUrl.includes("logo") && imgUrl.length < 100 ||
          imgUrl.includes("pixel") ||
          imgUrl.includes("tracker") ||
          imgUrl.includes("1x1") ||
          imgUrl.includes("spacer") ||
          imgUrl.endsWith(".svg") ||
          imgUrl.endsWith(".ico")
        ) {
          continue;
        }

        const widthMatch = match[0].match(/width=["']?(\d+)/);
        const width = widthMatch ? parseInt(widthMatch[1]) : undefined;
        if (width && width < 100) continue;

        seen.add(imgUrl);
        images.push({ url: imgUrl, alt, width });
      }

      const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
      let bgMatch;
      while ((bgMatch = bgRegex.exec(html)) !== null) {
        const imgUrl = bgMatch[1];
        if (!seen.has(imgUrl) && !imgUrl.includes("data:") && !imgUrl.endsWith(".svg")) {
          seen.add(imgUrl);
          images.push({ url: imgUrl, alt: "Background image" });
        }
      }

      const baseUrl = new URL(formattedUrl);
      const resolvedImages = images.map((img) => {
        let resolvedUrl = img.url;
        if (resolvedUrl.startsWith("//")) {
          resolvedUrl = baseUrl.protocol + resolvedUrl;
        } else if (resolvedUrl.startsWith("/")) {
          resolvedUrl = baseUrl.origin + resolvedUrl;
        } else if (!resolvedUrl.startsWith("http")) {
          resolvedUrl = new URL(resolvedUrl, formattedUrl).href;
        }
        return { ...img, url: resolvedUrl };
      });

      const finalImages = resolvedImages.slice(0, 30);
      console.log(`Found ${finalImages.length} images from ${formattedUrl}`);

      return new Response(
        JSON.stringify({ success: true, images: finalImages, pageTitle, sourceUrl: formattedUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Generate AI captions for selected images ──
    if (action === "caption") {
      const { images, profession } = await req.json();
      if (!images?.length) throw new Error("Images are required");

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      const imageDescriptions = images
        .map((img: any, i: number) => `Image ${i + 1}: URL="${img.url}", Alt="${img.alt || "none"}"`)
        .join("\n");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a content specialist for a ${profession || "professional"}'s digital business card. Generate compelling titles and descriptions for portfolio/gallery images. Also detect if any pairs of images could represent a before/after transformation.`,
            },
            {
              role: "user",
              content: `Generate titles and descriptions for these ${images.length} images:\n\n${imageDescriptions}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_captions",
                description: "Return captions for each image and detect before/after pairs",
                parameters: {
                  type: "object",
                  properties: {
                    captions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          index: { type: "number", description: "0-based image index" },
                          title: { type: "string", description: "Short project title, max 60 chars" },
                          description: { type: "string", description: "Brief description, max 120 chars" },
                          category: {
                            type: "string",
                            enum: ["project", "service", "team", "workspace", "product", "other"],
                            description: "Image category",
                          },
                        },
                        required: ["index", "title", "description", "category"],
                        additionalProperties: false,
                      },
                    },
                    before_after_pairs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          before_index: { type: "number" },
                          after_index: { type: "number" },
                          title: { type: "string", description: "Title for the before/after pair" },
                        },
                        required: ["before_index", "after_index", "title"],
                        additionalProperties: false,
                      },
                      description: "Pairs of images that appear to show a before/after transformation",
                    },
                  },
                  required: ["captions", "before_after_pairs"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_captions" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI caption generation failed");
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error("No captions generated");
      }

      const captionData = JSON.parse(toolCall.function.arguments);

      return new Response(
        JSON.stringify({ success: true, ...captionData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Proxy-download an image (to upload to storage) ──
    if (action === "download") {
      const { imageUrl } = await req.json();
      if (!imageUrl) throw new Error("imageUrl is required");

      // SSRF protection: only allow HTTPS URLs
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        throw new Error("Invalid URL");
      }
      if (!ALLOWED_DOWNLOAD_PROTOCOLS.includes(parsedUrl.protocol)) {
        throw new Error("Only HTTPS URLs are allowed");
      }
      // Block private/internal IPs
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.") ||
        hostname.startsWith("192.168.") ||
        hostname.endsWith(".internal") ||
        hostname.endsWith(".local")
      ) {
        throw new Error("Internal URLs are not allowed");
      }

      const imgResp = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; guzzl.pro/1.0)",
          Accept: "image/*",
        },
      });

      if (!imgResp.ok) {
        throw new Error(`Failed to download image (${imgResp.status})`);
      }

      // Verify content-type is an image
      const contentType = imgResp.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        throw new Error("URL did not return an image");
      }

      const buffer = await imgResp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      return new Response(
        JSON.stringify({
          success: true,
          base64: `data:${contentType};base64,${base64}`,
          contentType,
          size: buffer.byteLength,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    console.error("ai-photo-import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
