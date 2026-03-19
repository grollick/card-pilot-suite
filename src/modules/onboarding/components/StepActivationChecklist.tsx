import { CheckCircle2, Circle, LayoutDashboard, PartyPopper, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface CheckItem {
  label: string;
  done: boolean;
}

interface Props {
  items: CheckItem[];
  onGoToDashboard: () => void;
}

export default function StepActivationChecklist({ items, onGoToDashboard }: Props) {
  const doneCount = items.filter(i => i.done).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <OnboardingStepWrapper stepKey="checklist">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          {doneCount >= 3 ? (
            <PartyPopper className="h-8 w-8 text-primary-foreground" />
          ) : (
            <Rocket className="h-8 w-8 text-primary-foreground" />
          )}
        </motion.div>

        <div>
          <h2 className="text-xl font-bold">You're on your way! 🚀</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {doneCount}/{items.length} steps completed — keep going to start earning
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-primary rounded-full"
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
              item.done
                ? "border-success/20 bg-success/5"
                : "border-border"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
            )}
            <span className={`text-sm ${item.done ? "text-success font-medium line-through" : "text-foreground"}`}>
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>

      <Button onClick={onGoToDashboard} className="w-full gap-2 h-11">
        <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
      </Button>
    </OnboardingStepWrapper>
  );
}
