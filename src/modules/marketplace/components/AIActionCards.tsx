import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Copy, Check, Loader2, RefreshCw, AlertCircle,
  Send, MessageSquare, Star, Calendar, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useLeadReply, useFollowUp, useBookingConfirm, useReviewRequest,
  type LeadReplyResult, type FollowUpResult, type BookingConfirmResult, type ReviewRequestResult,
} from "../hooks/useProviderInsights";

/** Copy button helper */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs gap-1"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied!");
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ─── LEAD REPLY CARD ───

interface LeadReplyCardProps {
  lead: { id?: string; full_name: string; message?: string; email?: string; phone?: string; source?: string; created_at?: string };
  onUseReply?: (reply: string) => void;
}

export function LeadReplyCard({ lead, onUseReply }: LeadReplyCardProps) {
  const { mutate, isPending, data, reset } = useLeadReply();
  const [editedReply, setEditedReply] = useState("");

  const result = data as LeadReplyResult | undefined;

  const generate = () => {
    reset();
    mutate(lead, {
      onSuccess: (res) => setEditedReply(res?.reply || ""),
      onError: (err) => toast.error(err.message || "Failed to generate reply"),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">AI Lead Assistant</h3>
          <p className="text-[10px] text-muted-foreground">Analyze & draft a reply</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={generate} disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {result ? "Regenerate" : "Generate Reply"}
        </Button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Summary */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-foreground mb-1">Summary</p>
            <p className="text-xs text-muted-foreground">{result.summary}</p>
          </div>

          {/* Missing info */}
          {result.missingInfo?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5" />
              {result.missingInfo.map((info, i) => (
                <Badge key={i} variant="outline" className="text-[10px] bg-warning/5 text-warning border-warning/20">
                  Missing: {info}
                </Badge>
              ))}
            </div>
          )}

          {/* Editable reply */}
          <div>
            <p className="text-xs font-medium text-foreground mb-1.5">Suggested Reply</p>
            <Textarea
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              rows={4}
              className="text-sm"
            />
          </div>

          {/* Next action */}
          {result.suggestedAction && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Next step:</span> {result.suggestedAction}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <CopyBtn text={editedReply} />
            {onUseReply && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onUseReply(editedReply)}>
                <Send className="h-3 w-3" /> Use Reply
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── FOLLOW-UP CARD ───

interface FollowUpCardProps {
  lead: { id?: string; full_name: string; message?: string; created_at?: string };
  onMarkContacted?: () => void;
}

export function FollowUpCard({ lead, onMarkContacted }: FollowUpCardProps) {
  const { mutate, isPending, data, reset } = useFollowUp();
  const result = data as FollowUpResult | undefined;

  return (
    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-4 w-4 text-warning" />
        <p className="text-sm font-medium text-foreground">Follow-up needed</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {lead.full_name} hasn't been contacted yet. Send a follow-up to avoid losing this opportunity.
      </p>

      {!result ? (
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => mutate(lead)} disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generate Follow-up
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="p-3 rounded-lg bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Subject: {result.subject}</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{result.message}</p>
          </div>
          <div className="flex gap-2">
            <CopyBtn text={result.message} />
            {onMarkContacted && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onMarkContacted}>
                <Check className="h-3 w-3" /> Mark Contacted
              </Button>
            )}
            <button onClick={() => { reset(); mutate(lead); }} className="text-[10px] text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3 w-3 inline mr-0.5" /> Regenerate
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── BOOKING CONFIRM CARD ───

interface BookingConfirmCardProps {
  booking: { customer_name: string; booking_date: string; booking_time?: string; notes?: string };
}

export function BookingConfirmCard({ booking }: BookingConfirmCardProps) {
  const { mutate, isPending, data, reset } = useBookingConfirm();
  const result = data as BookingConfirmResult | undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Booking Assistant</p>
      </div>

      {!result ? (
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => mutate(booking)} disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generate Messages
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Confirmation</p>
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-foreground">{result.confirmation}</div>
            <div className="mt-1.5"><CopyBtn text={result.confirmation} /></div>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Reminder</p>
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-foreground">{result.reminder}</div>
            <div className="mt-1.5"><CopyBtn text={result.reminder} /></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── REVIEW REQUEST CARD ───

interface ReviewRequestCardProps {
  booking: { customer_name: string; booking_date?: string };
}

export function ReviewRequestCard({ booking }: ReviewRequestCardProps) {
  const { mutate, isPending, data, reset } = useReviewRequest();
  const result = data as ReviewRequestResult | undefined;

  return (
    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-4 w-4 text-warning" />
        <p className="text-sm font-medium text-foreground">Ask for a Review</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Request a review from {booking.customer_name} to boost your marketplace ranking.
      </p>

      {!result ? (
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => mutate(booking)} disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generate Request
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="p-3 rounded-lg bg-card border border-border text-sm text-foreground whitespace-pre-wrap">
            {result.message}
          </div>
          <div className="flex gap-2">
            <CopyBtn text={result.message} />
            <button onClick={() => { reset(); mutate(booking); }} className="text-[10px] text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3 w-3 inline mr-0.5" /> Regenerate
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── PROFILE OPTIMIZE PANEL ───

import { useProfileOptimize, type ProfileSuggestion } from "../hooks/useProviderInsights";

const fieldIcons: Record<string, typeof Bot> = {
  headline: MessageSquare,
  description: MessageSquare,
  services: Star,
  logo: ImagePlus,
  cover: ImagePlus,
  phone: AlertCircle,
  email: AlertCircle,
  website: AlertCircle,
};

// ImagePlus not imported above, add it
import { ImagePlus } from "lucide-react";

export function ProfileOptimizePanel() {
  const { data: suggestions, isLoading } = useProfileOptimize();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your profile…</p>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <Check className="h-6 w-6 text-success mx-auto mb-1" />
        <p className="text-sm font-medium text-foreground">Profile looks great!</p>
        <p className="text-xs text-muted-foreground">No improvements needed right now.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Profile Optimization Tips</h3>
      </div>
      <div className="divide-y divide-border">
        {suggestions.map((s, i) => {
          const Icon = fieldIcons[s.field] || Bot;
          return (
            <div key={i} className="px-5 py-3 flex items-start gap-3">
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{s.suggestion}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ml-auto shrink-0 ${
                s.priority === "high" ? "text-destructive border-destructive/20" :
                s.priority === "medium" ? "text-warning border-warning/20" :
                "text-muted-foreground"
              }`}>
                {s.priority}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
