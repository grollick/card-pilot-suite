import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ACCT_KEY = ["social-accounts"] as const;

export function useSocialAccounts() {
  return useQuery({
    queryKey: ACCT_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .order("provider");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleAccount() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ provider, connected, account_name }: { provider: string; connected: boolean; account_name?: string }) => {
      const { data: existing } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user!.id)
        .eq("provider", provider)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("social_accounts")
          .update({ connected, account_name } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_accounts")
          .insert({ user_id: user!.id, provider, connected, account_name } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCT_KEY }),
  });
}
