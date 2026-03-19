import { useState } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { useClientSubmitReview } from "@/hooks/useClientPortalActions";

interface PortalReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessUserId: string;
  businessName: string | null;
  leadId: string;
  clientName: string;
  clientEmail?: string;
}

export default function PortalReviewDialog({
  open, onOpenChange, businessUserId, businessName, leadId, clientName, clientEmail
}: PortalReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [hover, setHover] = useState(0);
  const submitReview = useClientSubmitReview();

  const handleSubmit = async () => {
    await submitReview.mutateAsync({
      businessUserId,
      leadId,
      reviewerName: clientName,
      reviewerEmail: clientEmail,
      rating,
      reviewText: text.trim() || undefined,
    });
    setRating(5);
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review {businessName || "Business"}</DialogTitle>
          <DialogDescription>
            Share your experience to help others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                type="button"
              >
                <Star className={`h-8 w-8 transition-colors ${
                  star <= (hover || rating)
                    ? "text-[hsl(var(--warning))] fill-[hsl(var(--warning))]"
                    : "text-muted-foreground/30"
                }`} />
              </button>
            ))}
          </div>

          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your experience…"
            rows={4}
          />

          <Button
            onClick={handleSubmit}
            disabled={submitReview.isPending}
            className="w-full shadow-glow gap-1.5"
          >
            {submitReview.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
