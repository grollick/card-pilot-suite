import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fast model first
const IMAGE_MODELS = [
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-3-pro-image-preview",
];

function extractImageUrl(choice: any): string | undefined {
  if (choice?.content && Array.isArray(choice.content)) {
    for (const part of choice.content) {
      if (part?.type === "image_url" && part.image_url?.url) return part.image_url.url;
      if (part?.inline_data?.data) return `data:${part.inline_data.mime_type || "image/png"};base64,${part.inline_data.data}`;
    }
  }
  if (choice?.images?.[0]) {
    const img = choice.images[0];
    return img.image_url?.url || img.url || (img.data ? `data:image/png;base64,${img.data}` : undefined);
  }
  return undefined;
}

// Only 1 best reference + avatar for speed
const IDENTITY_REF_URL = "https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/identity-refs/gary-ref-1.jpg";

function buildReferenceMessageContent(prompt: string, avatarUrl?: string, ownerLabel = "the business owner") {
  if (!avatarUrl) return [{ type: "text", text: prompt }];

  return [
    { type: "image_url", image_url: { url: avatarUrl } },
    { type: "image_url", image_url: { url: IDENTITY_REF_URL } },
    {
      type: "text",
      text: `These are 2 reference photos of ${ownerLabel}. Generate the SAME exact person. ${prompt}

IDENTITY RULES: Preserve face shape, skin tone, age (~45-50), receding hairline, salt-and-pepper hair, full dark beard. Do not beautify or de-age. The person must be instantly recognizable. Photorealistic only, no text/logos.`,
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { image_description, image_query, post_style, post_title } = await req.json();
    if (!image_description && !image_query) throw new Error("image_description or image_query is required");

    const [profileResult, businessResult] = await Promise.all([
      sb.from("profiles")
        .select("name, company, city, bio, avatar_url, profession_id, professions(name, category)")
        .eq("id", user.id)
        .single(),
      sb.from("businesses")
        .select("business_name, description, location_city, location_region")
        .eq("owner_user_id", user.id)
        .maybeSingle(),
    ]);

    const profile = profileResult.data as any;
    const business = businessResult.data as any;
    const avatarUrl = profile?.avatar_url || null;

    const professionName = profile?.professions?.name ?? "service professional";
    const businessName = business?.business_name?.trim() || profile?.company?.trim() || profile?.name?.trim() || professionName;
    const locationCity = business?.location_city?.trim() || profile?.city?.trim() || "";
    const ownerLabel = profile?.name?.trim() || businessName;

    const prompt = `Social media image for ${businessName}${locationCity ? ` in ${locationCity}` : ""}. Concept: ${image_description || image_query || post_title || "professional business imagery"}. Feature ${ownerLabel} as the main subject. Landscape, photorealistic, no text/logos.`;

    let lastError = "";

    for (const model of IMAGE_MODELS) {
      try {
        console.log(`Trying model: ${model}`);
        const messageContent: any[] = buildReferenceMessageContent(prompt, avatarUrl || undefined, ownerLabel);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: messageContent }],
            modalities: ["image", "text"],
          }),
        });

        if (response.status === 429) {
          console.warn(`Model ${model} rate limited, trying next model...`);
          lastError = `${model}: rate limited (429)`;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!response.ok) {
          const text = await response.text();
          console.error(`Model ${model} failed (${response.status}):`, text);
          lastError = `${model}: ${response.status}`;
          continue;
        }

        const result = await response.json();
        const imageUrl = extractImageUrl(result.choices?.[0]?.message);
        if (imageUrl) {
          console.log(`Success with model: ${model}`);
          return new Response(JSON.stringify({ success: true, image_url: imageUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.error(`Model ${model} returned no image`);
        lastError = `${model}: no image in response`;
      } catch (err) {
        console.error(`Model ${model} threw:`, err);
        lastError = `${model}: ${String(err)}`;
      }
    }

    console.error("All models failed. Last error:", lastError);
    return new Response(
      JSON.stringify({ error: "Image generation failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("regenerate-post-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
