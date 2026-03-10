import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, MessageSquare, Plus, Tag, ArrowUpRight,
  Phone, Mail, DollarSign, CalendarPlus, Clock, UserX, FileText, CalendarX2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useNeedsFollowUp, type FollowUpContact, type OpportunityBucket } from "@/hooks/useNeedsFollowUp";
import { formatDistanceToNow } from "date-fns";

const bucketStyles: Record<string, string> = {
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  new_no_response: "bg-destructive/10 text-destructive border-destructive/20",
  unapproved_estimate: "bg-warning/10 text-warning border-warning/20",
  empty_schedule: "bg-warning/10 text-warning border-warning/20",
  due_soon: "bg-primary/10 text-primary border-primary/20",
  stale: "bg-muted text-muted-foreground border-border",
  inactive_customer: "bg-muted text-muted-foreground border-border",
};

const bucketIcons: Record<OpportunityBucket, typeof AlertTriangle> = {
  overdue: Clock,
  new_no_response: UserX,
  unapproved_estimate: FileText,
  empty_schedule: CalendarX2,
  due_soon: Clock,
  stale: AlertTriangle,
  inactive_customer: UserX,
};

export default function MissedOpportunities() {
  const navigate = useNavigate();
  const { data: contacts = [], isLoading } = useNeedsFollowUp();

  const urgentCount = contacts.filter(c => c.urgency === "urgent").length;
  const warningCount = contacts.filter(c => c.urgency === "warning").length;
  const totalPotentialValue = contacts.reduce((sum, c) => sum + (c.potential_value ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Missed Opportunities</h2>
            <p className="text-2xs text-muted-foreground">
              {contacts.length > 0
                ? `${contacts.length} item${contacts.length > 1 ? "s" : ""} need attention`
                : "All caught up!"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/contacts")}>
          View all <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body">
        {/* Summary row */}
        {!isLoading && contacts.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap items-center">
            {urgentCount > 0 && (
              <Badge variant="outline" className="text-2xs border-destructive/30 text-destructive bg-destructive/5">
                {urgentCount} urgent
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="text-2xs border-warning/30 text-warning bg-warning/5">
                {warningCount} potential
              </Badge>
            )}
            {totalPotentialValue > 0 && (
              <Badge variant="outline" className="text-2xs border-primary/30 text-primary bg-primary/5 gap-1">
                <DollarSign className="h-3 w-3" />
                ~${totalPotentialValue.toLocaleString()} at risk
              </Badge>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No missed opportunities ✓</p>
        ) : (
          <div className="space-y-0.5">
            {contacts.slice(0, 6).map((contact: FollowUpContact) => {
              const Icon = bucketIcons[contact.bucket];
              const isSystemItem = contact.bucket === "empty_schedule";

              return (
                <div
                  key={contact.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    contact.urgency === "urgent" ? "bg-destructive/10" :
                    contact.urgency === "warning" ? "bg-warning/10" : "bg-muted"
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${
                      contact.urgency === "urgent" ? "text-destructive" :
                      contact.urgency === "warning" ? "text-warning" : "text-muted-foreground"
                    }`} />
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (!isSystemItem) navigate(`/app/contacts/${contact.id}`);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {contact.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${bucketStyles[contact.bucket]}`}
                      >
                        {contact.bucket_label}
                      </Badge>
                    </div>

                    {contact.suggestion && (
                      <p className="text-2xs text-muted-foreground leading-relaxed line-clamp-2">
                        {contact.suggestion}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      {contact.potential_value != null && contact.potential_value > 0 && (
                        <span className="text-2xs font-semibold text-primary tabular-nums">
                          ~${contact.potential_value.toLocaleString()}
                        </span>
                      )}
                      {contact.last_activity_at && !isSystemItem && (
                        <span className="text-2xs text-muted-foreground">
                          {formatDistanceToNow(new Date(contact.last_activity_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    {contact.phone && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Call"
                        onClick={() => window.open(`tel:${contact.phone}`)}>
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {contact.email && !isSystemItem && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Email"
                        onClick={() => navigate(`/app/contacts/${contact.id}`)}>
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!isSystemItem && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Create task"
                        onClick={() => navigate(`/app/contacts/${contact.id}`)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isSystemItem && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Promote availability"
                        onClick={() => navigate("/app/promotions")}>
                        <Tag className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {contact.bucket === "inactive_customer" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Book appointment"
                        onClick={() => navigate("/app/bookings")}>
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estimate summary callout */}
        {!isLoading && contacts.filter(c => c.bucket === "unapproved_estimate").length > 0 && (
          <div className="border-t border-border mt-3 pt-3">
            <div className="flex items-center gap-2 px-1">
              <FileText className="h-3.5 w-3.5 text-warning shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {contacts.filter(c => c.bucket === "unapproved_estimate").length} estimate{contacts.filter(c => c.bucket === "unapproved_estimate").length > 1 ? "s" : ""}
                </span>
                {" "}worth{" "}
                <span className="font-semibold text-warning tabular-nums">
                  ${contacts.filter(c => c.bucket === "unapproved_estimate").reduce((s, c) => s + (c.potential_value ?? 0), 0).toLocaleString()}
                </span>
                {" "}ha{contacts.filter(c => c.bucket === "unapproved_estimate").length > 1 ? "ve" : "s"} not been approved.
              </p>
              <Button variant="ghost" size="sm" className="text-xs h-6 ml-auto shrink-0" onClick={() => navigate("/app/estimates")}>
                View
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
