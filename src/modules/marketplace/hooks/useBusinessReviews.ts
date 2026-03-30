import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessReview {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  source: string | null;
}

export interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  reviews: BusinessReview[];
}

export function useBusinessReviews(businessId: string | undefined) {
  return useQuery({
    queryKey: ["business-reviews", businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<ReviewStats> => {
      const { data, error } = await supabase
        .from("business_reviews")
        .select("id, reviewer_name, rating, review_text, created_at, source")
        .eq("business_id", businessId!)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const reviews = (data || []) as BusinessReview[];
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      return { avgRating, totalReviews, reviews };
    },
    staleTime: 60_000,
  });
}

export function useTrustBadges(avgRating: number, reviewCount: number, createdAt: string | null) {
  const badges: { key: string; label: string; color: string }[] = [];

  if (avgRating >= 4.5 && reviewCount >= 5) {
    badges.push({ key: "top-rated", label: "Top Rated", color: "border-warning/30 text-warning bg-warning/5" });
  }
  if (reviewCount >= 10) {
    badges.push({ key: "highly-reviewed", label: "Highly Reviewed", color: "border-primary/30 text-primary bg-primary/5" });
  }
  if (createdAt) {
    const daysOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld <= 30) {
      badges.push({ key: "new", label: "New", color: "border-success/30 text-success bg-success/5" });
    }
  }

  return badges;
}
