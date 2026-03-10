import { useNavigate } from "react-router-dom";
import {
  FileText, Briefcase, UserPlus, Share2, Tag, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const actions = [
  { icon: FileText, label: "Estimate", route: "/app/estimates", color: "text-warning" },
  { icon: Briefcase, label: "Job", route: "/app/jobs", color: "text-primary" },
  { icon: UserPlus, label: "Contact", route: "/app/contacts", color: "text-success" },
  { icon: Share2, label: "Social Post", route: "/app/social", color: "text-accent" },
  { icon: Tag, label: "Promotion", route: "/app/promotions", color: "text-destructive" },
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
          <h2 className="font-semibold text-sm">Quick Actions</h2>
        </div>
      </div>
      <div className="dash-card-body">
        <div className="grid grid-cols-5 gap-2">
          {actions.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              className="flex-col h-[72px] gap-1.5 text-xs font-medium hover:bg-muted/50"
              onClick={() => navigate(a.route)}
            >
              <a.icon className={`h-5 w-5 ${a.color}`} />
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
