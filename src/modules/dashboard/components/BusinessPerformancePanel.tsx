import { Eye, UserPlus, CalendarCheck, DollarSign, TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* Animated number counter */
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    ref.current = value;
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString()}</>;
}

/* Mini sparkline SVG */
function MiniSparkline({ trend }: { trend: number }) {
  const positive = trend >= 0;
  // Generate a simple upward or downward path
  const points = positive
    ? "0,16 4,14 8,12 12,10 16,11 20,8 24,6 28,4 32,2"
    : "0,2 4,4 8,6 12,8 16,7 20,10 24,12 28,14 32,16";
  
  return (
    <svg width="32" height="18" viewBox="0 0 32 18" fill="none" className="shrink-0">
      <polyline
        points={points}
        stroke={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

export default function BusinessPerformancePanel() {
  const { data, isLoading } = useBusinessPerformance();
  const navigate = useNavigate();

  const metrics = [
    { label: "Card Views", value: data?.views ?? 0, icon: Eye, color: "text-primary bg-primary/10", trend: data?.trends?.views, prefix: "" },
    { label: "Leads Captured", value: data?.leads ?? 0, icon: UserPlus, color: "text-success bg-success/10", trend: data?.trends?.leads, prefix: "" },
    { label: "Bookings", value: data?.bookings ?? 0, icon: CalendarCheck, color: "text-warning bg-warning/10", trend: data?.trends?.bookings, prefix: "" },
    { label: "Est. Revenue", value: data?.estimatedRevenue ?? 0, icon: DollarSign, color: "text-primary bg-primary/10", trend: data?.trends?.revenue, prefix: "$" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div>
          <h2 className="font-semibold text-sm">This Month's Performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue generated through guzzl.pro</p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && data && (
            <div className="stat-pill text-primary bg-primary/8">
              <TrendingUp className="h-3 w-3" />
              {data.conversionRate}% conversion
            </div>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/analytics")}>
            Details <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="dash-card-body">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="rounded-xl bg-muted/40 p-3.5 transition-all hover:bg-muted/60 hover:shadow-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${m.color} transition-transform group-hover:scale-105`}>
                    <m.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-2xs text-muted-foreground font-medium uppercase tracking-wider">{m.label}</span>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xl font-bold tracking-tight tabular-nums">
                    <AnimatedNumber value={m.value} prefix={m.prefix} />
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    {m.trend !== undefined && <TrendBadge value={m.trend} />}
                    {m.trend !== undefined && <MiniSparkline trend={m.trend} />}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
