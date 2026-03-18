import { AlertTriangle, AlertCircle, Info, ShieldAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRecentSystemEvents, type SystemEvent } from "@/hooks/useSystemEvents";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; badge: string }> = {
  critical: { icon: ShieldAlert, color: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
  error: { icon: AlertCircle, color: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
  warning: { icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400", badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" },
  info: { icon: Info, color: "text-blue-600 dark:text-blue-400", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
};

function EventRow({ event }: { event: SystemEvent }) {
  const cfg = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.error;
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-2xs ${cfg.badge}`}>
            {event.severity}
          </Badge>
          <span className="text-xs font-medium text-foreground">{event.event_type}</span>
          <span className="text-2xs text-muted-foreground ml-auto shrink-0">
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{event.message}</p>
      </div>
    </div>
  );
}

export default function SystemEventsWidget() {
  const { data: events, isLoading } = useRecentSystemEvents(20);

  const errorCount = events?.filter(e => e.severity === "error" || e.severity === "critical").length ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">System Events</h2>
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-2xs">{errorCount} errors</Badge>
          )}
        </div>
        <span className="text-2xs text-muted-foreground">Auto-refreshes every 30s</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No system events recorded yet
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {events.map(event => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
