import { useNavigate } from "react-router-dom";
import { UserPlus, CalendarPlus, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";

const actions = [
  { icon: UserPlus, label: "Add Lead", route: "/app/contacts?new=1", variant: "default" as const },
  { icon: CalendarPlus, label: "Book Appointment", route: "/app/bookings?new=1", variant: "outline" as const },
  { icon: Share2, label: "Share Card", route: "/app/card/qr", variant: "outline" as const },
];

export default function RevenueQuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useProfileCache();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.35 }}
      className="flex flex-wrap gap-2"
    >
      {actions.map((a, idx) => (
        <Button
          key={a.label}
          variant={a.variant}
          size="sm"
          className="gap-2 rounded-xl h-9 text-[13px] font-medium"
          onClick={() => navigate(a.route)}
        >
          <a.icon className="h-4 w-4" />
          {a.label}
        </Button>
      ))}
      {profile?.handle && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl h-9 text-[13px] font-medium"
          asChild
        >
          <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            View Card
          </a>
        </Button>
      )}
    </motion.div>
  );
}
