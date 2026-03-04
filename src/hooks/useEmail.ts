import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type CampaignStatus = Database["public"]["Enums"]["campaign_status"];

// ── Templates ──
export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (t: { name: string; subject: string; body: string }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .insert({ ...t, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      subject?: string;
      body?: string;
    }) => {
      const { error } = await supabase.from("email_templates").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
}

// ── Campaigns ──
export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, email_templates(name, subject)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (c: { name: string; template_id?: string | null }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({ ...c, user_id: user!.id, status: "draft" as CampaignStatus })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      status?: CampaignStatus;
      template_id?: string | null;
    }) => {
      const { error } = await supabase.from("campaigns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

// ── Campaign Emails (recipients) ──
export function useCampaignEmails(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign-emails", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_emails")
        .select("*, leads(name, email)")
        .eq("campaign_id", campaignId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddCampaignRecipients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, leadIds }: { campaignId: string; leadIds: string[] }) => {
      const rows = leadIds.map((lead_id) => ({
        campaign_id: campaignId,
        lead_id,
        status: "pending" as const,
      }));
      const { error } = await supabase.from("campaign_emails").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign-emails"] }),
  });
}

// ── Template variable helpers ──
export const TEMPLATE_VARIABLES = [
  { key: "{{first_name}}", label: "First Name", description: "Contact's first name" },
  { key: "{{company}}", label: "Company", description: "Contact's company" },
  { key: "{{booking_link}}", label: "Booking Link", description: "Your booking page URL" },
  { key: "{{full_name}}", label: "Full Name", description: "Contact's full name" },
  { key: "{{email}}", label: "Email", description: "Contact's email" },
] as const;

export function resolveTemplateVars(
  body: string,
  contact: { name: string; company?: string | null; email?: string | null },
  handle?: string
): string {
  const firstName = contact.name.split(" ")[0];
  return body
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{full_name\}\}/g, contact.name)
    .replace(/\{\{company\}\}/g, contact.company ?? "")
    .replace(/\{\{email\}\}/g, contact.email ?? "")
    .replace(/\{\{booking_link\}\}/g, handle ? `${window.location.origin}/${handle}/book` : "");
}
