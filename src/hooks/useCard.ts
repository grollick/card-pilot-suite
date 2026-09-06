import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

// ── CTA types ──
export const CTA_TYPES = [
  { value: "call", label: "Call", icon: "Phone" },
  { value: "text", label: "Text", icon: "MessageSquare" },
  { value: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
  { value: "email", label: "Email", icon: "Mail" },
  { value: "book", label: "Book", icon: "Calendar" },
  { value: "quote", label: "Get Quote", icon: "FileText" },
  { value: "vcard", label: "Download Contact", icon: "Download" },
  { value: "website", label: "Visit Website", icon: "Globe" },
] as const;

export type CtaType = (typeof CTA_TYPES)[number]["value"];

// ── Default sections ──
export const DEFAULT_SECTIONS = [
  { id: "hero", label: "Hero", enabled: true },
  { id: "about", label: "About", enabled: true },
  { id: "video_intro", label: "Video Introduction", enabled: false },
  { id: "services", label: "Services", enabled: true },
  { id: "projects", label: "Before / After Projects", enabled: false },
  { id: "quote_calculator", label: "Instant Quote Calculator", enabled: false },
  { id: "testimonials", label: "Testimonials", enabled: true },
  { id: "gallery", label: "Gallery", enabled: false },
  { id: "contact", label: "Contact Form", enabled: true },
  { id: "quote_request", label: "Quote Request", enabled: false },
  { id: "booking", label: "Booking", enabled: true },
  { id: "social", label: "Social Links", enabled: false },
];

export interface CardSection {
  id: string;
  label: string;
  enabled: boolean;
  content?: Record<string, any>;
}

// ── Fetch current user's card (optionally a specific one) ──
export function useCard(cardId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cards", cardId ?? "primary"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      let q = supabase.from("cards").select("*").eq("user_id", user!.id);
      if (cardId) q = q.eq("id", cardId);
      const { data, error } = await q
        .order("is_primary", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

// ── Upsert card (create if missing, update if exists) ──
export function useUpsertCard(cardId?: string | null) {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: {
      sections_json?: Json;
      theme_json?: Json;
      status?: "draft" | "published" | "unpublished";
    }) => {
      // Find the target card
      let q = supabase.from("cards").select("id").eq("user_id", user!.id);
      if (cardId) q = q.eq("id", cardId);
      const { data: rows } = await q
        .order("is_primary", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(1);
      const existing = rows?.[0] ?? null;

      if (existing) {
        const { data, error } = await supabase
          .from("cards")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("cards")
          .insert({
            user_id: user!.id,
            is_primary: true,
            sections_json: updates.sections_json ?? (DEFAULT_SECTIONS as unknown as Json),
            theme_json: updates.theme_json ?? ({} as Json),
            status: updates.status ?? "draft",
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["my-cards"] });
    },
  });
}


// ── Fetch user's profile for card builder ──
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, professions(name, category)")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ── Fetch style pack by key ──
export function useStylePack(key: string | null | undefined) {
  return useQuery({
    queryKey: ["style-pack", key],
    enabled: !!key,
    staleTime: 30 * 60 * 1000, // 30 min — style packs rarely change
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("style_packs")
        .select("*")
        .eq("key", key!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ── Public: Fetch card + profile by handle (optionally a specific card slug) ──
export function usePublicCard(handle: string | undefined, cardSlug?: string | null) {
  return useQuery({
    queryKey: ["public-card", handle, cardSlug ?? "primary"],
    enabled: !!handle,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Step 1: Get profile (required for user_id)
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id, name, handle, email, phone, company, city, avatar_url, primary_cta, style_pack, profession_id, verification_level, available_for_work, avg_response_minutes, professions(name, category)")
        .eq("handle", handle!)
        .single();
      if (pErr) throw pErr;

      const cardQuery = cardSlug
        ? supabase
            .from("cards")
            .select("sections_json, theme_json, status, slug, label, company, profession_id")
            .eq("user_id", profile.id)
            .eq("slug", cardSlug)
            .limit(1)
            .maybeSingle()
        : supabase
            .from("cards")
            .select("sections_json, theme_json, status, slug, label, company, profession_id")
            .eq("user_id", profile.id)
            .order("is_primary", { ascending: false })
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

      // Step 2: Fire all dependent queries in parallel
      const [cardResult, servicesResult, stylePackResult, dutyResult, recentViewsResult] = await Promise.all([
        cardQuery,
        supabase
          .from("booking_services")
          .select("id, name, price, duration_min")
          .eq("user_id", profile.id)
          .eq("active", true)
          .order("name"),
        profile.style_pack
          ? supabase
              .from("style_packs")
              .select("key, name, style, theme_tokens, default_palettes")
              .eq("key", profile.style_pack)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("estimate_duty_status")
          .select("is_on_duty")
          .eq("user_id", profile.id)
          .maybeSingle(),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("handle", handle!)
          .eq("event_type", "card_view")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const cardRow: any = cardResult.data;

      // Per-card overrides: business name + profession
      let professionOverride: { name: string; category: string | null } | null = null;
      if (cardRow?.profession_id && cardRow.profession_id !== profile.profession_id) {
        const { data: prof } = await supabase
          .from("professions")
          .select("name, category")
          .eq("id", cardRow.profession_id)
          .maybeSingle();
        if (prof) professionOverride = prof as any;
      }

      return {
        profile: {
          ...profile,
          company: cardRow?.company || profile.company,
          professions: professionOverride ?? profile.professions,
          is_on_duty: dutyResult.data?.is_on_duty ?? false,
        },
        card: cardRow,
        stylePack: stylePackResult.data,
        services: servicesResult.data ?? [],
        recentViewCount: recentViewsResult.count ?? 0,
      };

    },
  });
}
