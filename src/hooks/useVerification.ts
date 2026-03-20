import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useVerificationLevel(userId?: string) {
  const { user } = useAuth();
  const uid = userId || user?.id;

  return useQuery({
    queryKey: ["verification-level", uid],
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("verification_level, trust_score, name, profession_id, phone, avatar_url")
        .eq("id", uid!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useRecalculateVerification() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userId?: string) => {
      const uid = userId || user?.id;
      if (!uid) throw new Error("No user");
      const { data, error } = await supabase.rpc("recalculate_verification_level", {
        p_user_id: uid,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ["verification-level", userId || user?.id] });
    },
  });
}

export function useVerificationChecklist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["verification-checklist", user?.id],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const uid = user!.id;

      const [profileRes, cardRes, leadRes, bookingRes] = await Promise.all([
        supabase.from("profiles").select("name, profession_id, phone, avatar_url, verification_level, trust_score").eq("id", uid).single(),
        supabase.from("cards").select("id").eq("user_id", uid).eq("status", "published").limit(1),
        supabase.from("leads").select("id").eq("user_id", uid).limit(5),
        supabase.from("bookings").select("id").eq("user_id", uid).limit(3),
      ]);

      const p = profileRes.data;
      const leadCount = leadRes.data?.length ?? 0;
      const bookingCount = bookingRes.data?.length ?? 0;
      const hasCard = (cardRes.data?.length ?? 0) > 0;

      return {
        emailVerified: true,
        hasName: !!p?.name,
        hasProfession: !!p?.profession_id,
        hasPhone: !!p?.phone,
        hasAvatar: !!p?.avatar_url,
        hasCard,
        hasActivity: leadCount >= 1 || bookingCount >= 1,
        leadCount,
        bookingCount,
        trustScore: p?.trust_score ?? 0,
        currentLevel: (p?.verification_level as string) ?? "basic",
      };
    },
  });
}
