import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Cancel a booking from the client portal and log CRM activity + notify business owner.
 */
export function useClientCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, businessUserId, leadId, serviceName }: {
      bookingId: string;
      businessUserId: string;
      leadId: string;
      serviceName?: string;
    }) => {
      // Cancel the booking
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" as any })
        .eq("id", bookingId);
      if (error) throw error;

      // Log CRM activity (fire-and-forget)
      supabase.from("contact_activities").insert({
        user_id: businessUserId,
        lead_id: leadId,
        activity_type: "booking_cancelled",
        title: `Client cancelled booking${serviceName ? `: ${serviceName}` : ""}`,
        description: "Cancelled via client portal",
      } as any).then();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
      toast.success("Booking cancelled successfully");
    },
    onError: () => toast.error("Failed to cancel booking"),
  });
}

/**
 * Submit a review from the client portal and log CRM activity.
 */
export function useClientSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessUserId, leadId, reviewerName, reviewerEmail, rating, reviewText }: {
      businessUserId: string;
      leadId: string;
      reviewerName: string;
      reviewerEmail?: string;
      rating: number;
      reviewText?: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews" as any)
        .insert({
          user_id: businessUserId,
          lead_id: leadId,
          reviewer_name: reviewerName,
          reviewer_email: reviewerEmail || null,
          rating,
          review_text: reviewText || null,
          is_public: false,
          source: "client_portal",
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Log CRM activity
      supabase.from("contact_activities").insert({
        user_id: businessUserId,
        lead_id: leadId,
        activity_type: "review_submitted",
        title: `Review submitted (${rating}★) via portal`,
        description: reviewText || null,
      } as any).then();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
      toast.success("Thank you! Your review will appear once approved.");
    },
    onError: () => toast.error("Failed to submit review"),
  });
}
