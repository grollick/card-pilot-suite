import { motion } from "framer-motion";
import { Star, Trash2, Loader2, MessageSquareQuote, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReviews, useDeleteReview } from "@/hooks/useReviews";
import { useProfile } from "@/hooks/useCard";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function ReviewsPage() {
  const { data: reviews = [], isLoading } = useReviews();
  const { data: profile } = useProfile();
  const deleteReview = useDeleteReview();

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const copyReviewLink = () => {
    if (!profile?.handle) { toast.error("Set a handle first"); return; }
    navigator.clipboard.writeText(`${window.location.origin}/${profile.handle}?review=1`);
    toast.success("Review link copied!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-description">Manage client reviews displayed on your card</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={copyReviewLink}>
          <Copy className="h-4 w-4" /> Copy Review Link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="dash-card p-5 text-center">
          <p className="text-3xl font-bold tabular-nums">{reviews.length}</p>
          <p className="text-2xs text-muted-foreground mt-1 font-medium">Total Reviews</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="dash-card p-5 text-center">
          <p className="text-3xl font-bold flex items-center justify-center gap-1 tabular-nums">{avgRating} <Star className="h-5 w-5 text-warning fill-warning" /></p>
          <p className="text-2xs text-muted-foreground mt-1 font-medium">Average Rating</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="dash-card p-5 text-center">
          <p className="text-3xl font-bold tabular-nums">{reviews.filter(r => r.is_public).length}</p>
          <p className="text-2xs text-muted-foreground mt-1 font-medium">Public Reviews</p>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 dash-card border-dashed">
          <MessageSquareQuote className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg mb-1">No reviews yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Share your review link with clients to start collecting feedback.</p>
          <Button variant="outline" onClick={copyReviewLink} className="gap-1.5">
            <Copy className="h-4 w-4" /> Copy Review Link
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <motion.div key={review.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="dash-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{review.reviewer_name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "text-warning fill-warning" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                    {!review.is_public && <Badge variant="secondary" className="text-2xs">Hidden</Badge>}
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>
                  )}
                  <p className="text-2xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => { deleteReview.mutate(review.id); toast.success("Review deleted"); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
