import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fast model first — flash is much quicker for image gen
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

// Only use 1 best reference image + avatar (2 total) to keep generation fast
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

async function generateImage(LOVABLE_API_KEY: string, prompt: string, avatarUrl?: string, ownerLabel = "the business owner"): Promise<string | null> {
  for (const model of IMAGE_MODELS) {
    try {
      console.log(`Trying image model: ${model}`);
      const messageContent: any[] = buildReferenceMessageContent(prompt, avatarUrl, ownerLabel);

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
      if (!response.ok) { console.error(`Image gen failed ${model}:`, response.status); continue; }
      const result = await response.json();
      const url = extractImageUrl(result.choices?.[0]?.message);
      if (url) { console.log(`Success with model: ${model}`); return url; }
    } catch (e) { console.error(`Image gen error ${model}:`, e); }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { topic, platforms, profession, company, city, services, avatar_url, owner_name } = await req.json();

    const platformStr = (platforms && platforms.length > 0) ? platforms.join(", ") : "social media";
    const professionStr = profession || "small business owner";
    const companyStr = company ? ` for ${company}` : "";
    const cityStr = city ? ` in ${city}` : "";
    const servicesStr = (services && services.length > 0) ? `\nServices offered: ${services.join(", ")}` : "";
    const ownerLabel = owner_name || company || professionStr || "the business owner";

    const userPrompt = topic?.trim()
      ? `Write a social media post about: "${topic}" for a ${professionStr}${companyStr}${cityStr} posting on ${platformStr}.${servicesStr}`
      : `Write an engaging social media post for a ${professionStr}${companyStr}${cityStr} posting on ${platformStr}.${servicesStr}\nPick a creative angle — could be a tip, promotion, behind-the-scenes, testimonial prompt, or seasonal content.`;

    // Step 1: Generate text (fast)
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
            content: `You are a social media copywriter for contractors, tradespeople, and service business owners. Write punchy, authentic posts that feel human — not corporate. Use language like "contractor", "service pro", "service owner", "local pro" naturally. Include emojis naturally. Keep captions under 280 chars for Twitter compatibility but engaging for all platforms. Always end with a clear CTA.`,
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "compose_post",
              description: "Return the composed social media post content with an image description",
              parameters: {
                type: "object",
                properties: {
                  content: { type: "string", description: "The full post caption with emojis and CTA" },
                  hashtags: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-8 relevant hashtags without # prefix",
                  },
                  image_prompt: { type: "string", description: "A short prompt to generate a social media image for this post. Describe the scene briefly." },
                },
                required: ["content", "hashtags", "image_prompt"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "compose_post" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const result = JSON.parse(toolCall.function.arguments);

    // Step 2: Generate image (can be slow — but flash model is much faster)
    if (result.image_prompt) {
      const fullPrompt = `Social media image: ${result.image_prompt}. Feature ${ownerLabel} as the main subject. Landscape, photorealistic.`;
      const imageUrl = await generateImage(LOVABLE_API_KEY, fullPrompt, avatar_url || undefined, ownerLabel);
      if (imageUrl) result.image_url = imageUrl;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-quick-compose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
