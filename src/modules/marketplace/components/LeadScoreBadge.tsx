import { cn } from "@/lib/utils";
import { Flame, TrendingUp, Minus } from "lucide-react";

interface Props {
  score: number;
  label: string;
  size?: "sm" | "md";
  showScore?: boolean;
}

const labelConfig = {
  "High Intent": {
    icon: Flame,
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    ring: "ring-success/20",
  },
  "Medium Intent": {
    icon: TrendingUp,
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    ring: "ring-warning/20",
  },
  "Low Intent": {
    icon: Minus,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    ring: "ring-border",
  },
};

export default function LeadScoreBadge({ score, label, size = "sm", showScore = true }: Props) {
  const config = labelConfig[label as keyof typeof labelConfig] || labelConfig["Low Intent"];
  const Icon = config.icon;

  if (size === "sm") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
        config.bg, config.text, config.border,
      )}>
        <Icon className="h-2.5 w-2.5" />
        {showScore && <span>{score}</span>}
        {label}
      </span>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl border",
      config.bg, config.border,
    )}>
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", config.bg)}>
        <Icon className={cn("h-4 w-4", config.text)} />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-bold", config.text)}>{score}</span>
          <span className={cn("text-xs font-medium", config.text)}>{label}</span>
        </div>
        {showScore && (
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-3 rounded-full",
                  i < Math.round(score / 10) ? config.text.replace("text-", "bg-") : "bg-muted",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
