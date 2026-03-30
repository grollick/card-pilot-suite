import { useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReviewFormProps {
  businessId: string;
  bookingId?: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ businessId, bookingId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating."); return; }
    if (!reviewerName.trim()) { toast.error("Please enter your name."); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("business_reviews").insert({
        business_id: businessId,
        booking_id: bookingId || null,
        reviewer_name: reviewerName.trim(),
        rating,
        review_text: reviewText.trim() || null,
        is_approved: true,
        source: "marketplace",
      });

      if (error) throw error;

      // Refresh marketplace scores for this business
      await supabase.rpc("refresh_marketplace_scores", { p_business_id: businessId });

      setSubmitted(true);
      toast.success("Review submitted! Thank you.");
      onSubmitted?.();
    } catch (err) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <ThumbsUp className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-foreground font-medium mb-1">Thank you for your review!</p>
        <p className="text-sm text-muted-foreground">Your feedback helps other customers find great service.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setRating(i)} className="p-0.5">
              <Star className={cn(
                "h-7 w-7 transition-colors",
                i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30 hover:text-warning/50"
              )} />
            </button>
          ))}
        </div>
      </div>
      <Input
        placeholder="Your name *"
        required
        value={reviewerName}
        onChange={(e) => setReviewerName(e.target.value)}
      />
      <Textarea
        placeholder="Tell others about your experience…"
        rows={3}
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      />
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}
