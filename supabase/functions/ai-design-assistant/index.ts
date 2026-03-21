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
    const { business_type, services, city, style, primary_cta, name, company, template } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build template-aware context for the AI
    let templateContext = "";
    if (template) {
      const enabledSections = template.sections
        ?.filter((s: any) => s.enabled)
        .map((s: any) => s.id) || [];
      const disabledSections = template.sections
        ?.filter((s: any) => !s.enabled)
        .map((s: any) => s.id) || [];

      templateContext = `
MATCHED TEMPLATE: "${template.name}" (${template.id})
Template Category: ${template.category}
Template Style: ${template.style}
CTA Priority Order: ${(template.ctaPriority || []).join(" → ")}
Emphasis: Hero style="${template.emphasis?.heroStyle}", Gallery=${template.emphasis?.showGallery}, Booking=${template.emphasis?.showBooking}, Quotes=${template.emphasis?.showQuote}, Testimonials=${template.emphasis?.showTestimonials}
Enabled Sections (in order): ${enabledSections.join(", ")}
Disabled Sections: ${disabledSections.join(", ") || "none"}
Sample Tagline: "${template.preview?.tagline || ""}"
Sample Services: ${(template.preview?.sampleServices || []).join(", ")}
Sample Review: "${template.preview?.sampleReview || ""}"

CRITICAL: You MUST follow this template's structure. Use the enabled sections in the given order for sections_order. Model your generated content after the sample data above — it represents the ideal tone and focus for this profession. If the template emphasizes quotes/gallery/booking, generate richer content for those sections.`;
    }

    const systemPrompt = `You are an expert digital business card designer for service professionals. Given a user's business details AND a matched profession template, generate a COMPLETE card layout with content, sections, and theme settings.

${templateContext}

PROFESSION-SPECIFIC RULES (use these as additional guidance):
- Contractors/Trades: Emphasize projects, quote requests, trust badges, before/after work
- Barbers/Beauty: Emphasize gallery, booking, social links, style showcase
- Realtors/Sales: Emphasize testimonials, contact form, professional headshot, market expertise
- Photographers/Creatives: Emphasize portfolio/gallery, testimonials, booking, visual storytelling
- Landscapers/Outdoor: Emphasize before/after projects, seasonal promos, booking, outdoor transformations

STYLE RULES:
- modern: Clean lines, minimal, sans-serif fonts, subtle gradients
- classic: Serif accents, traditional layouts, muted tones
- bold: High contrast, large typography, vibrant colors
- elegant: Refined palette, thin fonts, luxurious feel

Generate realistic, profession-specific content that matches the template's tone and focus. Do NOT use generic filler text. Content must feel authentic to a real ${business_type || "professional"}.`;

    const userPrompt = `Create a complete digital business card for:
- Business type: ${business_type}
- Services offered: ${services || "Not specified"}
- City/Region: ${city || "Not specified"}
- Preferred style: ${style || template?.style?.toLowerCase() || "modern"}
- Primary CTA: ${primary_cta || template?.ctaPriority?.[0] || "Book Now"}
- Name: ${name || "Not provided"}
- Company: ${company || "Not provided"}
${template ? `- Matched template: ${template.name} (${template.category})` : ""}

Generate complete content for every section with realistic, compelling copy that sounds like a real ${business_type || "business"} in ${city || "your area"}.`;

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
              name: "generate_full_card",
              description: "Generate a complete card layout with sections, content, and theme",
              parameters: {
                type: "object",
                properties: {
                  hero: {
                    type: "object",
                    properties: {
                      tagline: { type: "string", description: "Compelling headline/tagline (max 80 chars)" },
                      bio: { type: "string", description: "Professional bio (max 200 chars)" },
                    },
                    required: ["tagline", "bio"],
                  },
                  services: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string", description: "1-sentence description" },
                        price_hint: { type: "string", description: "e.g. 'From $99' or 'Free estimate'" },
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
                        text: { type: "string", description: "1-2 sentence testimonial" },
                        rating: { type: "number" },
                      },
                      required: ["name", "text", "rating"],
                    },
                    description: "2-3 testimonials",
                  },
                  promo: {
                    type: "object",
                    properties: {
                      headline: { type: "string" },
                      body: { type: "string" },
                      cta_text: { type: "string" },
                    },
                    required: ["headline", "body", "cta_text"],
                  },
                  about: {
                    type: "string",
                    description: "2-3 sentence about section (max 300 chars)",
                  },
                  cta_text: {
                    type: "string",
                    description: "Primary call-to-action button text",
                  },
                  sections_order: {
                    type: "array",
                    items: { type: "string" },
                    description: "Ordered list of section IDs to enable: hero, about, services, testimonials, gallery, projects, booking, contact, social, quote_request, quote_calculator",
                  },
                  theme: {
                    type: "object",
                    properties: {
                      primary_color: { type: "string", description: "Hex color for primary" },
                      secondary_color: { type: "string", description: "Hex color for secondary" },
                      accent_color: { type: "string", description: "Hex color for accent" },
                      background_color: { type: "string", description: "Hex color for background" },
                      font_primary: { type: "string", description: "Google font name for headings" },
                      font_secondary: { type: "string", description: "Google font name for body" },
                      border_radius: { type: "string", enum: ["none", "sm", "md", "lg", "full"] },
                    },
                    required: ["primary_color", "secondary_color", "accent_color", "background_color"],
                  },
                },
                required: ["hero", "services", "testimonials", "promo", "about", "cta_text", "sections_order", "theme"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_full_card" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
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

    const content = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-design-assistant error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "AI assistant temporarily unavailable. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
