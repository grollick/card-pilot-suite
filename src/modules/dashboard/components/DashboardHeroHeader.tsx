import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProfileCache } from "@/hooks/useProfileCache";
import {
  Pencil, UserPlus, CalendarPlus, ExternalLink,
  Zap, Store, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardHeroHeader() {
  const navigate = useNavigate();
  const { data: profile } = useProfileCache();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/10 p-6 sm:p-8"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--card)), hsl(var(--accent) / 0.06))",
      }}
    >
      <motion.div
        className="absolute -top-20 -right-20 h-60 w-60 rounded-full blur-3xl pointer-events-none"
        style={{ background: "hsl(var(--primary) / 0.12)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: "hsl(var(--accent) / 0.1)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "20px 20px",
      }} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {greeting}, {firstName}
            <motion.span
              className="inline-block ml-2"
              animate={{ rotate: [0, 14, -8, 14, 0] }}
              transition={{ duration: 1.8, delay: 0.8, ease: "easeInOut" }}
            >
              👋
            </motion.span>
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
            Here's how your business is doing today
          </motion.p>
        </div>

        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Button size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all hover:scale-[1.02]" onClick={() => navigate("/app/card")}>
            <Pencil className="h-3.5 w-3.5" /> Tweak Card
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm" onClick={() => navigate("/app/contacts?new=1")}>
            <UserPlus className="h-3.5 w-3.5" /> Add Lead
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm" onClick={() => navigate("/app/bookings?new=1")}>
            <CalendarPlus className="h-3.5 w-3.5" /> Book
          </Button>
          {profile?.handle && (
            <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm" asChild>
              <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> View Card
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate("/app/marketplace")}>
            <Store className="h-3.5 w-3.5" /> App Store
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate("/discover")}>
            <Globe className="h-3.5 w-3.5" /> Discover
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
