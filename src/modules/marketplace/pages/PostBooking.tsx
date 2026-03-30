import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Star, ArrowRight, ThumbsUp } from "lucide-react";
import { CustomerViralLoop } from "../components/ViralLoopCards";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getBusinessBySlug, MOCK_BUSINESSES } from "../data/mockData";

export default function PostBooking() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const biz = getBusinessBySlug(slug || "");

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const relatedProviders = MOCK_BUSINESSES.filter((b) => b.slug !== slug).slice(0, 3);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating."); return; }
    if (!reviewerName.trim()) { toast.error("Please enter your name."); return; }
    setSubmitted(true);
    toast.success("Review submitted! Thank you.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Thanks for booking! | guzzl.pro</title></Helmet>
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Review Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">How was your experience?</h2>
          </div>

          {submitted ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-foreground font-medium mb-1">Thank you for your review!</p>
              <p className="text-sm text-muted-foreground">Your feedback helps other customers find great service.</p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      className="p-0.5"
                    >
                      <Star className={cn("h-7 w-7 transition-colors", i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30 hover:text-warning/50")} />
                    </button>
                  ))}
                </div>
              </div>
              <Input placeholder="Your name *" required value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
              <Textarea placeholder="Tell others about your experience…" rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
              <Button type="submit" className="w-full">Submit Review</Button>
            </form>
          )}
        </section>

        {/* Related Providers */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Need another service?</h2>
          <div className="space-y-3">
            {relatedProviders.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/marketplace/${b.slug}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow text-left"
              >
                <img src={b.logo_url} alt={b.business_name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{b.business_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-warning text-warning" /> {b.avg_rating} · {b.location_city}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        {/* Viral Loop */}
        <CustomerViralLoop />
      </div>
    </div>
  );
}
