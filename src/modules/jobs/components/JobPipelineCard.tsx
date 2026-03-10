import { format } from "date-fns";
import { GripVertical, Send, Calendar, CheckCircle2, CreditCard, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const statusLabel = type === "job" ? item.status : type === "estimate" ? item.status : item.lifecycle_stage;

  const actions = getActions(type);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`p-3 rounded-lg border border-border bg-card hover:shadow-md transition-all cursor-pointer group ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary shrink-0">
            {name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            {service && <p className="text-[10px] text-muted-foreground truncate">{service}</p>}
          </div>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors shrink-0 mt-0.5" />
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {value != null && value > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
            ${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </Badge>
        )}
        {date && (
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(date), "MMM d")}
          </span>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-2 flex justify-end">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] font-medium">⚡</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
              {actions.map((a) => (
                <DropdownMenuItem key={a.key} onClick={() => onQuickAction(a.key)}>
                  <a.icon className="h-3.5 w-3.5 mr-2" /> {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
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
