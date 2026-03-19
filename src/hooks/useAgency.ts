import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useProfileCache } from "@/hooks/useProfileCache";

export interface ClientWorkspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  white_label_enabled: boolean;
  custom_domain: string | null;
  // Aggregated metrics
  lead_count: number;
  booking_count: number;
  job_count: number;
  estimate_count: number;
}

export function useIsAgency() {
  const { user } = useAuth();
  const { data: profile } = useProfileCache();
  return useQuery({
    queryKey: ["is-agency", user?.id, profile?.plan],
    enabled: !!user && !!profile,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      return profile?.plan === "agency";
    },
  });
}

export function useClientWorkspaces() {
  const { user } = useAuth();
  const { orgs } = useOrg();

  return useQuery({
    queryKey: ["client-workspaces", user?.id, orgs.map(o => o.id)],
    enabled: !!user && orgs.length > 0,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const orgIds = orgs.map((o) => o.id);

      // Fetch org details with new columns
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url, created_at, white_label_enabled, custom_domain" as any)
        .in("id", orgIds);

      // Fetch metrics per org
      const workspaces: ClientWorkspace[] = await Promise.all(
        (orgsData ?? []).map(async (org: any) => {
          const [leads, bookings, jobs, estimates] = await Promise.all([
            supabase.from("leads").select("id", { count: "exact", head: true }).eq("org_id", org.id),
            supabase.from("bookings").select("id", { count: "exact", head: true }).eq("org_id", org.id),
            supabase.from("jobs").select("id", { count: "exact", head: true }).eq("org_id", org.id),
            supabase.from("estimates").select("id", { count: "exact", head: true }).eq("org_id", org.id),
          ]);

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo_url: org.logo_url,
            created_at: org.created_at,
            white_label_enabled: org.white_label_enabled ?? false,
            custom_domain: org.custom_domain ?? null,
            lead_count: leads.count ?? 0,
            booking_count: bookings.count ?? 0,
            job_count: jobs.count ?? 0,
            estimate_count: estimates.count ?? 0,
          };
        })
      );

      return workspaces;
    },
  });
}
