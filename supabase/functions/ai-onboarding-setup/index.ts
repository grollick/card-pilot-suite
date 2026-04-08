import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROFESSION_TONE: Record<string, string> = {
  contractor: "Emphasize reliability, craftsmanship, on-time delivery, and licensed/insured status. Customers want trust and quality.",
  electrician: "Emphasize safety, fast response, emergency availability, and code compliance. Customers want someone reliable and quick.",
  plumber: "Emphasize speed, clean work, upfront pricing, and same-day availability. Customers want problems solved fast.",
  landscaper: "Emphasize visual transformation, curb appeal, and seasonal expertise. Customers want their outdoor space to look stunning.",
  painter: "Emphasize clean lines, attention to detail, and color expertise. Customers want flawless, lasting results.",
  realtor: "Emphasize trust, local market knowledge, negotiation skills, and client relationships. Customers want a partner, not a salesperson.",
  "real estate agent": "Emphasize trust, local market knowledge, negotiation skills, and client relationships. Customers want a partner, not a salesperson.",
  barber: "Emphasize precision cuts, modern styles, and a premium grooming experience. Clients want to walk out feeling confident.",
  stylist: "Emphasize personalized looks, color expertise, and a luxurious experience. Clients want to feel beautiful and understood.",
  photographer: "Emphasize storytelling, artistic vision, and capturing authentic moments. Clients want photos that move them.",
  "personal trainer": "Emphasize results, accountability, and customized programs. Clients want transformation and confidence.",
  mechanic: "Emphasize honesty, transparent pricing, and expertise. Customers want someone they trust with their vehicle.",
  "auto detailer": "Emphasize showroom results, paint protection, and meticulous attention to detail. Customers want their car looking brand new.",
  consultant: "Emphasize strategic insight, measurable results, and ROI. Clients want a clear path to growth.",
  cleaner: "Emphasize thoroughness, reliability, and trust. Customers want a spotless home without worry.",
  lawyer: "Emphasize expertise, discretion, and client advocacy. Clients want someone fighting for their best interests.",
  accountant: "Emphasize accuracy, tax savings, and proactive financial advice. Clients want peace of mind with their finances.",
  therapist: "Emphasize a safe space, empathy, and evidence-based approaches. Clients want to feel heard and supported.",
  dentist: "Emphasize gentle care, modern technology, and a comfortable experience. Patients want a dentist they're not afraid to visit.",
  tutor: "Emphasize personalized learning, patience, and measurable progress. Parents want their child to succeed confidently.",
  chef: "Emphasize fresh ingredients, creative menus, and memorable dining experiences. Clients want food that impresses.",
  "dog trainer": "Emphasize positive methods, patience, and lasting behavior change. Pet owners want a well-behaved, happy dog.",
  "wedding planner": "Emphasize attention to detail, stress-free execution, and creating magical moments. Couples want their dream day without the worry.",
  dj: "Emphasize reading the crowd, high-energy sets, and professional equipment. Clients want an unforgettable party.",
  "insurance agent": "Emphasize protection, savings, and personalized coverage. Clients want the right coverage at the best price.",
  "mortgage broker": "Emphasize best rates, fast approvals, and guiding clients through the process. Buyers want a smooth path to homeownership.",
  "graphic designer": "Emphasize brand identity, creative solutions, and visual impact. Clients want designs that stand out and convert.",
  "web developer": "Emphasize fast, responsive websites that drive results. Clients want a professional online presence that works.",
  "fitness instructor": "Emphasize energy, community, and fun workouts that get results. Clients want to enjoy getting fit.",
  massage: "Emphasize relaxation, pain relief, and therapeutic expertise. Clients want to leave feeling renewed.",
  esthetician: "Emphasize glowing skin, personalized treatments, and a luxurious experience. Clients want to look and feel radiant.",
  "nail technician": "Emphasize precision, creativity, and long-lasting results. Clients want nails that are a work of art.",
  hvac: "Emphasize comfort, efficiency, and fast response for heating and cooling emergencies. Customers want reliable climate control.",
  roofer: "Emphasize durability, storm readiness, and expert installation. Homeowners want a roof they never have to worry about.",
  "pest control": "Emphasize thorough treatment, prevention, and family-safe methods. Customers want pests gone for good.",
  "moving company": "Emphasize care, efficiency, and stress-free relocation. Customers want their belongings handled with respect.",
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

    const { profession, name, company, city, business_description } = await req.json();
    if (!profession) throw new Error("Profession is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const profLower = profession.toLowerCase();
    const toneGuide = PROFESSION_TONE[profLower] || `Focus on what makes a ${profession} trustworthy and valuable. Write from the customer's perspective — what do they want to hear?`;

    const systemPrompt = `You are an elite copywriter who creates digital business card content for local professionals. Your copy converts visitors into customers.

PROFESSION TONE GUIDE:
${toneGuide}

QUALITY RULES — FOLLOW STRICTLY:
1. NO generic fluff: never use "passionate professional", "years of experience", "dedicated to excellence", "committed to quality" or similar clichés
2. NO placeholders or brackets like [Your City]
3. NO repetition — each field must say something different
4. Be SPECIFIC to the profession — use real service names, real outcomes, real customer benefits
5. Write like a human, not a corporate brochure
6. Every sentence must pass the "so what?" test — if a customer wouldn't care, don't write it
7. The tagline should be punchy and memorable, not a mission statement
8. Services must be real offerings with actual descriptions, not vague categories
9. CTA text should create urgency without being pushy
10. Focus on CUSTOMER OUTCOMES, not self-praise

${business_description ? "IMPORTANT: The user has described their business. Use their exact specialties, niche, and unique selling points to make content highly personalized." : ""}`;

    const userPrompt = `Generate card content for:
- Profession: ${profession}
- Name: ${name || "Not provided"}
- Company: ${company || "Not provided"}
- City: ${city || "Not provided"}
${business_description ? `- Business Description: "${business_description}"` : ""}

Write content that would make a potential customer think "I need to contact this person right now."`;

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
              name: "generate_onboarding_setup",
              description: "Return a complete business card setup for the given profession",
              parameters: {
                type: "object",
                properties: {
                  tagline: { type: "string", description: "Punchy, memorable headline — max 60 chars. NOT a mission statement. Example: 'Sharp Cuts. Clean Fades. Walk Out Confident.'" },
                  bio: { type: "string", description: "1-2 sentence professional bio focused on what the customer gets — max 160 chars. No clichés." },
                  about: { type: "string", description: "2-3 sentence about section that tells the customer WHY to choose this person — max 300 chars. Specific to profession." },
                  cta_text: { type: "string", description: "Action-driven button text — max 25 chars. Examples: 'Get a Free Quote', 'Book Now', 'Schedule a Call'" },
                  marketplace_summary: { type: "string", description: "1-2 sentence marketplace listing that highlights the unique value — max 200 chars." },
                  services: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Real service name specific to profession" },
                        description: { type: "string", description: "What the customer gets — max 80 chars" },
                        duration_min: { type: "number", description: "Realistic duration in minutes" },
                        price_range: { type: "string", description: "Realistic price range like '$50-$100' or 'From $75'" },
                      },
                      required: ["name", "description", "duration_min", "price_range"],
                      additionalProperties: false,
                    },
                    description: "4-6 real, specific services this profession actually offers",
                  },
                  suggested_template: {
                    type: "string",
                    enum: ["modern", "service-pro", "portfolio-showcase", "contractor-pro", "consultant-executive", "health-wellness", "beauty-glam", "educator-coach", "food-events", "auto-specialist"],
                    description: "Best matching card template ID for this profession",
                  },
                  setup_tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 actionable tips for optimizing this profession's card",
                  },
                },
                required: ["tagline", "bio", "about", "cta_text", "marketplace_summary", "services", "suggested_template", "setup_tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_onboarding_setup" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI setup generation failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No setup content generated");
    }

    const content = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, setup: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-onboarding-setup error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
