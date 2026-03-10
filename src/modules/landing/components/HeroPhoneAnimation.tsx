import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  ChevronRight,
  Bell,
  UserPlus,
  CheckCircle2,
} from "lucide-react";

const STAGES = [
  { key: "idle", duration: 2000 },
  { key: "tap", duration: 800 },
  { key: "form", duration: 1800 },
  { key: "submitted", duration: 1200 },
  { key: "crm", duration: 3000 },
] as const;

type Stage = (typeof STAGES)[number]["key"];

export default function HeroPhoneAnimation() {
  const [stage, setStage] = useState<Stage>("idle");
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = (stageIdx + 1) % STAGES.length;
      setStageIdx(next);
      setStage(STAGES[next].key);
    }, STAGES[stageIdx].duration);
    return () => clearTimeout(timer);
  }, [stageIdx]);

  return (
    <div className="w-full max-w-[300px] mx-auto">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-2 border-border bg-card shadow-2xl overflow-hidden relative">
        {/* Notch */}
        <div className="flex justify-center pt-2.5 pb-1 bg-card">
          <div className="w-20 h-4 bg-foreground/10 rounded-full" />
        </div>

        {/* Screen */}
        <div className="bg-background min-h-[420px] relative overflow-hidden">
          {/* Card content — always visible but dims during CRM */}
          <motion.div
            animate={{ opacity: stage === "crm" ? 0.15 : 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Cover */}
            <div className="h-20 bg-gradient-to-r from-primary to-accent relative">
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
                <div className="h-14 w-14 rounded-full bg-card border-[3px] border-card shadow-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">AJ</span>
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="text-center mt-9 px-4">
              <h3 className="text-sm font-bold text-foreground">Alex Johnson</h3>
              <p className="text-[11px] text-muted-foreground">Premium Landscaping</p>
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
                <MapPin className="h-2.5 w-2.5" /> Austin, TX
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-1.5 px-4 mt-3">
              {[
                { icon: Phone, label: "Call" },
                { icon: MessageSquare, label: "Text" },
                { icon: Calendar, label: "Book" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium bg-primary/10 text-primary"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
              ))}
            </div>

            {/* Services */}
            <div className="px-4 mt-3">
              {["Lawn Care", "Garden Design", "Hardscaping"].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-1.5 py-1.5 text-[10px] text-foreground border-b border-border/50 last:border-0"
                >
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                  {s}
                </div>
              ))}
            </div>

            {/* Quote CTA — the button that gets "tapped" */}
            <div className="px-4 mt-3">
              <motion.div
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold bg-primary text-primary-foreground relative overflow-hidden"
                animate={
                  stage === "tap"
                    ? { scale: [1, 0.95, 1], transition: { duration: 0.3 } }
                    : {}
                }
              >
                {/* Ripple */}
                <AnimatePresence>
                  {stage === "tap" && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.4 }}
                      animate={{ scale: 3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute h-8 w-8 rounded-full bg-primary-foreground/30"
                    />
                  )}
                </AnimatePresence>
                📋 Request Quote
              </motion.div>
            </div>
          </motion.div>

          {/* Tap cursor indicator */}
          <AnimatePresence>
            {stage === "tap" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-[78px] left-1/2 -translate-x-1/2 z-10"
              >
                <div className="h-8 w-8 rounded-full bg-foreground/20 backdrop-blur-sm border-2 border-foreground/30 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-foreground/60" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form overlay */}
          <AnimatePresence>
            {(stage === "form" || stage === "submitted") && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute inset-x-0 bottom-0 bg-card border-t border-border rounded-t-2xl p-4 z-20 shadow-xl"
              >
                <div className="w-8 h-1 rounded-full bg-border mx-auto mb-3" />
                {stage === "form" ? (
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-foreground">Request a Quote</p>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-8 rounded-lg bg-muted border border-border overflow-hidden"
                    >
                      <div className="px-2.5 py-1.5 text-[10px] text-foreground whitespace-nowrap">
                        Sarah Williams
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="h-8 rounded-lg bg-muted border border-border overflow-hidden"
                    >
                      <div className="px-2.5 py-1.5 text-[10px] text-foreground whitespace-nowrap">
                        sarah@email.com
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="w-full rounded-xl py-2 text-[10px] font-semibold bg-primary text-primary-foreground text-center"
                    >
                      Submit Request →
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-3"
                  >
                    <div className="h-10 w-10 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <p className="text-xs font-bold text-foreground">Quote Requested!</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      We'll get back to you shortly
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CRM overlay — lead appears */}
          <AnimatePresence>
            {stage === "crm" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center px-5"
              >
                {/* Notification badge */}
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-5"
                >
                  <Bell className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs font-semibold text-success">New Lead!</span>
                </motion.div>

                {/* CRM card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-full rounded-2xl border border-border bg-card p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Sarah Williams</p>
                      <p className="text-[10px] text-muted-foreground">sarah@email.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Quote Request
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                      New Lead
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Added to your CRM automatically
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-[10px] text-muted-foreground mt-4 text-center"
                >
                  Zero effort. Every lead captured.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2 bg-card">
          <div className="w-28 h-1 bg-foreground/15 rounded-full" />
        </div>
      </div>
    </div>
  );
}
