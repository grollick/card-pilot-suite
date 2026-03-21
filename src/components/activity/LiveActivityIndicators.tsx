import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Radio, Zap, Clock, Eye, Users, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** "Available Now" badge with subtle pulse */
export function AvailableNowBadge({ className = "" }: { className?: string }) {
  return (
    <Badge className={`text-[10px] font-semibold gap-1 bg-success/15 text-success border-success/25 shadow-sm shadow-success/5 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      Available Now
    </Badge>
  );
}

/** Response speed indicator */
export function ResponseSpeedBadge({ minutes }: { minutes: number }) {
  const label = minutes < 15 ? "Responds in ~15 min"
    : minutes < 30 ? "Responds in ~30 min"
    : minutes < 60 ? "Responds within 1 hr"
    : minutes < 240 ? "Responds within a few hours"
    : null;

  if (!label) return null;

  const isfast = minutes < 30;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={`text-[10px] gap-1 ${isfast ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
            {isfast ? <Zap className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Based on average response time to recent inquiries
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** "X people viewed recently" social proof */
export function RecentViewsBadge({ count }: { count: number }) {
  if (count < 3) return null;
  const display = count > 50 ? "50+" : `${count}`;
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Eye className="h-3 w-3" />
      {display} viewed recently
    </span>
  );
}

/** Live count header — "X professionals available right now" */
export function LiveAvailabilityCounter({ count, animate = true }: { count: number; animate?: boolean }) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-50" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="text-sm font-medium text-success">
          {count} professional{count !== 1 ? "s" : ""} available right now
        </span>
      </div>
    </motion.div>
  );
}

/** Request status — "X professionals reviewing" */
export function ReviewingIndicator({ matchCount, responseCount }: { matchCount: number; responseCount: number }) {
  return (
    <div className="space-y-3">
      {matchCount > 0 && responseCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15"
        >
          <div className="relative">
            <Users className="h-5 w-5 text-primary" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary text-[8px] text-primary-foreground font-bold items-center justify-center">
                {matchCount}
              </span>
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {matchCount} professional{matchCount !== 1 ? "s" : ""} reviewing your request
            </p>
            <p className="text-xs text-muted-foreground">Most respond within 1 hour</p>
          </div>
        </motion.div>
      )}

      {responseCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/15"
        >
          <Activity className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {responseCount} response{responseCount !== 1 ? "s" : ""} received
            </p>
            <p className="text-xs text-muted-foreground">Review and compare offers below</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/** Small "new nearby" micro-notification toast */
export function NearbyActivityToast({
  message,
  visible,
  onDismiss,
}: {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={onDismiss}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/95 backdrop-blur-md border border-border/60 shadow-xl text-sm text-foreground hover:bg-card transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            {message}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
