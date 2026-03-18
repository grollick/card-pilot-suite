import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, CalendarCheck, DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";

function AnimatedNumber({ value, prefix = "", duration = 800 }: { value: number; prefix?: string; duration?: number }) {
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

  return <>{prefix}{display.toLocaleString()}</>;
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
      <Minus className="h-3 w-3" /> 0%
    </span>
  );
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
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
      color: "text-success bg-success/10 border-success/20",
      prefix: "",
    },
    {
      label: "Bookings",
      value: data?.bookings ?? 0,
      icon: CalendarCheck,
      trend: data?.trends?.bookings ?? 0,
      color: "text-warning bg-warning/10 border-warning/20",
      prefix: "",
    },
    {
      label: "Est. Revenue",
      value: data?.estimatedRevenue ?? 0,
      icon: DollarSign,
      trend: data?.trends?.revenue ?? 0,
      color: "text-primary bg-primary/10 border-primary/20",
      prefix: "$",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06, duration: 0.4 }}
          className={`rounded-2xl border p-5 bg-card transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            {!isLoading && <TrendBadge value={kpi.trend} />}
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <>
              <p className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                <AnimatedNumber value={kpi.value} prefix={kpi.prefix} />
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">
                {kpi.label} this month
              </p>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
