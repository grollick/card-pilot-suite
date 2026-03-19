import { useState, useEffect } from "react";
import { Monitor, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface DesktopGuidanceNoticeProps {
  toolKey: string;
  reason?: string;
}

const DEFAULT_REASONS: Record<string, string> = {
  "card-builder": "Drag-and-drop editing and live preview work best with a larger screen.",
  "post-designer": "Visual editing and layout controls are optimized for desktop.",
  "estimate-builder": "Detailed line items and pricing tables are easier to manage on desktop.",
  "invoice-builder": "Line items, totals, and PDF preview are best on a wider screen.",
  "analytics": "Charts, comparisons, and data tables display better on desktop.",
  "block-marketplace": "Browsing and configuring blocks is smoother on desktop.",
};

export default function DesktopGuidanceNotice({ toolKey, reason }: DesktopGuidanceNoticeProps) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  const storageKey = `desktop-guidance-${toolKey}`;
  const neverShowKey = `desktop-guidance-never-${toolKey}`;

  useEffect(() => {
    if (!isMobile) return;
    if (localStorage.getItem(neverShowKey)) return;
    if (sessionStorage.getItem(storageKey)) return;
    setVisible(true);
  }, [isMobile, storageKey, neverShowKey]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(storageKey, "1");
  };

  const neverShow = () => {
    setVisible(false);
    localStorage.setItem(neverShowKey, "1");
  };

  const displayReason = reason || DEFAULT_REASONS[toolKey] || "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-3 right-3 z-[9999] max-w-md mx-auto rounded-xl border border-border bg-card p-4 shadow-lg"
        >
          <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Better on Desktop</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                You can still use this tool on mobile, but the best experience for advanced editing, layout control, and drag-and-drop is on desktop.
              </p>
              {displayReason && (
                <p className="text-[11px] text-muted-foreground/70 mt-1.5 italic">{displayReason}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={dismiss}>
              Continue on Mobile
            </Button>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-8" onClick={neverShow}>
              Don't show again
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
