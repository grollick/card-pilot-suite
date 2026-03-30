import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot, Pencil, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCreateSmsDraft, useSendSms } from "../hooks/useSmsMessages";

interface Props {
  leadId?: string;
  bookingId?: string;
  phone?: string;
  messageType: string;
  initialDraft?: string;
  onClose?: () => void;
  onSent?: () => void;
  label?: string;
}

export default function SmsComposer({
  leadId,
  bookingId,
  phone,
  messageType,
  initialDraft = "",
  onClose,
  onSent,
  label = "Send Text",
}: Props) {
  const [body, setBody] = useState(initialDraft);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const [sent, setSent] = useState(false);

  const createDraft = useCreateSmsDraft();
  const sendSms = useSendSms();

  useEffect(() => {
    setBody(initialDraft);
    setEdited(false);
    setSent(false);
    setDraftId(null);
  }, [initialDraft]);

  const handleSend = async () => {
    if (!body.trim()) return;

    try {
      // Create draft first if we don't have one
      let id = draftId;
      if (!id) {
        const draft = await createDraft.mutateAsync({
          leadId,
          bookingId,
          phone,
          messageType,
          messageBody: body,
          wasAiGenerated: !!initialDraft,
        });
        id = (draft as any)?.id;
        setDraftId(id!);
      }

      if (!id) throw new Error("Failed to create draft");

      await sendSms.mutateAsync({ id, messageBody: body, wasEdited: edited });

      setSent(true);
      toast.success("Text message sent — nice work 👍");
      onSent?.();
    } catch {
      toast.error("Failed to send message");
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-border bg-card p-4 text-center"
      >
        <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">Message queued</p>
        <p className="text-xs text-muted-foreground mt-1">It will be delivered shortly</p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {initialDraft && (
            <Badge variant="outline" className="text-[10px] gap-1 h-5 text-muted-foreground">
              <Bot className="h-3 w-3" /> Suggested by Copilot
            </Badge>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {phone && (
          <p className="text-xs text-muted-foreground">
            To: <span className="font-medium text-foreground">{phone}</span>
          </p>
        )}

        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (e.target.value !== initialDraft) setEdited(true);
          }}
          placeholder="Type your message…"
          className="min-h-[80px] text-sm resize-none"
          maxLength={1600}
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {body.length}/1600 chars
            {edited && " · Edited"}
          </span>
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={!body.trim() || sendSms.isPending || createDraft.isPending}
              onClick={handleSend}
            >
              {sendSms.isPending || createDraft.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          You can edit before sending · Message will be delivered via SMS
        </p>
      </div>
    </div>
  );
}
