import { Badge } from "@/components/ui/badge";
import {
  FileText, Send, Eye, CheckCircle2, XCircle, Clock,
  AlertTriangle, Ban,
} from "lucide-react";

type DocStatus =
  | "draft" | "sent" | "viewed" | "approved" | "declined" | "expired"
  | "paid" | "overdue" | "cancelled";

const CONFIG: Record<DocStatus, { label: string; icon: any; classes: string }> = {
  draft:     { label: "Draft",     icon: FileText,      classes: "bg-muted text-muted-foreground border-border" },
  sent:      { label: "Sent",      icon: Send,          classes: "bg-primary/10 text-primary border-primary/20" },
  viewed:    { label: "Viewed",    icon: Eye,           classes: "bg-warning/10 text-warning border-warning/20" },
  approved:  { label: "Approved",  icon: CheckCircle2,  classes: "bg-success/10 text-success border-success/20" },
  declined:  { label: "Declined",  icon: XCircle,       classes: "bg-destructive/10 text-destructive border-destructive/20" },
  expired:   { label: "Expired",   icon: Clock,         classes: "bg-muted text-muted-foreground/60 border-border" },
  paid:      { label: "Paid",      icon: CheckCircle2,  classes: "bg-success/10 text-success border-success/20" },
  overdue:   { label: "Overdue",   icon: AlertTriangle,  classes: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelled", icon: Ban,           classes: "bg-muted text-muted-foreground/60 border-border" },
};

interface Props {
  status: string;
  size?: "sm" | "default";
}

export default function DocumentStatusBadge({ status, size = "default" }: Props) {
  const cfg = CONFIG[status as DocStatus] ?? CONFIG.draft;
  const Icon = cfg.icon;
  const sizeClasses = size === "sm"
    ? "text-[10px] h-5 px-1.5 gap-1"
    : "text-xs h-6 px-2 gap-1.5";

  return (
    <Badge variant="outline" className={`${cfg.classes} ${sizeClasses} font-medium`}>
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {cfg.label}
    </Badge>
  );
}
