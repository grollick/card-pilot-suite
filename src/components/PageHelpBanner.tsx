import { useState } from "react";
import { X, Lightbulb, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PageHelpBannerProps {
  storageKey: string;
  tooltip: string;
  videoTitle?: string;
  videoDescription?: string;
  videoDuration?: string;
}

export default function PageHelpBanner({
  storageKey,
  tooltip,
  videoTitle,
  videoDescription,
  videoDuration = "2 min",
}: PageHelpBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(`help_dismissed_${storageKey}`) === "1";
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`help_dismissed_${storageKey}`, "1");
    } catch {}
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
      >
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{tooltip}</p>
          {videoTitle && (
            <button className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline font-medium">
              <PlayCircle className="h-3.5 w-3.5" />
              {videoTitle}
              {videoDuration && <span className="text-muted-foreground">({videoDuration})</span>}
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
