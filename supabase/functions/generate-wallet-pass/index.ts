import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { handle, platform } = await req.json();

    if (!handle) {
      return new Response(JSON.stringify({ error: "Handle is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get profile data
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("name, email, phone, company, handle, avatar_url")
      .eq("handle", handle)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For now, return the card URL — full .pkpass generation requires Apple Developer certificates
    // and Google Wallet API credentials which need to be configured separately
    const cardUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/${handle}`;

    return new Response(
      JSON.stringify({
        message: `Wallet pass generation for ${platform} is being configured. In the meantime, you can save the card URL.`,
        url: null,
        cardUrl,
        profile: {
          name: profile.name,
          company: profile.company,
          handle: profile.handle,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
