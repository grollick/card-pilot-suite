import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GOAL_PROMPTS: Record<string, string> = {
  leads:
    "Focus on generating inquiries. Include a clear call-to-action asking readers to reach out, get a quote, or fill out a form.",
  bookings:
    "Focus on driving appointment bookings. Include CTAs like 'Book now', 'Schedule today', or 'Reserve your spot'.",
  awareness:
    "Focus on brand visibility and community engagement. Be informative, shareable, and position the business as the local expert.",
};

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  promotion: "Write a promotional post about a special offer or seasonal deal.",
  testimonial: "Write a post showcasing a glowing client testimonial or review.",
  project_completed: "Write a post celebrating a recently completed project with before/after vibes.",
  tip: "Write an educational post sharing a useful industry tip or how-to advice.",
  now_booking: "Write a post announcing open availability and encouraging bookings.",
  fresh_cut: "Write a post showcasing a fresh haircut or style transformation.",
  style_trend: "Write a post about a trending hairstyle or grooming trend.",
  open_slots: "Write a post about open appointment slots available this week.",
  just_listed: "Write a post announcing a new property listing.",
  just_sold: "Write a post celebrating a just-sold property.",
  open_house: "Write a post promoting an upcoming open house event.",
  market_update: "Write a post sharing a local real estate market update.",
  seasonal_service: "Write a post promoting seasonal services or maintenance.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user from JWT
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_id, count = 3 } = await req.json();

    // Get the campaign
    const { data: campaign, error: campErr } = await supabase
      .from("auto_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();

    if (campErr || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, company, city, bio, professions(name, category)")
      .eq("id", user.id)
      .single();

    const goal = campaign.settings_json?.goal || "awareness";
    const contentTypes: string[] = campaign.content_types || [
      "promotion",
      "tip",
    ];
    const postsToGenerate = Math.min(count, 7);

    // Pick content types to generate (rotate through them)
    const selectedTypes: string[] = [];
    for (let i = 0; i < postsToGenerate; i++) {
      selectedTypes.push(contentTypes[i % contentTypes.length]);
    }

    // Build prompt
    const businessContext = `
Business: ${profile?.company || profile?.name || "Local Business"}
Location: ${profile?.city || ""}
Industry: ${(profile?.professions as any)?.name || (profile?.professions as any)?.category || "Service Business"}
Bio: ${profile?.bio || ""}
    `.trim();

    const postsPrompt = selectedTypes
      .map(
        (ct, i) =>
          `Post ${i + 1} (type: ${ct}): ${CONTENT_TYPE_PROMPTS[ct] || "Write an engaging social media post."}`
      )
      .join("\n");

    const systemPrompt = `You are a social media marketing expert for local service businesses. Generate social media posts that are engaging, authentic, and optimized for the business's goals.

Rules:
- Each post should be 50-200 words
- Include 3-5 relevant hashtags at the end
- Use a conversational, professional tone
- Reference the business name and location naturally
- ${GOAL_PROMPTS[goal] || GOAL_PROMPTS.awareness}
- Do NOT use generic filler — be specific and actionable
- Make each post unique and different from the others
- For each post, also include a short stock photo search query (3-5 words) that would pair well with the post

Return ONLY valid JSON: an array of objects with "content" (string with hashtags included), "content_type" (string), "platforms" (array of platform names like "Facebook", "Instagram"), and "image_query" (string for stock photo search).`;

    const userPrompt = `${businessContext}

Generate ${postsToGenerate} social media posts:
${postsPrompt}`;

    // Call Lovable AI
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent =
      aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response
    let posts: Array<{
      content: string;
      content_type: string;
      platforms: string[];
    }> = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        posts = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({
          error: "Failed to parse generated content",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (posts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No posts generated" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Schedule posts across the next week
    const now = new Date();
    const insertRows = posts.map((post, i) => {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(
        scheduledDate.getDate() + Math.floor(i * (7 / posts.length))
      );
      // Set to 10am local-ish time
      scheduledDate.setHours(10 + (i % 3), 0, 0, 0);

      return {
        user_id: user.id,
        content: post.content,
        platforms_json: post.platforms || ["Facebook", "Instagram"],
        status: "scheduled",
        approval_status: "pending",
        content_type: post.content_type,
        scheduled_at: scheduledDate.toISOString(),
        platform_overrides: {},
        content_label: `dfy:${campaign_id}`,
      };
    });

    const { data: inserted, error: insertErr } = await supabase
      .from("social_posts")
      .insert(insertRows)
      .select("id, content, status, scheduled_at, content_type");

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: insertErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update campaign stats
    await supabase
      .from("auto_campaigns")
      .update({
        posts_generated:
          (campaign.posts_generated || 0) + posts.length,
        next_post_at: insertRows[0]?.scheduled_at,
      })
      .eq("id", campaign_id);

    // Log to autopilot_log
    await supabase.from("autopilot_log").insert({
      user_id: user.id,
      action_type: "dfy_marketing",
      title: `Generated ${posts.length} DFY posts`,
      description: `Goal: ${goal}, Content types: ${selectedTypes.join(", ")}`,
      status: "completed",
    });

    return new Response(
      JSON.stringify({
        success: true,
        posts_generated: inserted?.length || 0,
        posts: inserted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
