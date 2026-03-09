import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  services_used: string[];
  location: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Project[];
    },
  });
}

export function usePublicProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ["public-projects", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects" as any)
        .select("*")
        .eq("user_id", userId!)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Project[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const { data, error } = await supabase
        .from("projects" as any)
        .insert({ ...project, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Project;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}
