import { useNavigate } from "react-router-dom";
import { UserPlus, CalendarCheck, QrCode, FileText, Star, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useRecentActivity } from "@/hooks/useDashboardStats";
import { formatDistanceToNow } from "date-fns";

const feedIcons: Record<string, typeof UserPlus> = {
  lead: UserPlus,
  booking: CalendarCheck,
  qr_scan: QrCode,
};

const feedStyles: Record<string, { bg: string; text: string }> = {
  lead: { bg: "bg-success/10", text: "text-success" },
  booking: { bg: "bg-warning/10", text: "text-warning" },
  qr_scan: { bg: "bg-primary/10", text: "text-primary" },
};

export default function DashboardActivityFeed() {
  const navigate = useNavigate();
  const { data: feed = [], isLoading } = useRecentActivity();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-foreground">Activity Feed</h2>
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        </div>
        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 rounded-full">
          Last 7 days
        </Badge>
      </div>

      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-10">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your card to start getting leads.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {feed.map((item, idx) => {
              const Icon = feedIcons[item.type] ?? FileText;
              const style = feedStyles[item.type] ?? { bg: "bg-muted", text: "text-muted-foreground" };
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (item.type === "lead") navigate(`/app/contacts/${item.id}`);
                    else if (item.type === "booking") navigate("/app/bookings");
                    else if (item.type === "qr_scan") navigate("/app/qr");
                  }}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                    <Icon className={`h-4 w-4 ${style.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
