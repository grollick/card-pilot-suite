import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  sparklineData?: number[];
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KPICard({ title, value, change, changeType = "neutral", icon: Icon, sparklineData }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-card p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2">
          <Sparkline data={sparklineData} />
        </div>
      )}
      {change && (
        <p className={`text-xs mt-2 font-medium ${
          changeType === "positive" ? "text-success" :
          changeType === "negative" ? "text-destructive" :
          "text-muted-foreground"
        }`}>
          {change}
        </p>
      )}
    </motion.div>
  );
}
