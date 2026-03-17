import { useNavigate } from "react-router-dom";
import { Star, ArrowUpRight, CheckCircle2, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useReviewStats, useToggleReviewPublic, useDeleteReview, type Review } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

export default function ReviewsDashboardWidget() {
  const navigate = useNavigate();
  const { total, avg, pending, thisMonth, reviews } = useReviewStats();
  const togglePublic = useToggleReviewPublic();
  const deleteReview = useDeleteReview();

  const pendingReviews = reviews.filter(r => !r.is_public && !r.reported).slice(0, 3);
  const recentPublished = reviews.filter(r => r.is_public).slice(0, 3);

  const handleApprove = (id: string) => {
    togglePublic.mutate({ id, is_public: true });
    toast.success("Review approved & published");
  };

  const handleReject = (id: string) => {
    deleteReview.mutate(id);
    toast.success("Review rejected");
  };

  if (total === 0 && pending === 0) return null;

  return (
    <motion.div {...fadeUp} className="dash-card">
      <div className="dash-card-header">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Star className="h-4 w-4 text-warning" />
          Reviews
          {pending > 0 && (
            <Badge variant="destructive" className="text-2xs">{pending} pending</Badge>
          )}
        </h2>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/reviews")}>
          Manage <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{total}</p>
            <p className="text-2xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums flex items-center justify-center gap-1">
              {avg.toFixed(1)} <Star className="h-4 w-4 text-warning fill-warning" />
            </p>
            <p className="text-2xs text-muted-foreground">Avg Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums text-primary">{thisMonth}</p>
            <p className="text-2xs text-muted-foreground">This Month</p>
          </div>
        </div>

        {/* Pending approvals */}
        {pendingReviews.length > 0 && (
          <div className="space-y-2">
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">Pending Approval</p>
            {pendingReviews.map(review => (
              <div key={review.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-medium truncate">{review.reviewer_name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? "text-warning fill-warning" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="text-xs text-muted-foreground truncate">{review.review_text}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[hsl(var(--success))] hover:text-[hsl(var(--success))]" onClick={() => handleApprove(review.id)} title="Approve">
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleReject(review.id)} title="Reject">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent published */}
        {pendingReviews.length === 0 && recentPublished.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">Recent Reviews</p>
            {recentPublished.map(review => (
              <div key={review.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? "text-warning fill-warning" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
                <span className="text-xs truncate flex-1">{review.reviewer_name}</span>
                <span className="text-2xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
