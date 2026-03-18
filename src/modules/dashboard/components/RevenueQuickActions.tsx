import { useNavigate } from "react-router-dom";
import { Phone, MessageSquare, CalendarPlus, UserPlus, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const actions = [
  { icon: Phone, label: "Call Lead", route: "/app/contacts", color: "text-success", desc: "Follow up by phone" },
  { icon: MessageSquare, label: "Send Message", route: "/app/contacts", color: "text-primary", desc: "Email or text" },
  { icon: CalendarPlus, label: "Book Appointment", route: "/app/bookings", color: "text-warning", desc: "Schedule a job" },
  { icon: UserPlus, label: "Add Contact", route: "/app/contacts", color: "text-accent", desc: "New lead" },
  { icon: FileText, label: "Create Estimate", route: "/app/estimates", color: "text-destructive", desc: "Send a quote" },
  { icon: Share2, label: "Share Card", route: "/app/card/qr", color: "text-primary", desc: "Get more leads" },
];

export default function RevenueQuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <h2 className="font-semibold text-sm">Quick Actions</h2>
        <span className="text-2xs text-muted-foreground">Generate revenue now</span>
      </div>
      <div className="dash-card-body">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {actions.map((a, idx) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Button
                variant="outline"
                className="flex-col h-[76px] w-full gap-1 text-xs font-medium hover:bg-muted/50 hover:border-primary/20 transition-all group"
                onClick={() => navigate(a.route)}
              >
                <a.icon className={`h-5 w-5 ${a.color} transition-transform group-hover:scale-110`} />
                <span className="leading-tight text-center">{a.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
