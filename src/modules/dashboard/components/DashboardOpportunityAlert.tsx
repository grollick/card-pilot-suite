import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardOpportunityAlert() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-destructive/30 p-4 sm:p-5 cursor-pointer group"
      style={{
        background: "linear-gradient(135deg, hsl(var(--destructive) / 0.12), hsl(var(--card)), hsl(var(--destructive) / 0.06))",
      }}
      onClick={() => navigate("/app/job-requests")}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <motion.div
        className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: "hsl(var(--destructive) / 0.15)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 flex items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-destructive/15 flex items-center justify-center">
            <Bell className="h-6 w-6 text-destructive" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-destructive" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-destructive">
            🔥 Incoming Opportunity!
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            You have a potential lead waiting for your response. Act fast to win the job!
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl gap-2 shadow-lg shadow-destructive/20 group-hover:shadow-xl group-hover:shadow-destructive/30 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Review & Respond
        </Button>
      </div>
    </motion.div>
  );
}
