import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderBusiness } from "./useProviderInsights";

export interface SmsMessage {
  id: string;
  business_id: string;
  lead_id: string | null;
  booking_id: string | null;
  phone: string | null;
  message_type: string;
  message_body: string;
  delivery_status: string;
  was_ai_generated: boolean;
  was_user_edited: boolean;
  twilio_message_sid: string | null;
  error_code: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSmsMessages(opts?: { leadId?: string; bookingId?: string }) {
  const { user } = useAuth();
  const { data: biz } = useProviderBusiness();
  const businessId = biz?.id;

  return useQuery<SmsMessage[]>({
    queryKey: ["sms-messages", businessId, opts?.leadId, opts?.bookingId],
    enabled: !!user && !!businessId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      let q = supabase
        .from("sms_messages")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (opts?.leadId) q = q.eq("lead_id", opts.leadId);
      if (opts?.bookingId) q = q.eq("booking_id", opts.bookingId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}

export function useCreateSmsDraft() {
  const qc = useQueryClient();
  const { data: biz } = useProviderBusiness();
  const businessId = biz?.id;

  return useMutation({
    mutationFn: async (msg: {
      leadId?: string;
      bookingId?: string;
      phone?: string;
      messageType: string;
      messageBody: string;
      wasAiGenerated?: boolean;
    }) => {
      if (!businessId) throw new Error("No business");
      const { data, error } = await supabase.from("sms_messages").insert({
        business_id: businessId,
        lead_id: msg.leadId ?? null,
        booking_id: msg.bookingId ?? null,
        phone: msg.phone ?? null,
        message_type: msg.messageType,
        message_body: msg.messageBody,
        delivery_status: "draft",
        was_ai_generated: msg.wasAiGenerated ?? true,
        was_user_edited: false,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sms-messages"] }),
  });
}

export function useSendSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { id: string; messageBody: string; wasEdited: boolean }) => {
      // Mark as queued (real SMS provider integration later)
      const { error } = await supabase
        .from("sms_messages")
        .update({
          message_body: opts.messageBody,
          delivery_status: "queued",
          was_user_edited: opts.wasEdited,
          sent_at: new Date().toISOString(),
        } as any)
        .eq("id", opts.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sms-messages"] }),
  });
}
