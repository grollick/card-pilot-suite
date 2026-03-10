import { format } from "date-fns";
import { GripVertical, Send, Calendar, CheckCircle2, CreditCard, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  item: any;
  type: "lead" | "estimate" | "job";
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onQuickAction: (action: string) => void;
  onClick: () => void;
}

export default function JobPipelineCard({ item, type, isDragging, onDragStart, onQuickAction, onClick }: Props) {
  const name = type === "lead"
    ? item.name
    : type === "estimate"
      ? item.leads?.name ?? "Unknown"
      : item.leads?.name ?? item.title;

  const service = type === "job" ? item.job_type ?? item.title : type === "estimate" ? item.job_type : null;
  const value = type === "estimate" ? item.grand_total : type === "job" ? (item.estimates?.grand_total ?? 0) : null;
  const date = type === "job"
    ? item.scheduled_start
    : type === "estimate"
      ? item.issue_date
      : item.created_at;

  const actions = getActions(type);

  const typeColor = type === "lead"
    ? "bg-primary/10 text-primary"
    : type === "estimate"
      ? "bg-warning/10 text-warning"
      : "bg-success/10 text-success";

  return (
    <motion.div
      layout
      layoutId={`pipeline-${type}-${item.id}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onClick={onClick}
        className={`interactive-card p-3 group ${isDragging ? "dragging" : ""}`}
      >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${typeColor}`}>
            {name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{name}</p>
            {service && <p className="text-caption truncate mt-0.5">{service}</p>}
          </div>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/50 transition-colors shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
      </div>

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {value != null && value > 0 && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold tabular-nums">
            ${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </Badge>
        )}
        {date && (
          <span className="text-caption tabular-nums">
            {format(new Date(date), "MMM d")}
          </span>
        )}
      </div>

      {/* Quick actions - visible on hover */}
      <div className="mt-2 flex justify-end">
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 flex gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-medium">⚡</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {actions.map((a) => (
                <DropdownMenuItem
                  key={a.key}
                  onClick={() => onQuickAction(a.key)}
                  className="text-xs gap-2"
                >
                  <a.icon className="h-3.5 w-3.5" /> {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

function getActions(type: string) {
  if (type === "lead") return [
    { key: "send_estimate", label: "Send Estimate", icon: Send },
    { key: "schedule", label: "Schedule", icon: Calendar },
  ];
  if (type === "estimate") return [
    { key: "send_estimate", label: "Send Estimate", icon: Send },
    { key: "schedule", label: "Schedule Job", icon: Calendar },
    { key: "mark_completed", label: "Mark Approved", icon: CheckCircle2 },
  ];
  return [
    { key: "mark_completed", label: "Mark Completed", icon: CheckCircle2 },
    { key: "send_invoice", label: "Send Invoice", icon: CreditCard },
    { key: "request_review", label: "Request Review", icon: Star },
  ];
}
