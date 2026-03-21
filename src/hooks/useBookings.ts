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

      // Send review request email when booking is completed
      if (updates.status === "completed") {
        try {
          const { data: booking } = await supabase
            .from("bookings")
            .select("customer_email, customer_name, user_id, service_id, booking_services(name)")
            .eq("id", id)
            .single();

          if (booking?.customer_email) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, handle")
              .eq("id", booking.user_id)
              .single();

            supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "review-request",
                recipientEmail: booking.customer_email,
                idempotencyKey: `review-request-${id}`,
                templateData: {
                  customerName: booking.customer_name?.split(" ")[0],
                  providerName: profile?.name || "",
                  serviceName: (booking.booking_services as any)?.name || "",
                  handle: profile?.handle || "",
                },
              },
            }).catch(() => {});
          }
        } catch {
          // Non-blocking — don't fail the status update
        }
      }
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
      const [servicesResult, availabilityResult, bookingsResult] = await Promise.all([
        supabase
          .from("booking_services")
          .select("id, name, description, duration_min, price")
          .eq("user_id", profile.id)
          .eq("active", true)
          .order("name"),
        supabase
          .from("availability_rules")
          .select("day_of_week, start_time, end_time, buffer_min")
          .eq("user_id", profile.id)
          .order("day_of_week"),
        supabase
          .from("bookings")
          .select("start_datetime, end_datetime")
          .eq("user_id", profile.id)
          .in("status", ["pending", "confirmed", "requested"])
          .gte("start_datetime", now.toISOString())
          .lte("start_datetime", thirtyDays.toISOString()),
      ]);

      return {
        profile,
        services: servicesResult.data ?? [],
        availability: availabilityResult.data ?? [],
        existingBookings: bookingsResult.data ?? [],
      };
    },
  });
}
