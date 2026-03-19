import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRADE_PROMPTS: Record<string, string> = {
  contractor: "You write social media posts for a general contractor. Focus on project transformations, craftsmanship, reliability, and seasonal services. Use a confident, professional, down-to-earth tone.",
  barber: "You write social media posts for a barber/barbershop. Focus on fresh cuts, trending styles, grooming tips, and appointment availability. Use an energetic, trendy, and welcoming tone.",
  realtor: "You write social media posts for a real estate agent. Focus on property listings, market insights, home buying tips, and community highlights. Use a professional, trustworthy, and enthusiastic tone.",
  landscaper: "You write social media posts for a landscaping business. Focus on lawn transformations, seasonal yard care, curb appeal, and outdoor living. Use a friendly, knowledgeable, and visual tone.",
  general: "You write social media posts for a local service business. Focus on quality work, customer satisfaction, availability, and special offers. Use a professional yet approachable tone.",
};

const CONTENT_PROMPTS: Record<string, string> = {
  project_completed: "Write about a recently completed project, highlighting the quality of work and customer satisfaction.",
  before_after: "Write a before-and-after transformation post that showcases dramatic improvement.",
  now_booking: "Write a post announcing availability for new bookings, creating urgency.",
  tip: "Share a useful industry tip that positions the business as an expert.",
  promotion: "Write a promotional post with a compelling offer or seasonal deal.",
  fresh_cut: "Showcase a fresh haircut or style, describing the look and technique.",
  style_trend: "Discuss a trending style and how to achieve it.",
  open_slots: "Announce open appointment slots with a sense of urgency.",
  just_listed: "Announce a new property listing with key features and excitement.",
  just_sold: "Celebrate a recently sold property and thank the clients.",
  open_house: "Invite people to an upcoming open house event.",
  market_update: "Share a brief local real estate market insight.",
  seasonal_service: "Promote a seasonal service offering.",
  testimonial: "Create a post based on a glowing customer testimonial.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { campaign_id, campaign_type, content_types, profession } = await req.json();

    // Pick a random content type from the campaign's mix
    const contentType = content_types[Math.floor(Math.random() * content_types.length)];

    const systemPrompt = TRADE_PROMPTS[campaign_type] || TRADE_PROMPTS.general;
    const contentPrompt = CONTENT_PROMPTS[contentType] || "Write an engaging social media post for a local service business.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${contentPrompt}\n\nReturn a JSON object with these fields:\n- caption: The post caption (2-4 sentences, engaging)\n- hashtags: Array of 5-8 relevant hashtags (without #)\n- cta: A call-to-action line (e.g. "Book now", "DM for a free quote")\n- suggested_platform: Either "instagram" or "facebook"\n\nReturn ONLY valid JSON, no markdown.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_social_post",
              description: "Generate a social media post",
              parameters: {
                type: "object",
                properties: {
                  caption: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  cta: { type: "string" },
                  suggested_platform: { type: "string", enum: ["instagram", "facebook"] },
                },
                required: ["caption", "hashtags", "cta", "suggested_platform"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_social_post" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const postContent = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!postContent) throw new Error("Failed to parse AI response");

    const fullCaption = `${postContent.caption}\n\n${postContent.cta}\n\n${postContent.hashtags.map((h: string) => `#${h}`).join(" ")}`;

    // Create a social post as draft
    const { error: insertError } = await sb
      .from("social_posts")
      .insert({
        user_id: user.id,
        body: fullCaption,
        platforms: [postContent.suggested_platform],
        status: "draft",
        meta_json: {
          auto_campaign_id: campaign_id,
          content_type: contentType,
          ai_generated: true,
          hashtags: postContent.hashtags,
          cta: postContent.cta,
        },
      });

    if (insertError) throw insertError;

    // Increment posts_generated counter
    await (sb as any)
      .from("auto_campaigns")
      .update({ posts_generated: (await (sb as any).from("auto_campaigns").select("posts_generated").eq("id", campaign_id).single()).data.posts_generated + 1 })
      .eq("id", campaign_id);

    return new Response(JSON.stringify({ success: true, post: postContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-campaign-post error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
