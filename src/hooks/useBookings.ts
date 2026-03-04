import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Services ──
export function useBookingServices() {
  return useQuery({
    queryKey: ["booking-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_services")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (service: {
      name: string;
      duration_min?: number;
      price?: number | null;
      description?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("booking_services")
        .insert({ ...service, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-services"] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      duration_min?: number;
      price?: number | null;
      description?: string | null;
      active?: boolean;
    }) => {
      const { error } = await supabase.from("booking_services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-services"] }),
  });
}

// ── Bookings ──
export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, booking_services(name, duration_min)")
        .order("start_datetime", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "requested";
      internal_notes?: string;
    }) => {
      const { error } = await supabase.from("bookings").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["contact-bookings"] });
    },
  });
}

// ── Availability ──
export function useAvailability() {
  return useQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_rules")
        .select("*")
        .order("day_of_week");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertAvailability() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rules: {
      day_of_week: number;
      start_time: string;
      end_time: string;
      buffer_min?: number;
    }[]) => {
      // Delete existing then insert new
      await supabase.from("availability_rules").delete().eq("user_id", user!.id);
      if (rules.length > 0) {
        const { error } = await supabase
          .from("availability_rules")
          .insert(rules.map((r) => ({ ...r, user_id: user!.id })));
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability"] }),
  });
}

// ── Public: fetch services + availability by user handle ──
export function usePublicBookingData(handle: string | undefined) {
  return useQuery({
    queryKey: ["public-booking", handle],
    enabled: !!handle,
    queryFn: async () => {
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id, name, handle, avatar_url")
        .eq("handle", handle!)
        .single();
      if (pErr) throw pErr;

      const { data: services } = await supabase
        .from("booking_services")
        .select("*")
        .eq("user_id", profile.id)
        .eq("active", true)
        .order("name");

      const { data: availability } = await supabase
        .from("availability_rules")
        .select("*")
        .eq("user_id", profile.id)
        .order("day_of_week");

      // Get existing bookings for next 30 days to check conflicts
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("start_datetime, end_datetime")
        .eq("user_id", profile.id)
        .in("status", ["pending", "confirmed", "requested"])
        .gte("start_datetime", now.toISOString())
        .lte("start_datetime", thirtyDays.toISOString());

      return {
        profile,
        services: services ?? [],
        availability: availability ?? [],
        existingBookings: existingBookings ?? [],
      };
    },
  });
}
