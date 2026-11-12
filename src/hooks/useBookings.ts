import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Services ──
export function useBookingServices() {
  return useQuery({
    queryKey: ["booking-services"],
    staleTime: 60_000,
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
    staleTime: 30_000,
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

export interface BookingStatusResult {
  success: boolean;
  status: string;
  emailAttempted: boolean;
  hasEmail: boolean;
  emailQueued: boolean;
  customerEmail: string | null;
}

/** Toast text that reports exactly what happened with the customer email. */
export function bookingStatusMessage(label: string, r: BookingStatusResult | null): string {
  if (!r || !r.emailAttempted) return `${label}.`;
  if (!r.hasEmail) return `${label}. No email on file for this customer.`;
  if (!r.emailQueued) return `${label}, but the email could not be sent.`;
  return `${label}. Email sent to ${r.customerEmail}.`;
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "requested";
      internal_notes?: string;
    }): Promise<BookingStatusResult | null> => {
      if (updates.internal_notes !== undefined) {
        const { error } = await supabase.from("bookings").update({ internal_notes: updates.internal_notes }).eq("id", id);
        if (error) throw error;
      }
      if (!updates.status) return null;
      // Status changes go through the server so it can check ownership and email the customer.
      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: { action: "update_status", bookingId: id, status: updates.status },
      });
      if (error || !data?.success) throw error || new Error(data?.error || "Couldn't update the booking");
      return data as BookingStatusResult;
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

// ── Public: fetch services + availability by user handle (parallelized) ──
export function usePublicBookingData(handle: string | undefined) {
  return useQuery({
    queryKey: ["public-booking", handle],
    enabled: !!handle,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data: profile, error: pErr } = await supabase
        .from("public_profiles" as any)
        .select("id, name, handle, avatar_url")
        .eq("handle", handle!)
        .single() as { data: any; error: any };
      if (pErr) throw pErr;

      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Fire all queries in parallel
      const [servicesResult, availabilityResult, bookingsResult, cardResult] = await Promise.all([
        supabase
          .rpc("get_services_by_handle", { p_handle: handle! }),
        supabase.rpc("get_availability_by_user", { p_user_id: profile.id }),
        supabase
          .from("bookings")
          .select("start_datetime, end_datetime")
          .eq("user_id", profile.id)
          .in("status", ["pending", "confirmed", "requested"])
          .gte("start_datetime", now.toISOString())
          .lte("start_datetime", thirtyDays.toISOString()),
        supabase
          .from("cards")
          .select("sections_json, company")
          .eq("user_id", profile.id)
          .order("is_primary", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const cardSections = Array.isArray((cardResult.data as any)?.sections_json)
        ? ((cardResult.data as any).sections_json as { id: string; enabled?: boolean }[])
        : [];
      // Online booking is on only when the card's booking section is switched on.
      const bookingEnabled = cardSections.some((s) => s.id === "booking" && s.enabled);

      return {
        profile,
        businessName: ((cardResult.data as any)?.company as string) || profile.name || handle!,
        bookingEnabled,
        services: servicesResult.data ?? [],
        availability: availabilityResult.data ?? [],
        existingBookings: bookingsResult.data ?? [],
      };
    },
  });
}
