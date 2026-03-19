import { useNavigate } from "react-router-dom";
import {
  FileText, Briefcase, UserPlus, Share2, Tag, Zap, QrCode, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const actions = [
  { icon: FileText, label: "Estimate", route: "/app/estimates", color: "text-warning", desc: "Create quote" },
  { icon: DollarSign, label: "Invoice", route: "/app/invoices/new", color: "text-success", desc: "Bill customer" },
  { icon: Briefcase, label: "Job", route: "/app/jobs", color: "text-primary", desc: "Start a job" },
  { icon: UserPlus, label: "Contact", route: "/app/contacts", color: "text-accent", desc: "Add lead" },
  { icon: Share2, label: "Social Post", route: "/app/social", color: "text-accent", desc: "Post content" },
  { icon: Tag, label: "Promotion", route: "/app/promotions", color: "text-destructive", desc: "Run promo" },
  { icon: QrCode, label: "QR Code", route: "/app/card/qr", color: "text-primary", desc: "Share card" },
];

export default function QuickActionPanel() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Quick Actions</h2>
            <p className="text-2xs text-muted-foreground">Jump into common tasks</p>
          </div>
        </div>
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
                <span>{a.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
