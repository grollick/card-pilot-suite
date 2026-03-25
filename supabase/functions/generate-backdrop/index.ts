import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  if (PROFESSION_BACKDROPS[profession]) return PROFESSION_BACKDROPS[profession];
  for (const [key, prompt] of Object.entries(PROFESSION_BACKDROPS)) {
    if (profession.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(profession.toLowerCase())) {
      return prompt;
    }
  }
  return `A professional, clean workspace environment suitable for a ${profession}, with modern design elements and warm lighting`;
}

// Try models in order of preference
const IMAGE_MODELS = [
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-3-pro-image-preview",
  "google/gemini-2.5-flash-image",
];

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

    const { profession, custom_prompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const basePrompt = custom_prompt || getProfessionPrompt(profession || "Professional");
    const fullPrompt = `Generate a wide banner backdrop image (landscape orientation, 16:9 aspect ratio). ${basePrompt}. The image should work well as a background behind a profile photo. Use a slight depth-of-field blur effect so the background doesn't compete with a foreground subject. Rich colors, professional quality, photorealistic.`;

    let lastError = "";

    for (const model of IMAGE_MODELS) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: fullPrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!response.ok) {
          const text = await response.text();
          console.error(`Model ${model} failed (${response.status}):`, text);
          lastError = `${model}: ${response.status}`;
          continue; // try next model
        }

        const result = await response.json();
        const imageData = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageData) {
          console.error(`Model ${model} returned no image. Response:`, JSON.stringify(result).slice(0, 500));
          lastError = `${model}: no image in response`;
          continue; // try next model
        }

        console.log(`Success with model: ${model}`);
        return new Response(JSON.stringify({ success: true, image_url: imageData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (modelErr) {
        console.error(`Model ${model} threw:`, modelErr);
        lastError = `${model}: ${String(modelErr)}`;
        continue;
      }
    }

    // All models failed
    console.error("All models failed. Last error:", lastError);
    return new Response(
      JSON.stringify({ error: "Backdrop generation failed after trying multiple models. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-backdrop error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
