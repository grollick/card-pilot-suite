import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROFESSION_BACKDROPS: Record<string, string> = {
  "Barber": "A stylish barbershop interior with warm lighting, leather chairs, vintage mirrors, and grooming tools arranged aesthetically",
  "Hair Stylist": "A modern hair salon with sleek styling stations, soft diffused lighting, and elegant decor",
  "Plumber": "A clean, professional workshop with copper pipes, tools neatly organized, and warm industrial lighting",
  "Electrician": "A modern electrical workshop with circuit boards, tools, and blue accent lighting",
  "Contractor": "A construction site at golden hour with architectural blueprints and building materials",
  "Real Estate Agent": "A luxury home interior with floor-to-ceiling windows, modern furniture, and city skyline view",
  "Photographer": "A creative photography studio with professional lighting equipment and colorful backdrops",
  "Personal Trainer": "A modern gym with sleek equipment, motivational atmosphere, and dynamic lighting",
  "Chef": "A professional kitchen with stainless steel counters, fresh ingredients, and warm ambient lighting",
  "Lawyer": "An elegant law office with mahogany bookshelves, leather-bound books, and warm desk lamp",
  "Dentist": "A modern, bright dental office with clean white surfaces and calming blue accents",
  "Mechanic": "A professional auto repair shop with classic cars, organized tools, and industrial lighting",
};

function getProfessionPrompt(profession: string): string {
  // Check exact match first
  if (PROFESSION_BACKDROPS[profession]) {
    return PROFESSION_BACKDROPS[profession];
  }
  // Check partial match
  for (const [key, prompt] of Object.entries(PROFESSION_BACKDROPS)) {
    if (profession.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(profession.toLowerCase())) {
      return prompt;
    }
  }
  return `A professional, clean workspace environment suitable for a ${profession}, with modern design elements and warm lighting`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profession, custom_prompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const basePrompt = custom_prompt || getProfessionPrompt(profession || "Professional");
    const fullPrompt = `Generate a wide banner backdrop image (landscape orientation, 16:9 aspect ratio). ${basePrompt}. The image should work well as a background behind a profile photo. Use a slight depth-of-field blur effect so the background doesn't compete with a foreground subject. Rich colors, professional quality, photorealistic.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: fullPrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Backdrop generation failed");
    }

    const result = await response.json();
    const imageData = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) throw new Error("No image returned from AI");

    return new Response(JSON.stringify({ success: true, image_url: imageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-backdrop error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
