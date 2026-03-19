import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingPageSection {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  content: Record<string, any>;
}

export interface LandingPageContent {
  id: string;
  page_key: string;
  page_title: string;
  page_description: string;
  sections_json: LandingPageSection[];
  settings_json: Record<string, any>;
  is_published: boolean;
  updated_at: string;
}

export function useLandingPages() {
  return useQuery({
    queryKey: ["landing-pages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("landing_page_content")
        .select("*")
        .order("page_key");
      if (error) throw error;
      return (data || []) as LandingPageContent[];
    },
  });
}

export function useLandingPage(pageKey: string | undefined) {
  return useQuery({
    queryKey: ["landing-page", pageKey],
    enabled: !!pageKey,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("landing_page_content")
        .select("*")
        .eq("page_key", pageKey)
        .maybeSingle();
      if (error) throw error;
      return data as LandingPageContent | null;
    },
  });
}

export function useSaveLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Partial<LandingPageContent> & { page_key: string }) => {
      const { data: existing } = await (supabase as any)
        .from("landing_page_content")
        .select("id")
        .eq("page_key", page.page_key)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("landing_page_content")
          .update({
            page_title: page.page_title,
            page_description: page.page_description,
            sections_json: page.sections_json,
            settings_json: page.settings_json,
            is_published: page.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("landing_page_content")
          .insert({
            page_key: page.page_key,
            page_title: page.page_title || "",
            page_description: page.page_description || "",
            sections_json: page.sections_json || [],
            settings_json: page.settings_json || {},
            is_published: page.is_published ?? true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing-pages"] });
      qc.invalidateQueries({ queryKey: ["landing-page"] });
    },
  });
}
