import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow, isFuture } from "date-fns";
import type { ClientBooking } from "@/hooks/useClientPortalData";

interface Props {
  bookings: ClientBooking[];
  onReschedule?: (booking: ClientBooking) => void;
}

export default function UpcomingAppointmentWidget({ bookings, onReschedule }: Props) {
  const next = bookings
    .filter(b => isFuture(new Date(b.start_datetime)) && b.status !== "cancelled")
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];

  if (!next) return null;

  const start = new Date(next.start_datetime);
  const end = new Date(next.end_datetime);
  const timeUntil = formatDistanceToNow(start, { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Next Appointment
        </h3>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {timeUntil}
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-base font-bold">{next.serviceName || "Service"}</p>
        {next.businessName && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" /> {next.businessName}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(start, "EEEE, MMM d")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(start, "h:mm a")} – {format(end, "h:mm a")}
          </span>
        </div>
      </div>

      {onReschedule && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => onReschedule(next)}>
          Reschedule
        </Button>
      )}
    </motion.div>
  );
}
