import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STYLE_PROMPTS: Record<string, string> = {
  cartoon:
    "Transform this photo into a fun, colorful cartoon illustration style. Keep the person's likeness, features, and pose recognizable but render them as a vibrant cartoon character with bold outlines, smooth shading, and exaggerated friendly features. Use a clean white background.",
  anime:
    "Transform this photo into a high-quality anime/manga art style. Keep the person's likeness and pose recognizable. Use clean lines, large expressive eyes, and soft cel-shading typical of modern anime. Use a clean white background.",
  pixar:
    "Transform this photo into a Pixar/3D animated movie character style. Keep the person's likeness recognizable with slightly exaggerated proportions, smooth skin, big expressive eyes, and warm lighting typical of Pixar films. Use a clean white background.",
  comic:
    "Transform this photo into a bold comic book / graphic novel illustration. Keep the person's likeness. Use strong black ink outlines, halftone dots, dramatic shadows, and vibrant pop-art colors. Use a clean white background.",
  watercolor:
    "Transform this photo into a beautiful loose watercolor painting. Keep the person's likeness recognizable. Use soft, translucent washes of color, visible brushstrokes, gentle color bleeds, and artistic imperfections typical of watercolor art. Use a clean white background.",
};

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

    const { image_url, style = "cartoon" } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    const prompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image_url } },
              ],
            },
          ],
          modalities: ["text", "image"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Cartoonize failed");
    }

    const result = await response.json();
    const choice = result.choices?.[0]?.message;
    let imageData: string | undefined;

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

    if (!imageData && choice?.images?.[0]) {
      const img = choice.images[0];
      imageData =
        img.image_url?.url ||
        img.url ||
        (img.data ? `data:image/png;base64,${img.data}` : undefined);
    }

    if (!imageData) {
      console.error(
        "Could not find image in response:",
        JSON.stringify(result).slice(0, 500)
      );
      throw new Error("No image returned from AI");
    }

    return new Response(JSON.stringify({ success: true, image_url: imageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cartoonize-avatar error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
