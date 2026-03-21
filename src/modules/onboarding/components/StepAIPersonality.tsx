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

      <div className="space-y-2">
        {AI_STYLES.map((style, i) => {
          const Icon = style.icon;
          const isSelected = selected === style.id;
          return (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onSelect(style.id)}
              className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                isSelected
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-border/60 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{style.label}</span>
                    {isSelected && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1 italic">{style.example}</p>
                </div>
              </div>
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
