import { useState } from "react";
import { Sparkles, Copy, Check, Loader2, RefreshCw, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAIReplyDraft } from "@/hooks/useAICopilot";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  leadId: string;
  leadName: string;
}

export default function AIReplyDraftCopilot({ leadId, leadName }: Props) {
  const { data, isLoading, isFetching } = useAIReplyDraft(leadId);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const queryClient = useQueryClient();

  if (dismissed || (!isLoading && !data?.draft)) return null;

  const handleCopy = () => {
    if (data?.draft) {
      navigator.clipboard.writeText(data.draft);
      setCopied(true);
      toast.success("Reply copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-reply-draft", leadId] });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/[0.02] overflow-hidden"
      >
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary">AI Copilot</span>
            <span className="text-[10px] text-muted-foreground">• Suggested reply for {leadName}</span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={isFetching}
                onClick={handleRefresh}
              >
                <RefreshCw className={`h-3 w-3 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground px-1.5"
                onClick={() => setDismissed(true)}
              >
                Dismiss
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Drafting personalized reply...</span>
            </div>
          ) : (
            <>
              {data?.subject && (
                <p className="text-[11px] text-muted-foreground mb-1">
                  <Mail className="h-3 w-3 inline mr-1" />
                  Subject: <span className="font-medium text-foreground">{data.subject}</span>
                </p>
              )}
              <div className="bg-card/80 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed border border-border/50">
                {data?.draft}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy Reply"}
                </Button>
                {data?.follow_up_suggestion && (
                  <span className="text-[10px] text-muted-foreground italic">
                    💡 {data.follow_up_suggestion}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
