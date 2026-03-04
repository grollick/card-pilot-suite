import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  email_type?: "booking_confirmation" | "follow_up" | "campaign" | "custom";
  lead_id?: string;
}

export function useSendEmail() {
  return useMutation({
    mutationFn: async (params: SendEmailParams) => {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: params,
      });
      if (error) throw error;
      return data as { success: boolean; id: string };
    },
  });
}
