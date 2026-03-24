import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { KeyboardEvent } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  sparklineData?: number[];
  isLoading?: boolean;
  onClick?: () => void;
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
      <motion.path
        d={areaPath}
        fill="url(#sparkFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

function KPICardSkeleton() {
  return (
    <div className="dash-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-20 skeleton-shimmer" />
          <Skeleton className="h-7 w-16 skeleton-shimmer" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg skeleton-shimmer" />
      </div>
      <Skeleton className="h-3 w-24 mt-3 skeleton-shimmer" />
    </div>
  );
}

export default function KPICard({ title, value, change, changeType = "neutral", icon: Icon, sparklineData, isLoading, onClick }: KPICardProps) {
  if (isLoading) return <KPICardSkeleton />;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`dash-card p-5 group ${onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-overline">{title}</p>
          <motion.p
            className="text-2xl font-bold tracking-tight tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {value}
          </motion.p>
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center transition-colors duration-200 group-hover:bg-primary/15">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2">
          <Sparkline data={sparklineData} />
        </div>
      )}
      {change && (
        <motion.p
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className={`text-xs mt-2 font-medium ${
            changeType === "positive" ? "text-success" :
            changeType === "negative" ? "text-destructive" :
            "text-muted-foreground"
          }`}
        >
          {change}
        </motion.p>
      )}
    </motion.div>
  );
}
