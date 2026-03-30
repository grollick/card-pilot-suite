import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Copy, Send, RefreshCw, Pencil, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLeadReply, type LeadReplyResult } from "../hooks/useProviderInsights";
import { useLogReply } from "../hooks/useAutoReply";

interface LeadReplyDraftProps {
  lead: {
    lead_id: string;
    full_name: string;
    message?: string;
    email?: string;
    phone?: string;
    source?: string;
    service_title?: string;
  };
  onSent?: () => void;
  autoGenerate?: boolean;
}

export default function LeadReplyDraft({ lead, onSent, autoGenerate }: LeadReplyDraftProps) {
  const [draft, setDraft] = useState<LeadReplyResult | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [sent, setSent] = useState(false);

  const replyMutation = useLeadReply();
  const logReply = useLogReply();

  const generateDraft = () => {
    replyMutation.mutate(lead, {
      onSuccess: (result) => {
        setDraft(result);
        setEditedContent(result.reply);
        setIsEditing(false);
        setSent(false);
      },
      onError: (err: any) => {
        if (err.aiError) {
          toast.error(err.aiError.error === "ai_limit_reached"
            ? "AI limit reached — upgrade for more"
            : "This feature requires a higher plan");
        } else {
          toast.error("Could not generate reply");
        }
      },
    });
  };

  // Auto-generate on mount if requested
  useState(() => {
    if (autoGenerate && !draft && !replyMutation.isPending) {
      generateDraft();
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    toast.success("Reply copied — nice work 👍");
    logReply.mutate({
      leadId: lead.lead_id,
      messageType: "initial_reply",
      content: editedContent,
      wasUserEdited: editedContent !== draft?.reply,
    });
  };

  const handleSend = () => {
    logReply.mutate({
      leadId: lead.lead_id,
      messageType: "initial_reply",
      content: editedContent,
      wasUserEdited: editedContent !== draft?.reply,
    }, {
      onSuccess: () => {
        setSent(true);
        toast.success("Reply sent — nice work 👍", {
          icon: <CheckCircle2 className="h-4 w-4 text-success" />,
        });
        onSent?.();
      },
    });
  };

  // ── Sent state with animation ──
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-success/30 bg-success/5 p-5"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <CheckCircle2 className="h-6 w-6 text-success" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-foreground">Reply sent to {lead.full_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fast responses lead to more bookings</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header with trust label */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Suggested reply</span>
              <span className="text-[10px] text-muted-foreground ml-2">by Copilot</span>
            </div>
          </div>
          {!draft && (
            <Button
              size="sm"
              onClick={generateDraft}
              disabled={replyMutation.isPending}
              className="h-9 gap-1.5"
            >
              {replyMutation.isPending ? (
                <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Writing…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" /> Generate Reply</>
              )}
            </Button>
          )}
        </div>
        {/* Trust label */}
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <Bot className="h-2.5 w-2.5" />
          You can edit before sending
        </p>
      </div>

      <AnimatePresence mode="wait">
        {draft && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* What this customer wants */}
              {draft.summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                    What this customer wants
                  </p>
                  <p className="text-sm text-foreground">{draft.summary}</p>
                </div>
              )}

              {/* Missing info */}
              {draft.missingInfo?.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/5 border border-warning/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-0.5">Missing info</p>
                    <p className="text-xs text-foreground">
                      {draft.missingInfo.join(" · ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Reply content — editable inline */}
              <div className="relative">
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                    autoFocus
                  />
                ) : (
                  <div
                    className="p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/20 transition-colors group"
                    onClick={() => setIsEditing(true)}
                  >
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {editedContent}
                    </p>
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 block">
                      Click to edit
                    </span>
                  </div>
                )}
              </div>

              {/* Next step suggestion */}
              {draft.suggestedAction && (
                <p className="text-xs text-muted-foreground">
                  💡 <span className="font-medium">Next step:</span> {draft.suggestedAction}
                </p>
              )}

              {/* Actions — big, thumb-friendly, primary action first */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Button
                  size="default"
                  onClick={handleSend}
                  disabled={logReply.isPending}
                  className="h-10 gap-1.5 flex-1 sm:flex-none min-w-[140px]"
                >
                  <Send className="h-4 w-4" />
                  {logReply.isPending ? "Sending…" : "Send Reply"}
                </Button>
                <Button size="sm" onClick={handleCopy} variant="outline" className="h-9 gap-1">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-9 gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" /> {isEditing ? "Preview" : "Edit"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={generateDraft}
                  disabled={replyMutation.isPending}
                  className="h-9 gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${replyMutation.isPending ? "animate-spin" : ""}`} />
                  Redo
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!draft && !replyMutation.isPending && (
        <div className="p-6 text-center">
          <Sparkles className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Generate an AI reply — respond in under 10 seconds
          </p>
        </div>
      )}
    </div>
  );
}
