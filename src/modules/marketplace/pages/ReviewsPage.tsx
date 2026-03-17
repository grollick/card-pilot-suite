import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Star, Trash2, Loader2, MessageSquareQuote, Copy, Reply, Flag,
  TrendingUp, Shield, Award, ThumbsUp, BarChart3, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useReviews, useDeleteReview, useRespondToReview, useReportReview, useToggleReviewPublic, type Review,
} from "@/hooks/useReviews";
import { useProfile } from "@/hooks/useCard";
import { toast } from "sonner";
import { formatDistanceToNow, subDays, format, startOfDay } from "date-fns";

// ── Trust badge logic ──
function getTrustBadges(reviews: Review[]) {
  const badges: { label: string; icon: typeof Award; color: string }[] = [];
  if (reviews.length === 0) return badges;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  if (avg >= 4.5 && reviews.length >= 5) badges.push({ label: "Top Rated", icon: Award, color: "text-warning" });
  if (reviews.length >= 10) badges.push({ label: "Verified Reviews", icon: Shield, color: "text-primary" });
  if (reviews.filter(r => r.rating === 5).length >= reviews.length * 0.7)
    badges.push({ label: "Customer Favorite", icon: ThumbsUp, color: "text-success" });
  return badges;
}

export default function ReviewsPage() {
  const { data: reviews = [], isLoading } = useReviews();
  const { data: profile } = useProfile();
  const deleteReview = useDeleteReview();
  const respondToReview = useRespondToReview();
  const reportReview = useReportReview();
  const togglePublic = useToggleReviewPublic();

  // ── Dialogs ──
  const [respondTo, setRespondTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [reportTarget, setReportTarget] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("");

  // ── Stats ──
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const trustBadges = useMemo(() => getTrustBadges(reviews), [reviews]);

  // ── 30-day trend ──
  const trendData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const day = startOfDay(subDays(new Date(), 29 - i));
      return { day, label: format(day, "MMM d"), count: 0, total: 0 };
    });
    reviews.forEach((r) => {
      const rd = startOfDay(new Date(r.created_at));
      const entry = days.find(d => d.day.getTime() === rd.getTime());
      if (entry) { entry.count++; entry.total += r.rating; }
    });
    return days;
  }, [reviews]);

  const recentAvg = useMemo(() => {
    const last7 = reviews.filter(r => new Date(r.created_at) > subDays(new Date(), 7));
    return last7.length > 0
      ? (last7.reduce((s, r) => s + r.rating, 0) / last7.length).toFixed(1)
      : null;
  }, [reviews]);

  // ── Rating distribution ──
  const distribution = useMemo(
    () => [5, 4, 3, 2, 1].map(n => ({
      stars: n,
      count: reviews.filter(r => r.rating === n).length,
      pct: reviews.length ? Math.round((reviews.filter(r => r.rating === n).length / reviews.length) * 100) : 0,
    })),
    [reviews],
  );

  const maxTrend = Math.max(1, ...trendData.map(d => d.count));

  const copyReviewLink = () => {
    if (!profile?.handle) { toast.error("Set a handle first"); return; }
    navigator.clipboard.writeText(`${window.location.origin}/${profile.handle}?review=1`);
    toast.success("Review link copied!");
  };

  const handleRespond = async () => {
    if (!respondTo || !responseText.trim()) return;
    await respondToReview.mutateAsync({ id: respondTo.id, response: responseText.trim() });
    toast.success("Response saved");
    setRespondTo(null);
    setResponseText("");
  };

  const handleReport = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    await reportReview.mutateAsync({ id: reportTarget.id, reason: reportReason.trim() });
    toast.success("Review reported");
    setReportTarget(null);
    setReportReason("");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Local Reputation Engine</h1>
          <p className="page-description">Collect, manage, and showcase customer reviews</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={copyReviewLink}>
          <Copy className="h-4 w-4" /> Copy Review Link
        </Button>
      </div>

      {/* Trust Badges */}
      {trustBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trustBadges.map((badge) => (
            <Badge key={badge.label} variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs font-semibold">
              <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
              {badge.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-card p-5 text-center">
          <p className="text-3xl font-bold tabular-nums">{reviews.length}</p>
          <p className="text-2xs text-muted-foreground mt-1 font-medium">Total Reviews</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="dash-card p-5 text-center">
          <p className="text-3xl font-bold flex items-center justify-center gap-1 tabular-nums">
            {avgRating} <Star className="h-5 w-5 text-warning fill-warning" />
          </p>
          <p className="text-2xs text-muted-foreground mt-1 font-medium">Average Rating</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="dash-card p-5 text-center">
          <p className="text-3xl font-bold tabular-nums">{reviews.filter(r => r.is_public).length}</p>
          <p className="text-2xs text-muted-foreground mt-1 font-medium">Public Reviews</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="dash-card p-5 text-center">
          <p className="text-3xl font-bold tabular-nums text-primary">{recentAvg ?? "—"}</p>
          <p className="text-2xs text-muted-foreground mt-1 font-medium">Last 7 Days Avg</p>
        </motion.div>
      </div>

      {/* Rating Distribution */}
      <Card className="dash-card">
        <CardContent className="pt-5 pb-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" /> Rating Distribution
          </h3>
          <div className="space-y-2">
            {distribution.map(d => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="text-xs w-4 text-right tabular-nums">{d.stars}</span>
                <Star className="h-3 w-3 text-warning fill-warning" />
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 tabular-nums">{d.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Trend */}
      <Card className="dash-card">
        <CardContent className="pt-5 pb-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" /> Reviews — Last 30 Days
          </h3>
          <div className="flex items-end gap-[2px] h-16">
            {trendData.map((d, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/70 transition-all hover:bg-primary"
                style={{ height: `${Math.max(4, (d.count / maxTrend) * 100)}%` }}
                title={`${d.label}: ${d.count} review${d.count !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{trendData[0]?.label}</span>
            <span className="text-[10px] text-muted-foreground">{trendData[trendData.length - 1]?.label}</span>
          </div>
        </CardContent>
      </Card>

      {/* Review List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 dash-card border-dashed">
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
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`dash-card p-5 ${review.reported ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{review.reviewer_name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3.5 w-3.5 ${j < review.rating ? "text-warning fill-warning" : "text-muted-foreground/20"}`}
                        />
                      ))}
                    </div>
                    {!review.is_public && <Badge variant="secondary" className="text-2xs">Hidden</Badge>}
                    {review.reported && <Badge variant="destructive" className="text-2xs">Reported</Badge>}
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>
                  )}

                  {/* Owner response */}
                  {review.owner_response && (
                    <div className="mt-3 pl-3 border-l-2 border-primary/30">
                      <p className="text-xs font-medium text-primary mb-0.5">Your Response</p>
                      <p className="text-sm text-muted-foreground">{review.owner_response}</p>
                    </div>
                  )}

                  <p className="text-2xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Respond"
                    onClick={() => { setRespondTo(review); setResponseText(review.owner_response || ""); }}
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </Button>
                  {!review.reported && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Report"
                      className="text-muted-foreground hover:text-warning"
                      onClick={() => { setReportTarget(review); setReportReason(""); }}
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { deleteReview.mutate(review.id); toast.success("Review deleted"); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Respond Dialog */}
      <Dialog open={!!respondTo} onOpenChange={(o) => !o && setRespondTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to {respondTo?.reviewer_name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response…"
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRespondTo(null)}>Cancel</Button>
            <Button
              onClick={handleRespond}
              disabled={respondToReview.isPending || !responseText.trim()}
              className="gap-1.5"
            >
              <Send className="h-4 w-4" /> Save Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Why is this review inappropriate?
          </p>
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="e.g. Spam, fake review, offensive language…"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={reportReview.isPending || !reportReason.trim()}
              className="gap-1.5"
            >
              <Flag className="h-4 w-4" /> Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
