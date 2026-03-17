import { format, formatDistanceToNow } from "date-fns";
import {
  Eye, MousePointer, Users, Calendar, Mail, MessageSquare,
  Phone, FileText, CheckCircle2, Circle, ArrowRight, Reply, MailCheck, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const activityIcons: Record<string, typeof Eye> = {
  card_view: Eye,
  cta_click: MousePointer,
  form_submit: Users,
  lead_form_submit: Users,
  booking_created: Calendar,
  booking_confirmed: Calendar,
  booking_cancelled: Calendar,
  email_sent: Mail,
  email_opened: Mail,
  email_replied: Reply,
  note_added: MessageSquare,
  call: Phone,
  text: MessageSquare,
  meeting: Calendar,
  task_created: FileText,
  task_completed: CheckCircle2,
  stage_changed: ArrowRight,
  file_shared: FileText,
  review_submitted: Star,
};

const activityColors: Record<string, string> = {
  card_view: "text-muted-foreground",
  cta_click: "text-primary",
  form_submit: "text-primary",
  lead_form_submit: "text-primary",
  booking_created: "text-[hsl(var(--success))]",
  booking_confirmed: "text-[hsl(var(--success))]",
  booking_cancelled: "text-destructive",
  email_sent: "text-muted-foreground",
  email_opened: "text-primary",
  email_replied: "text-[hsl(var(--success))]",
  note_added: "text-muted-foreground",
  call: "text-primary",
  text: "text-primary",
  meeting: "text-primary",
  task_created: "text-muted-foreground",
  task_completed: "text-[hsl(var(--success))]",
  stage_changed: "text-primary",
  file_shared: "text-muted-foreground",
  review_submitted: "text-warning",
};

type TimelineFilter = "all" | "notes" | "tasks" | "emails" | "bookings";

interface Props {
  activities: any[];
  filter: TimelineFilter;
  onFilterChange: (f: TimelineFilter) => void;
  onMarkReplied?: (activityId: string, leadId: string) => void;
}

const filterMap: Record<TimelineFilter, string[]> = {
  all: [],
  notes: ["note_added", "call"],
  tasks: ["task_created", "task_completed"],
  emails: ["email_sent", "email_opened", "email_replied"],
  bookings: ["booking_created", "booking_confirmed", "booking_cancelled"],
};

const filters: { key: TimelineFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
  { key: "emails", label: "Emails" },
  { key: "bookings", label: "Bookings" },
];

export default function ContactTimeline({ activities, filter, onFilterChange, onMarkReplied }: Props) {
  const filtered = filter === "all"
    ? activities
    : activities.filter(a => filterMap[filter].includes(a.activity_type));

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {filter === "all" ? "No activity yet. Log your first interaction above." : `No ${filter} activity.`}
        </p>
      )}

      <div className="space-y-0">
        {filtered.map((item: any, i: number) => {
          const Icon = activityIcons[item.activity_type] ?? Circle;
          const color = activityColors[item.activity_type] ?? "text-muted-foreground";
          return (
            <div key={item.id} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                {i < filtered.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="pt-1 pb-3 min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap bg-muted/30 rounded-lg p-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.occurred_at), { addSuffix: true })}
                    {" · "}
                    {format(new Date(item.occurred_at), "MMM d, h:mm a")}
                  </p>
                  {item.activity_type === "email_sent" && onMarkReplied && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-[hsl(var(--success))]"
                      onClick={() => onMarkReplied(item.id, item.lead_id)}
                    >
                      <Reply className="h-3 w-3" /> Mark replied
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { TimelineFilter };
