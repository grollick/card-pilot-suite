import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientBusiness {
  businessUserId: string;
  businessName: string | null;
  businessAvatar: string | null;
  businessHandle: string | null;
  businessProfession: string | null;
  leadId: string;
}

export interface ClientBooking {
  id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  customer_name: string;
  service_id: string | null;
  user_id: string;
  lead_id: string | null;
  serviceName?: string;
  servicePrice?: number | null;
  businessName?: string | null;
}

export function useClientProfile() {
  return useQuery({
    queryKey: ["client-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useClientBusinesses() {
  return useQuery<ClientBusiness[]>({
    queryKey: ["client-businesses"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get client email
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("email")
        .eq("user_id", user.id)
        .single();

      if (!profile?.email) return [];

      // Get all leads matching this email
      const { data: leads } = await supabase
        .from("leads")
        .select("id, user_id, name")
        .eq("email", profile.email);

      if (!leads?.length) return [];

      // Get business profiles for each unique user_id
      const businessUserIds = [...new Set(leads.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, handle")
        .in("id", businessUserIds);

      return leads.map(lead => {
        const biz = profiles?.find(p => p.id === lead.user_id);
        return {
          businessUserId: lead.user_id,
          businessName: biz?.name || "Business",
          businessAvatar: biz?.avatar_url || null,
          businessHandle: biz?.handle || null,
          businessProfession: null,
          leadId: lead.id,
        };
      });
    },
  });
}

export function useClientBookings() {
  return useQuery<ClientBooking[]>({
    queryKey: ["client-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("client_profiles")
        .select("email")
        .eq("user_id", user.id)
        .single();

      if (!profile?.email) return [];

      // Get leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, user_id")
        .eq("email", profile.email);

      if (!leads?.length) return [];

      const leadIds = leads.map(l => l.id);

      // Get bookings for these leads
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, start_datetime, end_datetime, status, notes, customer_name, service_id, user_id, lead_id")
        .in("lead_id", leadIds)
        .order("start_datetime", { ascending: false });

      if (!bookings?.length) return [];

      // Get service names
      const serviceIds = [...new Set(bookings.filter(b => b.service_id).map(b => b.service_id!))];
      const { data: services } = serviceIds.length
        ? await supabase.from("booking_services").select("id, name, price").in("id", serviceIds)
        : { data: [] };

      // Get business names
      const bizIds = [...new Set(bookings.map(b => b.user_id))];
      const { data: bizProfiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", bizIds);

      return bookings.map(b => ({
        ...b,
        serviceName: services?.find(s => s.id === b.service_id)?.name,
        servicePrice: services?.find(s => s.id === b.service_id)?.price,
        businessName: bizProfiles?.find(p => p.id === b.user_id)?.name || null,
      }));
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" as any })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
    },
  });
}

export function useClientServices(businessUserId: string | undefined) {
  return useQuery({
    queryKey: ["client-services", businessUserId],
    enabled: !!businessUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("booking_services")
        .select("id, name, price, duration_min, description")
        .eq("user_id", businessUserId!)
        .eq("active", true)
        .order("name");
      return data || [];
    },
  });
}
