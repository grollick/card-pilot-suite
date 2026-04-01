import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_MODELS = [
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-3-pro-image-preview",
];

function extractImageUrl(choice: any): string | undefined {
  if (choice?.content && Array.isArray(choice.content)) {
    for (const part of choice.content) {
      if (part?.type === "image_url" && part.image_url?.url) {
        return part.image_url.url;
      }
      if (part?.inline_data?.data) {
        return `data:${part.inline_data.mime_type || "image/png"};base64,${part.inline_data.data}`;
      }
    }
  }

  if (choice?.images?.[0]) {
    const img = choice.images[0];
    return img.image_url?.url || img.url || (img.data ? `data:image/png;base64,${img.data}` : undefined);
  }

  return undefined;
}

function sanitizeTagQuery(parts: Array<string | undefined | null>) {
  return parts
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 6)
    .join(",") || "professional,business";
}

function buildFallbackImageUrl(parts: Array<string | undefined | null>, index: number) {
  const tagQuery = sanitizeTagQuery(parts);
  return `https://loremflickr.com/1200/900/${tagQuery}?lock=${Date.now()}-${index}-${crypto.randomUUID()}`;
}

async function generateBusinessImage({
  LOVABLE_API_KEY,
  businessName,
  professionName,
  locationLabel,
  businessDescription,
  servicesList,
  post,
  index,
  total,
}: {
  LOVABLE_API_KEY: string;
  businessName: string;
  professionName: string;
  locationLabel: string;
  businessDescription: string;
  servicesList: string[];
  post: any;
  index: number;
  total: number;
}) {
  const serviceSnippet = servicesList.length
    ? `Core offers: ${servicesList.slice(0, 4).join(", ")}.`
    : "";

  const prompt = [
    `Create a photorealistic social media marketing image for ${businessName}.`,
    `${businessName} is a ${professionName}${locationLabel ? ` based in ${locationLabel}` : ""}.`,
    businessDescription ? `Business context: ${businessDescription}` : "",
    serviceSnippet,
    `This image is variation ${index + 1} of ${total}, so it must look visually distinct from the other images in the batch.`,
    `Post style: ${post.style}.`,
    `Image concept: ${post.image_description || post.image_query || post.title}.`,
    `Match the actual business context; do not default to construction, hard hats, or trade imagery unless the business context clearly supports it.`,
    `Avoid generic stock-photo poses. No text, no logos, no watermarks, no UI screenshots, no split panels. Landscape composition for a social media tile.`,
  ]
    .filter(Boolean)
    .join(" ");

  for (const model of IMAGE_MODELS) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Image generation failed for ${model}:`, response.status, text);
        continue;
      }

      const result = await response.json();
      const imageUrl = extractImageUrl(result.choices?.[0]?.message);
      if (imageUrl) return imageUrl;
    } catch (error) {
      console.error(`Image generation error for ${model}:`, error);
    }
  }

  return buildFallbackImageUrl(
    [businessName, professionName, post.style, post.image_query, post.title],
    index,
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await sb.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const requestBody = await req.json().catch(() => ({}));
    const platforms = Array.isArray(requestBody?.platforms) ? requestBody.platforms : ["Instagram", "Facebook"];
    const topic = typeof requestBody?.topic === "string" ? requestBody.topic.trim() : "";
    const count = typeof requestBody?.count === "number" ? requestBody.count : 4;
    const postCount = Math.min(Math.max(count || 4, 1), 6);

    const [profileResult, servicesResult, businessResult] = await Promise.all([
      sb.from("profiles")
        .select("name, company, city, bio, profession_id, professions(name, category)")
        .eq("id", user.id)
        .single(),
      sb.from("booking_services")
        .select("name, description, price")
        .eq("user_id", user.id)
        .eq("active", true)
        .limit(10),
      sb.from("businesses")
        .select("business_name, description, location_city, location_region, slug")
        .eq("owner_user_id", user.id)
        .maybeSingle(),
    ]);

    const profile = profileResult.data as any;
    const services = servicesResult.data ?? [];
    const business = businessResult.data as any;

    const professionName = profile?.professions?.name ?? "service professional";
    const professionCategory = profile?.professions?.category ?? "general";
    const userName = profile?.name?.trim() ?? "";
    const businessName = business?.business_name?.trim() || profile?.company?.trim() || userName || professionName;
    const locationCity = business?.location_city?.trim() || profile?.city?.trim() || "";
    const locationRegion = business?.location_region?.trim() || "";
    const locationLabel = [locationCity, locationRegion].filter(Boolean).join(", ");
    const businessDescription = business?.description?.trim() || profile?.bio?.trim() || "";

    const servicesList = services.map((service: any) => {
      const parts = [service.name?.trim()];
      if (service.price) parts.push(`$${service.price}`);
      if (service.description) parts.push(service.description.trim());
      return parts.filter(Boolean).join(" — ");
    }).filter(Boolean);

    const servicesContext = servicesList.length > 0
      ? `\nActual services offered:\n${servicesList.map((service: string) => `• ${service}`).join("\n")}`
      : "\nNo service list is available, so stay close to the company/profession context without inventing technical offers.";

    const systemPrompt = `You are a social media strategist creating posts for a real business, not generic template content.
Business name: ${businessName}
Owner/founder: ${userName || "not specified"}
Profession: ${professionName}
Industry category: ${professionCategory}
Location: ${locationLabel || "not specified"}
Business description: ${businessDescription || "not provided"}${servicesContext}

CRITICAL RULES:
- Every post must be clearly about this exact business.
- Keep the content grounded in the provided business context.
- Do not default to contractor, home service, or blue-collar imagery unless the business context explicitly supports it.
- If this is a software, consulting, coaching, marketing, or platform business, reflect that directly.
- Use the company name naturally where it helps the post feel specific.
- Make each post angle noticeably different from the others.
- Each image_query must describe a visually distinct scene that matches the post and the business.`;

    const userPrompt = `Generate ${postCount} unique social media post ideas${topic ? ` about: "${topic}"` : ""} for ${businessName}.
Target platforms: ${platforms.join(", ")}.

Required mix:
1. Showcase/portfolio post
2. Educational tip or insight post
3. Promotional or offer-oriented post
4. Personal, founder, or behind-the-scenes post
${postCount > 4 ? "5. Timely or seasonal post\n6. Testimonial or proof post" : ""}

For every post:
- write a concise title
- write a strong caption
- include 5-8 hashtags
- include a CTA
- include an image_query for a stock or AI image search
- include an image_description describing exactly what should be pictured`;

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
              name: "generate_post_ideas",
              description: `Generate ${postCount} business-specific social media post ideas with distinct image suggestions`,
              parameters: {
                type: "object",
                properties: {
                  posts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short label for this post idea (3-7 words)" },
                        caption: { type: "string", description: "Full post caption (2-4 sentences, engaging, under 300 chars)" },
                        hashtags: { type: "array", items: { type: "string" }, description: "5-8 relevant hashtags without #" },
                        cta: { type: "string", description: "Call-to-action line" },
                        image_query: { type: "string", description: "Specific image search query for this exact business post" },
                        image_description: { type: "string", description: "Detailed description of what the ideal image should show" },
                        style: { type: "string", enum: ["showcase", "educational", "promotional", "personal"], description: "Post style category" },
                      },
                      required: ["title", "caption", "hashtags", "cta", "image_query", "image_description", "style"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["posts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_post_ideas" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const result = JSON.parse(toolCall.function.arguments);

    if (Array.isArray(result.posts) && result.posts.length > 0) {
      const imageUrls = await Promise.all(
        result.posts.map((post: any, index: number) =>
          generateBusinessImage({
            LOVABLE_API_KEY,
            businessName,
            professionName,
            locationLabel,
            businessDescription,
            servicesList,
            post,
            index,
            total: result.posts.length,
          })
        )
      );

      result.posts = result.posts.map((post: any, index: number) => ({
        ...post,
        image_url: imageUrls[index] || buildFallbackImageUrl(
          [businessName, professionName, post.style, post.image_query, post.title],
          index,
        ),
      }));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-ideas error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});