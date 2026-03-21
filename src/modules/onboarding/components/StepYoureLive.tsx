import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Radio, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  company: string;
  onNext: () => void;
}

export default function StepYoureLive({ company, onNext }: Props) {
  return (
    <motion.div
      key="youre-live"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="text-center space-y-6 py-4"
    >
      {/* Celebratory icon with glow */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
        className="relative mx-auto"
      >
        {/* Glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.3, 0], scale: [0.5, 1.8, 2.2] }}
          transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
          className="absolute inset-0 mx-auto h-20 w-20 rounded-full bg-primary/20"
        />
        <div className="relative h-20 w-20 mx-auto rounded-full flex items-center justify-center bg-primary/10">
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
          >
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </motion.div>
        </div>
      </motion.div>

      {/* Confetti-like sparkles */}
      <div className="relative h-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -30 - Math.random() * 20],
              x: [(i - 3) * 15, (i - 3) * 25],
            }}
            transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
            className="absolute left-1/2 -top-8"
          >
            <Sparkles className="h-3 w-3 text-primary/60" />
          </motion.div>
        ))}
      </div>

      <div className="space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-foreground"
        >
          Your card is live! 🎉
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-muted-foreground max-w-xs mx-auto"
        >
          {company
            ? `${company} is now visible to customers — you can start receiving leads.`
            : "You are now visible to customers in your area."}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-3"
      >
        {/* Quick stats */}
        <div className="flex justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">Discoverable</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10"
          >
            <Radio className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">Ready for leads</span>
          </motion.div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What's next</p>
          <ul className="space-y-1.5 text-sm text-foreground text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span> Your card is published and shareable
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span> You can receive estimate requests
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span> You can edit everything anytime
            </li>
          </ul>
        </div>

        <Button onClick={onNext} size="lg" className="w-full h-12 text-base font-semibold gap-2">
          Turn On Duty <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="text-[11px] text-muted-foreground">
          Go on duty to start receiving leads immediately
        </p>
      </motion.div>
    </motion.div>
  );
}
