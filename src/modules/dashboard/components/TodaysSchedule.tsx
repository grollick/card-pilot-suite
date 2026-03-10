import { useNavigate } from "react-router-dom";
import { CalendarCheck, Phone, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useBookings } from "@/hooks/useBookings";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export default function TodaysSchedule() {
  const navigate = useNavigate();
  const { data: allBookings = [], isLoading } = useBookings();

  const todayBookings = allBookings
    .filter((b: any) => b.status !== "cancelled" && b.start_datetime && isToday(parseISO(b.start_datetime)))
    .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  const tomorrowBookings = allBookings
    .filter((b: any) => b.status !== "cancelled" && b.start_datetime && isTomorrow(parseISO(b.start_datetime)))
    .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
            <CalendarCheck className="h-4 w-4 text-success" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Today's Schedule</h2>
            <p className="text-2xs text-muted-foreground">
              {todayBookings.length} booking{todayBookings.length !== 1 ? "s" : ""} today
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/bookings")}>
          View all <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : todayBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No bookings scheduled for today</p>
        ) : (
          <div className="space-y-1">
            {todayBookings.map((booking: any) => (
              <div
                key={booking.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer"
                onClick={() => navigate("/app/bookings")}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{booking.customer_name}</p>
                  <p className="text-2xs text-muted-foreground truncate">
                    {booking.booking_services?.name ?? "Service"} · {format(parseISO(booking.start_datetime), "h:mm a")}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {booking.customer_phone && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Call"
                      onClick={(e) => { e.stopPropagation(); window.open(`tel:${booking.customer_phone}`); }}>
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Badge variant="outline" className="text-2xs shrink-0 capitalize">{booking.status}</Badge>
              </div>
            ))}
          </div>
        )}

        {tomorrowBookings.length > 0 && (
          <div className="border-t border-border mt-3 pt-3">
            <p className="text-2xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Tomorrow</p>
            {tomorrowBookings.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 py-1.5 opacity-60">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs flex-1 truncate">{b.customer_name}</span>
                <span className="text-2xs text-muted-foreground tabular-nums">
                  {format(parseISO(b.start_datetime), "h:mm a")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
