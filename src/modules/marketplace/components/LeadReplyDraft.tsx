import { useState } from "react";
import { Bot, Copy, Send, RefreshCw, X, Pencil, CheckCircle2 } from "lucide-react";
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
}

export default function LeadReplyDraft({ lead, onSent }: LeadReplyDraftProps) {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    toast.success("Reply copied to clipboard");
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
        toast.success("Reply logged as sent");
        onSent?.();
      },
    });
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Reply sent to {lead.full_name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Reply Draft</span>
          <Badge variant="outline" className="text-xs">for {lead.full_name}</Badge>
        </div>
        {!draft && (
          <Button size="sm" onClick={generateDraft} disabled={replyMutation.isPending}>
            {replyMutation.isPending ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Generating…</>
            ) : (
              <><Bot className="h-3.5 w-3.5 mr-1" /> Generate Reply</>
            )}
          </Button>
        )}
      </div>

      {draft && (
        <div className="p-4 space-y-3">
          {/* Summary */}
          {draft.summary && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">Summary</p>
              <p className="text-sm text-foreground">{draft.summary}</p>
            </div>
          )}

          {/* Missing info */}
          {draft.missingInfo?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.missingInfo.map((info, i) => (
                <Badge key={i} variant="secondary" className="text-xs">Missing: {info}</Badge>
              ))}
            </div>
          )}

          {/* Reply content */}
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={5}
              className="text-sm"
            />
          ) : (
            <div className="p-3 rounded-lg border border-border bg-background">
              <p className="text-sm text-foreground whitespace-pre-wrap">{editedContent}</p>
            </div>
          )}

          {/* Suggested action */}
          {draft.suggestedAction && (
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Next step:</span> {draft.suggestedAction}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={handleCopy} variant="outline">
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
            <Button size="sm" onClick={handleSend}>
              <Send className="h-3.5 w-3.5 mr-1" /> Use Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" /> {isEditing ? "Preview" : "Edit"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={generateDraft}
              disabled={replyMutation.isPending}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${replyMutation.isPending ? "animate-spin" : ""}`} /> Regenerate
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setDraft(null); setEditedContent(""); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Dismiss
            </Button>
          </div>
        </div>
      )}

      {!draft && !replyMutation.isPending && (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Generate an AI-powered reply to respond faster</p>
        </div>
      )}
    </div>
  );
}
