import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessReviews } from "../hooks/useBusinessReviews";
import { ReviewList } from "./ReviewDisplay";

interface ReviewDashboardProps {
  businessId: string | undefined;
}

export function ReviewDashboard({ businessId }: ReviewDashboardProps) {
  const { data, isLoading } = useBusinessReviews(businessId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  const { avgRating = 0, totalReviews = 0, reviews = [] } = data || {};

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Star className="h-5 w-5 text-warning mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <MessageSquare className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalReviews}</p>
          <p className="text-xs text-muted-foreground">Total Reviews</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {totalReviews >= 5 && avgRating >= 4.5 ? "High" : totalReviews >= 3 ? "Good" : "New"}
          </p>
          <p className="text-xs text-muted-foreground">Trust Level</p>
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs text-primary font-medium">
          💡 Get more reviews to rank higher in marketplace results. Share your card after each completed job!
        </p>
      </div>

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Reviews</h3>
          <ReviewList reviews={reviews.slice(0, 5)} avgRating={avgRating} totalReviews={totalReviews} />
        </div>
      )}

      {reviews.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p>No reviews yet. Complete jobs and share your card to get your first review!</p>
        </div>
      )}
    </div>
  );
}
