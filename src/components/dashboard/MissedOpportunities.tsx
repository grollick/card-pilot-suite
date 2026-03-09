import { useNavigate } from "react-router-dom";
import { AlertTriangle, MessageSquare, Plus, Tag, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useNeedsFollowUp, type FollowUpContact } from "@/hooks/useNeedsFollowUp";
import { formatDistanceToNow } from "date-fns";

const bucketStyles: Record<string, string> = {
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  new_no_response: "bg-warning/10 text-warning border-warning/20",
  due_soon: "bg-primary/10 text-primary border-primary/20",
  stale: "bg-muted text-muted-foreground border-border",
};

export default function MissedOpportunities() {
  const navigate = useNavigate();
  const { data: contacts = [], isLoading } = useNeedsFollowUp();

  const overdue = contacts.filter(c => c.bucket === "overdue").length;
  const newNoResponse = contacts.filter(c => c.bucket === "new_no_response").length;

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
                ? `${contacts.length} contact${contacts.length > 1 ? "s" : ""} need attention`
                : "All caught up!"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/contacts")}>
          View all <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body">
        {/* Summary badges */}
        {!isLoading && contacts.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {overdue > 0 && (
              <Badge variant="outline" className="text-2xs border-destructive/30 text-destructive bg-destructive/5">
                {overdue} overdue
              </Badge>
            )}
            {newNoResponse > 0 && (
              <Badge variant="outline" className="text-2xs border-warning/30 text-warning bg-warning/5">
                {newNoResponse} awaiting first contact
              </Badge>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No missed opportunities ✓</p>
        ) : (
          <div className="space-y-0.5">
            {contacts.slice(0, 5).map((contact: FollowUpContact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <Badge
                  variant="outline"
                  className={`text-2xs px-1.5 py-0.5 shrink-0 ${bucketStyles[contact.bucket]}`}
                >
                  {contact.bucket_label}
                </Badge>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/app/contacts/${contact.id}`)}
                >
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{contact.name}</p>
                  <p className="text-2xs text-muted-foreground truncate">
                    {contact.stage_name ?? contact.source.replace("_", " ")}
                    {contact.last_activity_at &&
                      ` · ${formatDistanceToNow(new Date(contact.last_activity_at), { addSuffix: true })}`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Send message"
                    onClick={() => navigate(`/app/contacts/${contact.id}`)}>
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Create task"
                    onClick={() => navigate(`/app/contacts/${contact.id}`)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Offer promotion"
                    onClick={() => navigate("/app/promotions")}>
                    <Tag className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
