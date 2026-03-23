import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { image_base64, image_url } = await req.json();

    if (!image_base64 && !image_url) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageContent = image_url
      ? { type: "image_url" as const, image_url: { url: image_url } }
      : { type: "image_url" as const, image_url: { url: `data:image/jpeg;base64,${image_base64}` } };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a receipt OCR assistant. Extract expense data from receipt images.
Always respond using the extract_receipt_data function tool.
Extract: description (store/merchant name + brief summary), amount (total paid as a number), vendor (store/merchant name), date (YYYY-MM-DD format), category (one of: materials, labor, equipment, fuel, subcontractor, permits, tools, office, other).
If you can't read something clearly, make your best guess. For the category, infer from the items purchased.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the expense data from this receipt image." },
              imageContent,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extract structured expense data from a receipt",
              parameters: {
                type: "object",
                properties: {
                  description: { type: "string", description: "Brief description of the purchase" },
                  amount: { type: "number", description: "Total amount paid" },
                  vendor: { type: "string", description: "Store or merchant name" },
                  date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  category: {
                    type: "string",
                    enum: ["materials", "labor", "equipment", "fuel", "subcontractor", "permits", "tools", "office", "other"],
                  },
                },
                required: ["description", "amount", "vendor", "date", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured data returned from AI");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-receipt error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
