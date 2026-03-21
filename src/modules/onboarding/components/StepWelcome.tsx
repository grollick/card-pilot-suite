import { motion } from "framer-motion";
import { Rocket, ArrowRight, Zap, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";
import SuccessStoryBanner from "@/components/SuccessStoryBanner";

interface Props {
  onStart: () => void;
  onInstant: () => void;
}

export default function StepWelcome({ onStart, onInstant }: Props) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Rocket className="h-10 w-10 text-primary-foreground" />
      </motion.div>

      <div className="space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-foreground"
        >
          Get More Local Jobs — Starting Today
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-muted-foreground max-w-xs mx-auto"
        >
          Create your business card, get discovered, and start receiving leads in minutes.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-3 text-left px-2"
      >
        {[
          { icon: Zap, text: "Live in under 2 minutes" },
          { icon: Users, text: "Get discovered by customers" },
          { icon: TrendingUp, text: "Start receiving leads" },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-xs text-center text-muted-foreground font-medium">{text}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-3"
      >
        <Button onClick={onStart} size="lg" className="w-full h-12 text-base font-semibold gap-2">
          Start Now — It's Free <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="text-[11px] text-muted-foreground">
          We'll have you live and ready in under 2 minutes
        </p>
      </motion.div>

      {/* Trust signals */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-1.5 pt-2"
      >
        <p className="text-[11px] text-muted-foreground/70">
          Local professionals are already getting leads
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          You can edit everything anytime · No credit card required
        </p>
      </motion.div>
    </motion.div>
  );
}
