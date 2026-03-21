import { motion } from "framer-motion";
import { ArrowRight, Bot, MessageSquare, Lightbulb, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

const AI_STYLES = [
  { id: "copilot", label: "Quick Tips", icon: Bot, description: "Short suggestions as you go" },
  { id: "chatgpt", label: "Full Chat", icon: MessageSquare, description: "Ask anything, get detailed help" },
  { id: "coach", label: "Daily Coach", icon: Lightbulb, description: "Action plans and growth advice" },
  { id: "minimal", label: "Just the Basics", icon: Zap, description: "Brief answers, no extras" },
];

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepAIPersonality({ selected, onSelect, onNext, onBack }: Props) {
  return (
    <OnboardingStepWrapper stepKey="ai-personality">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          How should AI help you?
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose your preferred AI style — you can change this anytime in Settings.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {AI_STYLES.map((style, i) => {
          const Icon = style.icon;
          const isSelected = selected === style.id;
          return (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onSelect(style.id)}
              className={`text-left p-3.5 rounded-xl transition-all border ${
                isSelected
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-5 w-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm text-foreground">{style.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{style.description}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} disabled={!selected} className="flex-1">
          Continue <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </OnboardingStepWrapper>
  );
}
