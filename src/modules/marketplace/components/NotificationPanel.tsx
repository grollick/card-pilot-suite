import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X, MessageSquare, Calendar, Star, Zap, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
  type BusinessNotification,
} from "../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  new_lead: { icon: MessageSquare, color: "text-primary" },
  high_intent_lead: { icon: Zap, color: "text-warning" },
  follow_up: { icon: AlertTriangle, color: "text-warning" },
  booking_pending: { icon: Calendar, color: "text-primary" },
  booking_reminder: { icon: Calendar, color: "text-muted-foreground" },
  review_request: { icon: Star, color: "text-accent-foreground" },
  ai_usage_warning: { icon: Zap, color: "text-destructive" },
  upgrade: { icon: ArrowUpRight, color: "text-primary" },
};

const URGENCY_STYLES: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-border bg-card",
};

function NotificationCard({ n, onAction }: { n: BusinessNotification; onAction: () => void }) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const cfg = TYPE_CONFIG[n.type] ?? { icon: Bell, color: "text-muted-foreground" };
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.entity_type === "lead" && n.entity_id) navigate(`/app/marketplace-hub?lead=${n.entity_id}`);
    else if (n.entity_type === "booking" && n.entity_id) navigate(`/app/marketplace-hub?booking=${n.entity_id}`);
    onAction();
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={handleClick}
      className={`w-full text-left p-3 rounded-lg border-l-4 transition-colors hover:bg-accent/30 ${
        URGENCY_STYLES[n.urgency] ?? URGENCY_STYLES.medium
      } ${n.is_read ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 ${cfg.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${n.is_read ? "text-muted-foreground" : "font-medium text-foreground"}`}>
            {n.title}
          </p>
          {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </span>
            {n.action_label && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {n.action_label}
              </Badge>
            )}
          </div>
        </div>
        {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
      </div>
    </motion.button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: Props) {
  const { data: notifications = [], isLoading } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAllRead = useMarkAllRead();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5 min-w-5 px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {isLoading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                )}
                {!isLoading && notifications.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="font-medium text-foreground">You're all caught up</p>
                    <p className="text-xs text-muted-foreground mt-1">No new notifications right now</p>
                  </div>
                )}
                <AnimatePresence>
                  {notifications.map((n) => (
                    <NotificationCard key={n.id} n={n} onAction={onClose} />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
