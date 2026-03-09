import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PresetType = "labor_rate" | "markup" | "tax" | "fee";

export interface EstimatePreset {
  id: string;
  user_id: string;
  preset_type: PresetType;
  name: string;
  value: number;
  sort_order: number;
}

export function useEstimatePresets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["estimate-presets"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimate_presets" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as EstimatePreset[];
    },
  });
}

export function useCreatePreset() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preset: { preset_type: PresetType; name: string; value: number }) => {
      const { error } = await supabase
        .from("estimate_presets" as any)
        .insert({ ...preset, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimate-presets"] });
      toast.success("Preset saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("estimate_presets" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimate-presets"] });
      toast.success("Preset deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

/** Default presets for first-time users */
export const DEFAULT_PRESETS: Omit<EstimatePreset, "id" | "user_id">[] = [
  { preset_type: "labor_rate", name: "Standard Labor", value: 55, sort_order: 0 },
  { preset_type: "labor_rate", name: "Premium Labor", value: 85, sort_order: 1 },
  { preset_type: "labor_rate", name: "Emergency Rate", value: 125, sort_order: 2 },
  { preset_type: "labor_rate", name: "Weekend Rate", value: 75, sort_order: 3 },
  { preset_type: "markup", name: "10%", value: 10, sort_order: 0 },
  { preset_type: "markup", name: "15%", value: 15, sort_order: 1 },
  { preset_type: "markup", name: "20%", value: 20, sort_order: 2 },
  { preset_type: "markup", name: "30%", value: 30, sort_order: 3 },
  { preset_type: "tax", name: "HST 13%", value: 13, sort_order: 0 },
  { preset_type: "tax", name: "GST 5%", value: 5, sort_order: 1 },
  { preset_type: "tax", name: "Sales Tax 8.875%", value: 8.875, sort_order: 2 },
  { preset_type: "fee", name: "Travel Fee", value: 50, sort_order: 0 },
  { preset_type: "fee", name: "Service Call", value: 75, sort_order: 1 },
  { preset_type: "fee", name: "Disposal Fee", value: 100, sort_order: 2 },
  { preset_type: "fee", name: "Dump Fee", value: 150, sort_order: 3 },
];
