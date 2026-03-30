import { Star, BadgeCheck, Award, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BusinessReview } from "../hooks/useBusinessReviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

interface ReviewListProps {
  reviews: BusinessReview[];
  avgRating: number;
  totalReviews: number;
}

export function ReviewList({ reviews, avgRating, totalReviews }: ReviewListProps) {
  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-warning text-warning" />
          <span className="text-xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalReviews} review{totalReviews !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-foreground">{r.reviewer_name}</span>
                <Stars rating={r.rating} />
              </div>
              {r.review_text && (
                <p className="text-sm text-muted-foreground">{r.review_text}</p>
              )}
              <span className="text-xs text-muted-foreground mt-1 block">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TrustBadgesProps {
  badges: { key: string; label: string; color: string }[];
}

export function TrustBadges({ badges }: TrustBadgesProps) {
  if (badges.length === 0) return null;

  const icons: Record<string, React.ReactNode> = {
    "top-rated": <BadgeCheck className="h-3 w-3 mr-1" />,
    "highly-reviewed": <Award className="h-3 w-3 mr-1" />,
    "new": <Sparkles className="h-3 w-3 mr-1" />,
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <Badge key={b.key} variant="outline" className={`text-xs ${b.color}`}>
          {icons[b.key]}
          {b.label}
        </Badge>
      ))}
    </div>
  );
}
