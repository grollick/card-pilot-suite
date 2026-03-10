import { MarketplaceApp, useAppReviews, useSubmitAppReview } from "@/hooks/useMarketplaceApps";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Star, Download, Check, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  app: MarketplaceApp | null;
  isInstalled: boolean;
  onInstall: () => void;
  onClose: () => void;
}

export default function AppDetailDialog({ app, isInstalled, onInstall, onClose }: Props) {
  const { user } = useAuth();
  const { data: reviews } = useAppReviews(app?.id || "");
  const submitReview = useSubmitAppReview();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  if (!app) return null;

  const priceLabel =
    app.pricing_type === "free" ? "Free" : app.pricing_type === "subscription" ? `$${app.price_amount}/mo` : `$${app.price_amount}`;

  return (
    <Dialog open={!!app} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg">📦</div>
            <div>
              <span className="block">{app.name}</span>
              <span className="text-xs font-normal text-muted-foreground">by {app.developer_name}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            {app.avg_rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {app.avg_rating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Download className="h-3.5 w-3.5" /> {app.install_count.toLocaleString()} installs
            </span>
            <Badge variant="secondary" className="text-2xs">{priceLabel}</Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{app.long_description || app.description}</p>

          {app.features.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Features</h4>
                <ul className="grid grid-cols-2 gap-1.5">
                  {app.features.map((f) => (
                    <li key={f} className="text-xs flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {app.permissions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Permissions
                </h4>
                <ul className="space-y-1">
                  {app.permissions.map((p) => (
                    <li key={p} className="text-xs text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Button className="w-full" disabled={isInstalled} onClick={onInstall}>
            {isInstalled ? "Already Installed" : `Install ${priceLabel !== "Free" ? `— ${priceLabel}` : ""}`}
          </Button>

          {/* Reviews */}
          <Separator />
          <div>
            <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Reviews</h4>

            {user && (
              <div className="mb-4 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={`h-4 w-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Write a review…"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    submitReview.mutate({ appId: app.id, rating, reviewText });
                    setReviewText("");
                  }}
                  disabled={submitReview.isPending}
                >
                  Submit Review
                </Button>
              </div>
            )}

            {reviews?.length ? (
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {r.review_text && <p className="text-xs text-muted-foreground">{r.review_text}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No reviews yet.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
