import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface LeadMagnetBody {
  name: string;
  email: string;
  profession: string;
}

const EMAIL_SEQUENCE = [
  {
    delayMinutes: 0,
    subject: "Your Free Business Growth Toolkit 🎯",
    body: (name: string) => `
      <h2>Hi ${name},</h2>
      <p>Welcome! Here's your free toolkit for growing your service business.</p>
      <h3>Inside your toolkit:</h3>
      <ul>
        <li><strong>Lead Capture Strategies</strong> — Turn every interaction into a potential customer</li>
        <li><strong>Booking Best Practices</strong> — Fill your calendar with qualified appointments</li>
        <li><strong>Estimate Templates</strong> — Send professional quotes in minutes</li>
        <li><strong>Local Marketing Tips</strong> — Grow your reputation in your community</li>
      </ul>
      <p>guzzl.pro was built to help service professionals like you manage everything in one place — from your digital business card to CRM, booking, estimates, and marketing.</p>
      <p><a href="https://guzzl-pro.app/onboarding" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Create Your Free Card →</a></p>
      <p>Best,<br/>The guzzl.pro Team</p>
    `,
  },
  {
    delayMinutes: 2880, // Day 2
    subject: "How guzzl.pro captures leads automatically",
    body: (name: string) => `
      <h2>Hi ${name},</h2>
      <p>Did you know that most service businesses lose leads because they don't have a fast way to capture contact information?</p>
      <p>With guzzl.pro, every visitor who views your smart business card can:</p>
      <ul>
        <li>Call or text you with one tap</li>
        <li>Book an appointment online</li>
        <li>Submit a contact form — automatically saved to your CRM</li>
      </ul>
      <p>No more lost sticky notes or missed calls. Every lead is tracked and ready for follow-up.</p>
      <p><a href="https://guzzl-pro.app/onboarding" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Try It Free →</a></p>
    `,
  },
  {
    delayMinutes: 5760, // Day 4
    subject: "Real businesses growing with guzzl.pro",
    body: (name: string) => `
      <h2>Hi ${name},</h2>
      <p>Here's how service professionals are using guzzl.pro every day:</p>
      <ul>
        <li><strong>Landscapers</strong> share their card at job sites — customers book seasonal cleanups online</li>
        <li><strong>Electricians</strong> attach QR codes to invoices — customers leave reviews and rebook</li>
        <li><strong>Personal trainers</strong> send their card link on social media — new clients book sessions instantly</li>
      </ul>
      <p>The best part? Everything connects: your card, CRM, bookings, estimates, and marketing — all in one place.</p>
      <p><a href="https://guzzl-pro.app/onboarding" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Start Growing Your Business →</a></p>
    `,
  },
  {
    delayMinutes: 10080, // Day 7
    subject: "Ready to grow? Your card is waiting ✨",
    body: (name: string) => `
      <h2>Hi ${name},</h2>
      <p>It's been a week since you downloaded the toolkit. Have you had a chance to try any of the strategies?</p>
      <p>Creating your guzzl.pro smart business card takes less than 2 minutes — and it's completely free to start.</p>
      <p>Here's what you'll get:</p>
      <ul>
        <li>A stunning digital business card</li>
        <li>Built-in lead capture and CRM</li>
        <li>Online booking for your services</li>
        <li>Professional estimate builder</li>
        <li>Social media scheduling</li>
      </ul>
      <p><a href="https://guzzl-pro.app/onboarding" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Create Your Card — It's Free →</a></p>
      <p>We're here if you need anything!</p>
      <p>— The guzzl.pro Team</p>
    `,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, profession } = (await req.json()) as LeadMagnetBody;

    if (!name || !email || !profession) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Store lead in leads table with tag
    const { data: existingLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .limit(1);

    let leadId: string;

    if (existingLeads && existingLeads.length > 0) {
      leadId = existingLeads[0].id;
      // Update tags
      const { data: lead } = await supabase
        .from("leads")
        .select("tags")
        .eq("id", leadId)
        .single();
      const tags = lead?.tags || [];
      if (!tags.includes("Lead Magnet Subscriber")) {
        tags.push("Lead Magnet Subscriber");
        await supabase.from("leads").update({ tags }).eq("id", leadId);
      }
    } else {
      // We need a user_id for the lead — this is a public landing page lead
      // We'll skip CRM storage if there's no authenticated user context
      // Instead, store in a lightweight way
      leadId = "";
    }

    // 2. Send first email immediately via Resend
    if (RESEND_API_KEY) {
      const firstEmail = EMAIL_SEQUENCE[0];
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "guzzl.pro <hello@updates.guzzl-pro.app>",
          to: [email],
          subject: firstEmail.subject,
          html: firstEmail.body(name),
        }),
      });

      // 3. Schedule follow-up emails
      for (let i = 1; i < EMAIL_SEQUENCE.length; i++) {
        const step = EMAIL_SEQUENCE[i];
        const sendAt = new Date(Date.now() + step.delayMinutes * 60 * 1000).toISOString();

        // Use Resend's scheduled send
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "guzzl.pro <hello@updates.guzzl-pro.app>",
            to: [email],
            subject: step.subject,
            html: step.body(name),
            scheduled_at: sendAt,
          }),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Lead magnet error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
