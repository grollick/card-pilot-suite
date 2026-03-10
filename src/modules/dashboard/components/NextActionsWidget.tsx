import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Users, FileText, Briefcase, DollarSign,
  CheckSquare, Calendar, AlertTriangle, Sparkles
} from "lucide-react";
import { useNextActions, type ActionItem } from "@/hooks/useNextActions";
import { Skeleton } from "@/components/ui/skeleton";

const typeIcons: Record<ActionItem["type"], typeof Users> = {
  leads_waiting: Users,
  estimates_pending: FileText,
  jobs_today: Briefcase,
  invoices_overdue: DollarSign,
  tasks_due: CheckSquare,
  bookings_pending: Calendar,
  followups_needed: AlertTriangle,
};

const urgencyStyles: Record<ActionItem["urgency"], { bg: string; text: string; ring: string; dot: string }> = {
  high: {
    bg: "bg-destructive/8",
    text: "text-destructive",
    ring: "ring-destructive/20",
    dot: "bg-destructive",
  },
  medium: {
    bg: "bg-warning/8",
    text: "text-warning",
    ring: "ring-warning/20",
    dot: "bg-warning",
  },
  low: {
    bg: "bg-primary/8",
    text: "text-primary",
    ring: "ring-primary/20",
    dot: "bg-primary",
  },
};

export default function NextActionsWidget() {
  const navigate = useNavigate();
  const { data: actions, isLoading } = useNextActions();

  if (isLoading) {
    return (
      <div className="dash-card">
        <div className="dash-card-header">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="dash-card-body space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="dash-card"
      >
        <div className="dash-card-body text-center py-6">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-semibold text-foreground">You're all caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">No urgent actions right now. Great job.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="dash-card overflow-hidden"
    >
      <div className="dash-card-header">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          What should I do next?
        </h2>
        <span className="text-2xs text-muted-foreground">{actions.length} action{actions.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="dash-card-body space-y-2">
        {actions.map((action, i) => {
          const Icon = typeIcons[action.type];
          const style = urgencyStyles[action.urgency];

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => navigate(action.route)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl ${style.bg} ring-1 ${style.ring} hover:ring-2 transition-all group text-left`}
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
                <Icon className={`h-4.5 w-4.5 ${style.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  <span className={`${style.text} tabular-nums`}>{action.count}</span>{" "}
                  {action.label}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
