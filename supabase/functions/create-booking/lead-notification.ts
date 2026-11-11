import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function notifyLeadOwner(client: SupabaseClient, leadId: string, eventId: string, title: string, message?: string | null) {
  const { data: lead } = await client.from("leads").select("user_id,name,email,phone").eq("id", leadId).single();
  if (!lead) return;
  const { data: owner } = await client.from("profiles").select("email").eq("id", lead.user_id).single();
  if (!owner?.email) return;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return;
  const { error } = await client.functions.invoke("send-transactional-email", {
    headers: { Authorization: `Bearer ${serviceKey}`, "x-internal-service-key": serviceKey },
    body: {
      templateName: "new-lead", recipientEmail: owner.email,
      idempotencyKey: `new-lead-${eventId}`,
      templateData: { name: lead.name, email: lead.email, phone: lead.phone, title, message },
    },
  });
  if (error) {
    const response = error.context instanceof Response ? error.context : null;
    const detail = response ? await response.json().catch(() => ({})) : {};
    console.error("Lead owner notification failed", { leadId, status: response?.status, error: detail.error || error.message });
  }
}