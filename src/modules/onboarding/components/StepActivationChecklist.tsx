import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, LayoutDashboard, PartyPopper, Rocket, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface CheckItem {
  label: string;
  done: boolean;
  route?: string;
}

interface Props {
  items: CheckItem[];
  headline?: string;
  onGoToDashboard: () => void;
}

export default function StepActivationChecklist({ items, headline, onGoToDashboard }: Props) {
  const navigate = useNavigate();
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
          <h2 className="text-xl font-bold">{headline || "You're on your way!"} 🚀</h2>
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

      {/* Checklist items — clickable to navigate */}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => item.route && !item.done && navigate(item.route)}
            disabled={item.done || !item.route}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all w-full text-left ${
              item.done
                ? "border-success/20 bg-success/5"
                : item.route
                ? "border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                : "border-border"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
            )}
            <span className={`text-sm flex-1 ${item.done ? "text-success font-medium line-through" : "text-foreground"}`}>
              {item.label}
            </span>
            {!item.done && item.route && (
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </motion.button>
        ))}
      </div>

      <Button onClick={onGoToDashboard} className="w-full gap-2 h-11">
        <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
      </Button>
    </OnboardingStepWrapper>
  );
}
