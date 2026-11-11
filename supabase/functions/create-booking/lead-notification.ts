import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function notifyLeadOwner(client: SupabaseClient, leadId: string, eventId: string, title: string, message?: string | null) {
  const { data: lead } = await client.from("leads").select("user_id,name,email,phone").eq("id", leadId).single();
  if (!lead) return;
  const { data: owner } = await client.from("profiles").select("email").eq("id", lead.user_id).single();
  if (!owner?.email) return;
  const { error } = await client.functions.invoke("send-transactional-email", {
    body: {
      templateName: "new-lead", recipientEmail: owner.email,
      idempotencyKey: `new-lead-${eventId}`,
      templateData: { name: lead.name, email: lead.email, phone: lead.phone, title, message },
    },
  });
  if (error) console.error("Lead owner notification failed", { leadId, error: error.message });
}