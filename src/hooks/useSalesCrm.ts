import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const SALES_CRM_STAGES = [
  { id: "new_lead", label: "New Lead" },
  { id: "contacted", label: "Contacted" },
  { id: "interested", label: "Interested" },
  { id: "card_built", label: "Card Built" },
  { id: "got_first_lead", label: "Got First Lead" },
  { id: "paid", label: "Paid" },
  { id: "upsell", label: "Upsell" },
] as const;

export type SalesCrmStage = (typeof SALES_CRM_STAGES)[number]["id"];

export interface SalesCrmContact {
  id: string;
  user_id: string;
  name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  stage: SalesCrmStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSalesCrmContacts() {
  return useQuery({
    queryKey: ["sales-crm-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_crm_contacts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SalesCrmContact[];
    },
  });
}

export function useCreateSalesCrmContact() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (contact: {
      name: string;
      business_name?: string;
      email?: string;
      phone?: string;
      stage?: SalesCrmStage;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("sales_crm_contacts")
        .insert({ ...contact, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as SalesCrmContact;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-crm-contacts"] }),
  });
}

export function useUpdateSalesCrmContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalesCrmContact> & { id: string }) => {
      const { error } = await supabase
        .from("sales_crm_contacts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-crm-contacts"] }),
  });
}

export function useDeleteSalesCrmContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales_crm_contacts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-crm-contacts"] }),
  });
}
