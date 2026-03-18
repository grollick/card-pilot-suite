import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, CalendarCheck, DollarSign, Percent, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";

function AnimatedNumber({ value, prefix = "", suffix = "", duration = 800 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = ref.current ?? 0;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    ref.current = value;
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
      <Minus className="h-2.5 w-2.5" /> 0%
    </span>
  );
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-2 py-0.5 ${
      isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
    }`}>
      {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

export default function RevenueKPICards() {
  const { data, isLoading } = useBusinessPerformance();

  const kpis = [
    {
      label: "Leads",
      value: data?.leads ?? 0,
      icon: UserPlus,
      trend: data?.trends?.leads ?? 0,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      borderAccent: "hover:border-success/30",
    },
    {
      label: "Bookings",
      value: data?.bookings ?? 0,
      icon: CalendarCheck,
      trend: data?.trends?.bookings ?? 0,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      borderAccent: "hover:border-warning/30",
    },
    {
      label: "Est. Revenue",
      value: data?.estimatedRevenue ?? 0,
      icon: DollarSign,
      trend: data?.trends?.revenue ?? 0,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      borderAccent: "hover:border-primary/30",
      prefix: "$",
    },
    {
      label: "Conversion",
      value: data?.conversionRate ?? 0,
      icon: Percent,
      trend: 0,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      borderAccent: "hover:border-accent/30",
      suffix: "%",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
          className={`group relative rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md ${kpi.borderAccent}`}
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-transparent to-muted/20 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              {!isLoading && <TrendBadge value={kpi.trend} />}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ) : (
              <>
                <p className="text-3xl lg:text-4xl font-bold tracking-tight tabular-nums text-foreground leading-none">
                  <AnimatedNumber value={kpi.value} prefix={kpi.prefix ?? ""} suffix={kpi.suffix ?? ""} />
                </p>
                <p className="text-[11px] text-muted-foreground mt-2 font-medium uppercase tracking-widest">
                  {kpi.label}
                </p>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
