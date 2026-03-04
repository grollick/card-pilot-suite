import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export default function KPICard({ title, value, change, changeType = "neutral", icon: Icon }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {change && (
        <p className={`text-xs mt-3 ${
          changeType === "positive" ? "text-[hsl(var(--success))]" :
          changeType === "negative" ? "text-destructive" :
          "text-muted-foreground"
        }`}>
          {change}
        </p>
      )}
    </motion.div>
  );
}
