import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("send-email - missing fields returns 400", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ to: "test@example.com" }), // missing subject & html
  });
  const data = await res.json();
  assertEquals(res.status, 400);
  assertEquals(data.error, "Missing required fields: to, subject, html");
});

Deno.test("send-email - sends test email via Resend", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      to: "delivered@resend.dev",
      subject: "CardPilot Test Email",
      html: "<h1>It works!</h1><p>Your Resend integration is live.</p>",
      email_type: "custom",
    }),
  });
  const data = await res.json();
  console.log("Resend response:", JSON.stringify(data));
  assertEquals(res.status, 200);
  assertEquals(data.success, true);
});
