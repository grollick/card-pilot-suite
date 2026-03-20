import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle } from "lucide-react";

type Status = "idle" | "saving" | "saved" | "error";

interface Props {
  status: Status;
  className?: string;
}

/**
 * Minimal inline save-state indicator.
 * Shows a subtle animation when saving / saved / error.
 */
export default function SaveIndicator({ status, className = "" }: Props) {
  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
        className={`inline-flex items-center gap-1 text-[10px] font-medium ${className}`}
      >
        {status === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Saving…</span>
          </>
        )}
        {status === "saved" && (
          <>
            <Check className="h-3 w-3 text-green-500" />
            <span className="text-green-600">Saved</span>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-3 w-3 text-destructive" />
            <span className="text-destructive">Error</span>
          </>
        )}
      </motion.span>
    </AnimatePresence>
  );
}
