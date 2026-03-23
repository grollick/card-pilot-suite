import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EstimatePhoto {
  id: string;
  estimate_id: string;
  line_item_id: string | null;
  user_id: string;
  file_path: string;
  file_name: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export function useEstimatePhotos(estimateId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["estimate-photos", estimateId],
    enabled: !!user && !!estimateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimate_photos" as any)
        .select("*")
        .eq("estimate_id", estimateId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as EstimatePhoto[];
    },
  });
}

export function useUploadEstimatePhoto() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      estimateId,
      lineItemId,
      file,
    }: {
      estimateId: string;
      lineItemId?: string | null;
      file: File;
    }) => {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `estimates/${estimateId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("card-assets")
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: record, error: dbErr } = await supabase
        .from("estimate_photos" as any)
        .insert({
          estimate_id: estimateId,
          line_item_id: lineItemId ?? null,
          user_id: user!.id,
          file_path: path,
          file_name: file.name,
        } as any)
        .select()
        .single();
      if (dbErr) throw dbErr;
      return record as unknown as EstimatePhoto;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["estimate-photos", vars.estimateId] });
      toast.success("Photo uploaded");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteEstimatePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, estimateId }: { id: string; filePath: string; estimateId: string }) => {
      await supabase.storage.from("card-assets").remove([filePath]);
      const { error } = await supabase.from("estimate_photos" as any).delete().eq("id", id);
      if (error) throw error;
      return { estimateId };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["estimate-photos", data.estimateId] });
      toast.success("Photo removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function getEstimatePhotoUrl(filePath: string): string {
  const { data } = supabase.storage.from("card-assets").getPublicUrl(filePath);
  return data.publicUrl;
}
