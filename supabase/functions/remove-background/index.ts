import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Remove the background from this image completely. Make the background fully transparent or white. Keep only the person/subject in the foreground with clean, precise edges. Return the result as an image.",
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        modalities: ["text", "image"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Background removal failed");
    }

    const result = await response.json();
    console.log("AI response keys:", JSON.stringify(Object.keys(result)));

    // Try multiple response formats
    const choice = result.choices?.[0]?.message;
    let imageData: string | undefined;

    // Format 1: inline_data in parts
    if (choice?.content && Array.isArray(choice.content)) {
      for (const part of choice.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          imageData = part.image_url.url;
          break;
        }
        if (part.inline_data?.data) {
          imageData = `data:${part.inline_data.mime_type || "image/png"};base64,${part.inline_data.data}`;
          break;
        }
      }
    }

    // Format 2: images array
    if (!imageData && choice?.images?.[0]) {
      const img = choice.images[0];
      imageData = img.image_url?.url || img.url || (img.data ? `data:image/png;base64,${img.data}` : undefined);
    }

    if (!imageData) {
      console.error("Could not find image in response:", JSON.stringify(result).slice(0, 500));
      throw new Error("No image returned from AI");
    }

    return new Response(JSON.stringify({ success: true, image_url: imageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("remove-background error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
