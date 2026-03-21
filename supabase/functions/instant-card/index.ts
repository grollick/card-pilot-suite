import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { business_name, url: externalUrl } = await req.json();
    if (!business_name?.trim()) {
      return new Response(JSON.stringify({ error: "Business name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: If URL provided, try to scrape it for context
    let scrapedContext = "";
    let scrapedImages: string[] = [];

    if (externalUrl?.trim()) {
      try {
        const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
        if (FIRECRAWL_KEY) {
          let formattedUrl = externalUrl.trim();
          if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formattedUrl,
              formats: ["markdown", "links"],
              onlyMainContent: true,
            }),
          });

          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
            scrapedContext = markdown.slice(0, 3000);

            // Extract OG image if available
            const metadata = scrapeData?.data?.metadata || scrapeData?.metadata || {};
            if (metadata.ogImage) scrapedImages.push(metadata.ogImage);
            if (metadata.image) scrapedImages.push(metadata.image);
          }
        }
      } catch (e) {
        console.error("Scrape failed (non-critical):", e);
      }
    }

    // Step 2: Detect platform from URL
    let platform = "website";
    if (externalUrl) {
      const lower = externalUrl.toLowerCase();
      if (lower.includes("instagram.com")) platform = "instagram";
      else if (lower.includes("facebook.com") || lower.includes("fb.com")) platform = "facebook";
      else if (lower.includes("tiktok.com")) platform = "tiktok";
    }

    // Step 3: AI generation with scraped context
    const systemPrompt = `You are an expert digital business card designer. Generate a COMPLETE, ready-to-use card from minimal input.

${scrapedContext ? `SCRAPED WEBSITE CONTENT (use this to inform your generation — extract real services, description, and business details):\n${scrapedContext}\n` : ""}

Generate realistic, compelling content. Do NOT use generic filler. Make it sound like a real business.
For services, provide 4-6 specific services with brief descriptions.
For testimonials, create 2-3 realistic reviews.
Choose colors that match the business type and feel professional.`;

    const userPrompt = `Create a complete digital business card for:
- Business name: ${business_name}
${externalUrl ? `- Source URL: ${externalUrl} (platform: ${platform})` : "- No website provided"}
${scrapedContext ? "- Website content has been scraped and provided in system context" : ""}

Generate everything needed for a professional card.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_instant_card",
              description: "Generate a complete card with all sections and styling",
              parameters: {
                type: "object",
                properties: {
                  profession: { type: "string", description: "Detected profession/trade type" },
                  tagline: { type: "string", description: "Compelling headline (max 80 chars)" },
                  bio: { type: "string", description: "Professional bio (max 200 chars)" },
                  about: { type: "string", description: "About section (max 300 chars)" },
                  cta_text: { type: "string", description: "CTA button text e.g. 'Book Now', 'Get a Quote'" },
                  services: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                    },
                    description: "4-6 services",
                  },
                  testimonials: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        text: { type: "string" },
                        rating: { type: "number" },
                      },
                      required: ["name", "text", "rating"],
                    },
                    description: "2-3 testimonials",
                  },
                  theme: {
                    type: "object",
                    properties: {
                      primary_color: { type: "string", description: "Hex color" },
                      secondary_color: { type: "string", description: "Hex color" },
                      accent_color: { type: "string", description: "Hex color" },
                      style: { type: "string", enum: ["modern", "bold", "elegant", "minimal"] },
                    },
                    required: ["primary_color", "style"],
                  },
                  sections_order: {
                    type: "array",
                    items: { type: "string" },
                    description: "Ordered section IDs: hero, about, services, testimonials, gallery, contact, social, booking",
                  },
                  social_links: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        platform: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["platform", "url"],
                    },
                    description: "Detected social links from scraped content",
                  },
                },
                required: ["profession", "tagline", "bio", "about", "cta_text", "services", "testimonials", "theme", "sections_order"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_instant_card" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No content generated");
    }

    const card = JSON.parse(toolCall.function.arguments);

    // Add scraped images if available
    if (scrapedImages.length > 0) {
      card.scraped_images = scrapedImages;
    }
    if (externalUrl) {
      // Ensure the source URL is in social links
      if (!card.social_links) card.social_links = [];
      const hasSource = card.social_links.some((l: any) => l.url === externalUrl);
      if (!hasSource) {
        card.social_links.push({ platform, url: externalUrl });
      }
    }

    return new Response(JSON.stringify({ success: true, card }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("instant-card error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate card. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
