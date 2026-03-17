import { useNavigate } from "react-router-dom";
import {
  DollarSign, UserPlus, CalendarCheck, Star, Ghost,
  Send, Plus, CheckCircle2, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRevenueOpportunities, type RevenueOpportunity } from "@/hooks/useRevenueOpportunities";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateTask } from "@/hooks/useTasks";
import { toast } from "sonner";
import { useState } from "react";

const typeConfig: Record<string, { icon: typeof DollarSign; label: string; color: string }> = {
  follow_up: { icon: UserPlus, label: "Follow Up", color: "text-primary bg-primary/10" },
  rebook: { icon: CalendarCheck, label: "Rebook", color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950" },
  inactive: { icon: Ghost, label: "Win Back", color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950" },
  review: { icon: Star, label: "Review", color: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950" },
};

const urgencyBadge: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export default function RevenueOpportunities() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: opportunities = [], isLoading } = useRevenueOpportunities();
  const createTask = useCreateTask();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (isLoading) return null;
  
  const visible = opportunities.filter(o => !dismissedIds.has(o.id)).slice(0, 6);
  if (visible.length === 0) return null;

  const handleCreateTask = async (opp: RevenueOpportunity) => {
    if (!user || !opp.contactId) return;
    try {
      await createTask.mutateAsync({
        title: `${opp.title}: ${opp.contactName}`,
        type: "follow_up",
        priority: opp.urgency === "high" ? "high" : "medium",
        lead_id: opp.contactId,
        due_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Task created");
      setDismissedIds(prev => new Set(prev).add(opp.id));
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Revenue Opportunities</h2>
        </div>
        <Badge variant="secondary" className="text-2xs font-medium">
          {opportunities.length} action{opportunities.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="dash-card-body space-y-1">
        {visible.map((opp) => {
          const config = typeConfig[opp.type] ?? typeConfig.follow_up;
          const Icon = config.icon;
          return (
            <div
              key={opp.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{opp.contactName}</p>
                <p className="text-xs text-muted-foreground truncate">{opp.subtitle}</p>
              </div>
              <Badge variant="outline" className={`text-2xs shrink-0 ${urgencyBadge[opp.urgency]}`}>
                {config.label}
              </Badge>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="Create task"
                  onClick={(e) => { e.stopPropagation(); handleCreateTask(opp); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                {opp.contactId && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="View contact"
                    onClick={() => navigate(`/app/contacts/${opp.contactId}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="Dismiss"
                  onClick={(e) => { e.stopPropagation(); handleDismiss(opp.id); }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
