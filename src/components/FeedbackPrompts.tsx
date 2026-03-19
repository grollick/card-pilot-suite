import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBetaAccess } from "@/hooks/useBetaAccess";

const PROMPT_TRIGGERS: Record<string, string> = {
  estimate_created: "How was your estimate creation experience?",
  card_published: "How's the card builder working for you?",
  social_posted: "Was scheduling your post easy?",
  booking_created: "How's the booking flow?",
};

/**
 * Shows contextual feedback prompts after key actions.
 * Usage: call `triggerPrompt("estimate_created")` from event handlers.
 */
export function useFeedbackPrompt() {
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [promptMessage, setPromptMessage] = useState("");

  const triggerPrompt = useCallback((action: string) => {
    // Only show occasionally (30% chance) to avoid fatigue
    if (Math.random() > 0.3) return;
    
    const dismissed = sessionStorage.getItem(`feedback_prompt_${action}`);
    if (dismissed) return;

    const msg = PROMPT_TRIGGERS[action];
    if (msg) {
      setActivePrompt(action);
      setPromptMessage(msg);
    }
  }, []);

  const dismissPrompt = useCallback(() => {
    if (activePrompt) {
      sessionStorage.setItem(`feedback_prompt_${activePrompt}`, "1");
    }
    setActivePrompt(null);
    setPromptMessage("");
  }, [activePrompt]);

  return { activePrompt, promptMessage, triggerPrompt, dismissPrompt };
}

/**
 * Contextual feedback prompt component - shown inline after actions.
 */
export function FeedbackPromptBanner({
  message,
  onFeedback,
  onDismiss,
}: {
  message: string;
  onFeedback: () => void;
  onDismiss: () => void;
}) {
  const { user } = useAuth();
  const { data: beta } = useMyBetaAccess();

  if (!user || !beta) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center justify-between gap-3 mb-4"
      >
        <div className="flex items-center gap-2 text-sm">
          <MessageSquarePlus className="h-4 w-4 text-primary shrink-0" />
          <span>{message}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onFeedback}>
            Share Feedback
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
