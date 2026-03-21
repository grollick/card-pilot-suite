import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.com")) return "facebook";
  if (u.includes("tiktok.com")) return "tiktok";
  return "website";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { url } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const platform = detectPlatform(formattedUrl);

    // ── Scrape with Firecrawl ──
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Content import requires Firecrawl. Please enable it in Settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping ${platform} URL: ${formattedUrl}`);

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "html", "links"],
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
      return new Response(
        JSON.stringify({ error: errData.error || `Failed to scan URL (${scrapeResponse.status})` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || scrapeData.html || "";
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // ── Extract images from HTML ──
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
    const ogImgRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    const images: { url: string; alt: string }[] = [];
    const seen = new Set<string>();

    // OG images first (higher quality)
    let ogMatch;
    while ((ogMatch = ogImgRegex.exec(html)) !== null) {
      if (!seen.has(ogMatch[1])) {
        seen.add(ogMatch[1]);
        images.push({ url: ogMatch[1], alt: "Featured" });
      }
    }

    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const imgUrl = imgMatch[1];
      if (
        seen.has(imgUrl) ||
        imgUrl.includes("data:image/svg") ||
        imgUrl.includes("favicon") ||
        imgUrl.includes("pixel") ||
        imgUrl.includes("tracker") ||
        imgUrl.includes("1x1") ||
        imgUrl.endsWith(".svg") ||
        imgUrl.endsWith(".ico")
      ) continue;

      const widthMatch = imgMatch[0].match(/width=["']?(\d+)/);
      const width = widthMatch ? parseInt(widthMatch[1]) : undefined;
      if (width && width < 80) continue;

      seen.add(imgUrl);
      images.push({ url: imgUrl, alt: imgMatch[2] || "" });
    }

    // Resolve relative URLs
    const baseUrl = new URL(formattedUrl);
    const resolvedImages = images.map((img) => {
      let u = img.url;
      if (u.startsWith("//")) u = baseUrl.protocol + u;
      else if (u.startsWith("/")) u = baseUrl.origin + u;
      else if (!u.startsWith("http")) u = new URL(u, formattedUrl).href;
      return { ...img, url: u };
    }).slice(0, 20);

    // ── Use AI to extract structured business content ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate markdown for AI context
    const truncatedMarkdown = markdown.slice(0, 6000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You extract business information from website content. Be concise and professional. Platform source: ${platform}.`,
          },
          {
            role: "user",
            content: `Extract business information from this ${platform} page:\n\nPage Title: ${metadata.title || ""}\nPage Description: ${metadata.description || ""}\n\nContent:\n${truncatedMarkdown}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_business_content",
              description: "Extract structured business content from a webpage",
              parameters: {
                type: "object",
                properties: {
                  businessName: { type: "string", description: "Business or person name" },
                  tagline: { type: "string", description: "Short tagline or slogan, max 80 chars" },
                  description: { type: "string", description: "About/bio text, max 300 chars" },
                  services: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name"],
                      additionalProperties: false,
                    },
                    description: "Services or offerings found",
                  },
                  socialLinks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        platform: { type: "string", enum: ["Instagram", "Facebook", "TikTok", "Twitter/X", "LinkedIn", "YouTube", "Website"] },
                        url: { type: "string" },
                      },
                      required: ["platform", "url"],
                      additionalProperties: false,
                    },
                    description: "Social media links found on the page",
                  },
                  phone: { type: "string", description: "Phone number if found" },
                  email: { type: "string", description: "Email if found" },
                  location: { type: "string", description: "City or address if found" },
                  profileImageUrl: { type: "string", description: "URL of profile/avatar image if identifiable" },
                  coverImageUrl: { type: "string", description: "URL of cover/banner image if identifiable" },
                },
                required: ["businessName", "description", "services", "socialLinks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_business_content" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI error:", aiResponse.status);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let extracted: any = {};
    if (toolCall?.function?.arguments) {
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI output");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        sourceUrl: formattedUrl,
        pageTitle: metadata.title || "",
        extracted,
        images: resolvedImages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("content-import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
