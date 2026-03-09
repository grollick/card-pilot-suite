import { useState } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReview } from "@/hooks/useReviews";
import { toast } from "sonner";

interface ReviewFormProps {
  userId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ userId, onSuccess }: ReviewFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [hover, setHover] = useState(0);
  const submitReview = useSubmitReview();

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    await submitReview.mutateAsync({
      user_id: userId,
      reviewer_name: name.trim(),
      reviewer_email: email.trim() || null,
      rating,
      review_text: text.trim() || null,
      is_public: true,
    });
    toast.success("Thank you for your review!");
    setName(""); setEmail(""); setRating(5); setText("");
    onSuccess?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
          >
            <Star className={`h-7 w-7 transition-colors ${
              star <= (hover || rating)
                ? "text-[hsl(var(--warning))] fill-[hsl(var(--warning))]"
                : "text-muted-foreground/30"
            }`} />
          </button>
        ))}
      </div>
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name *" />
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email" />
      <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience…" rows={3} />
      <Button onClick={handleSubmit} disabled={submitReview.isPending} className="w-full shadow-glow gap-1.5">
        {submitReview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit Review
      </Button>
    </div>
  );
}
