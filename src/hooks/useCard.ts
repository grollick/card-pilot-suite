import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

// ── CTA types ──
export const CTA_TYPES = [
  { value: "call", label: "Call", icon: "Phone" },
  { value: "text", label: "Text", icon: "MessageSquare" },
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
  { id: "services", label: "Services", enabled: true },
  { id: "testimonials", label: "Testimonials", enabled: true },
  { id: "gallery", label: "Gallery", enabled: false },
  { id: "contact", label: "Contact Form", enabled: true },
  { id: "booking", label: "Booking", enabled: true },
  { id: "social", label: "Social Links", enabled: false },
];

export interface CardSection {
  id: string;
  label: string;
  enabled: boolean;
}

// ── Fetch current user's card ──
export function useCard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cards"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ── Upsert card (create if missing, update if exists) ──
export function useUpsertCard() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: {
      sections_json?: Json;
      theme_json?: Json;
      status?: "draft" | "published" | "unpublished";
    }) => {
      // Check if card exists
      const { data: existing } = await supabase
        .from("cards")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
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

// ── Public: Fetch card + profile by handle ──
export function usePublicCard(handle: string | undefined) {
  return useQuery({
    queryKey: ["public-card", handle],
    enabled: !!handle,
    queryFn: async () => {
      // Get profile by handle
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("*, professions(name, category)")
        .eq("handle", handle!)
        .single();
      if (pErr) throw pErr;

      // Get card
      const { data: card } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", profile.id)
        .eq("status", "published")
        .maybeSingle();

      // Get style pack
      let stylePack = null;
      if (profile.style_pack) {
        const { data } = await supabase
          .from("style_packs")
          .select("*")
          .eq("key", profile.style_pack)
          .maybeSingle();
        stylePack = data;
      }

      // Get active services
      const { data: services } = await supabase
        .from("booking_services")
        .select("*")
        .eq("user_id", profile.id)
        .eq("active", true)
        .order("name");

      return { profile, card, stylePack, services: services ?? [] };
    },
  });
}
