import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useCard";
import { supabase } from "@/integrations/supabase/client";
import {
  getChecklistTemplate,
  type ChecklistStepTemplate,
  type ProfessionChecklist,
} from "@/lib/checklistTemplates";

export interface ResolvedChecklistItem extends ChecklistStepTemplate {
  done: boolean;
}

export interface ActivationChecklistData {
  template: ProfessionChecklist;
  items: ResolvedChecklistItem[];
  completedCount: number;
  totalCount: number;
  progress: number;
  allDone: boolean;
  nextItem: ResolvedChecklistItem | undefined;
}

/** Fetch all completion signals in one parallel batch */
async function fetchSignals(uid: string) {
  const [cardRes, serviceRes, leadRes, bookingRes, analyticsRes, estimateRes, reviewRes] =
    await Promise.all([
      supabase.from("cards").select("id, status, sections_json").eq("user_id", uid).limit(1).maybeSingle(),
      supabase.from("booking_services").select("id").eq("user_id", uid).eq("active", true).limit(1),
      supabase.from("leads").select("id").eq("user_id", uid).limit(1),
      supabase.from("bookings").select("id").eq("user_id", uid).limit(1),
      supabase.from("analytics_events").select("id").eq("user_id", uid).eq("event_type", "card_view").limit(5),
      supabase.from("estimates").select("id, status").eq("user_id", uid).limit(1),
      supabase.from("reviews").select("id").eq("user_id", uid).limit(1),
    ]);

  const sections = cardRes.data?.sections_json as any[] | null;
  const hasImage = sections?.some((s: any) => s.id === "gallery" && s.enabled) ?? false;
  const hasPublished = cardRes.data?.status === "published";

  return {
    card_published: hasPublished,
    has_services: (serviceRes.data?.length ?? 0) > 0,
    has_image: hasImage || hasPublished,
    estimate_sent: estimateRes.data?.some(
      (e: any) => e.status === "sent" || e.status === "approved"
    ) ?? false,
    has_views: (analyticsRes.data?.length ?? 0) >= 5,
    has_lead: (leadRes.data?.length ?? 0) > 0,
    has_booking: (bookingRes.data?.length ?? 0) > 0,
    has_review: (reviewRes.data?.length ?? 0) > 0,
  };
}

/**
 * Hook that returns the dynamic, profession-aware activation checklist.
 * Automatically resolves which template to use and checks completion signals.
 */
export function useActivationChecklist(): ActivationChecklistData & { isLoading: boolean } {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const template = getChecklistTemplate(
    (profile as any)?.profession_name ?? (profile as any)?.professions?.name,
    (profile as any)?.profession_category ?? (profile as any)?.professions?.category,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["activation-checklist", user?.id, template.id],
    enabled: !!user && !!profile,
    staleTime: 30_000,
    queryFn: async (): Promise<ResolvedChecklistItem[]> => {
      const signals = await fetchSignals(user!.id);
      return template.steps
        .sort((a, b) => a.order - b.order)
        .map((step) => ({
          ...step,
          done: signals[step.signal] ?? false,
        }));
    },
  });

  const items = data ?? [];
  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount && totalCount > 0;
  const nextItem = items.find((i) => !i.done);

  return { template, items, completedCount, totalCount, progress, allDone, nextItem, isLoading };
}
