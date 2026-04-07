import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradePrompt from "@/components/UpgradePrompt";
import { formatDistanceToNow, format } from "date-fns";
import {
  Eye, Smartphone, Monitor, Tablet, MapPin, Globe,
  Clock, ArrowUpRight, Loader2, ChevronDown, RotateCw, UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardViewers, useViewerStats } from "@/hooks/useCardViewers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GuzzlLogo from "@/components/brand/GuzzlLogo";

const deviceIcons: Record<string, typeof Monitor> = {
  Mobile: Smartphone,
  Tablet: Tablet,
  Desktop: Monitor,
};

const anim = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function CardViewersPage() {
  const navigate = useNavigate();
  const { planKey } = usePlanLimits();
  const isGated = planKey === "starter";
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [days, setDays] = useState(30);
  const { data: viewers = [], isLoading } = useCardViewers(days);
  const stats = useViewerStats(days);

  const kpis = [
    { label: "Total Views", value: stats.totalViews, icon: Eye, color: "text-primary bg-primary/10", path: "/app/analytics" },
    { label: "Returning Visitors", value: stats.returningCount, icon: RotateCw, color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10", path: "/app/viewers" },
    { label: "Unique Visitors", value: stats.uniqueVisitors, icon: UserCheck, color: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10", path: "/app/analytics" },
    { label: "Unique Locations", value: stats.uniqueLocations, icon: MapPin, color: "text-accent-foreground bg-accent", path: "/app/analytics" },
  ];

  if (isGated) {
    return (
      <>
        <UpgradePrompt open={showUpgrade} onOpenChange={setShowUpgrade} feature="Who Viewed Your Card" currentPlan={planKey} />
        <div className="space-y-8 max-w-6xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              <GuzzlLogo to={null} size="lg" suffix="Card Viewers" />
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time visitor tracking with device & location data.
            </p>
          </div>
          <div className="relative rounded-xl border border-border bg-card p-12 text-center">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Unlock Visitor Insights</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                See who's viewing your card, where they're from, what device they use, and spot returning visitors. Available on Pro and above.
              </p>
              <Button onClick={() => setShowUpgrade(true)} className="shadow-glow mt-2">
                <ArrowUpRight className="h-4 w-4 mr-1.5" /> Upgrade to Pro
              </Button>
            </div>
            {/* Blurred placeholder content */}
            <div className="filter blur-sm pointer-events-none select-none">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="rounded-xl border border-border bg-muted/30 p-5 h-24" />
                ))}
              </div>
              <div className="rounded-xl border border-border bg-muted/30 h-64" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Who Viewed Your Card
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time visitor tracking with device & location data.
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...anim} transition={{ delay: i * 0.05 }}
            onClick={() => navigate(kpi.path)}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Viewer Feed — 2 cols */}
        <motion.div {...anim} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Visitors</h2>
            <Badge variant="secondary" className="text-[10px]">{viewers.length} views</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No card views yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Share your card to start tracking visitors.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {viewers.map((viewer) => {
                const DeviceIcon = deviceIcons[viewer.device_type] || Monitor;
                const location = [viewer.city, viewer.country]
                  .filter(v => v && v !== "Unknown")
                  .join(", ") || "Unknown location";
                const source = viewer.utm_source || (viewer.referrer ? getDomain(viewer.referrer) : "Direct");

                return (
                  <div key={viewer.id}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors ${viewer.isReturning ? "ring-1 ring-inset ring-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5" : ""}`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${viewer.isReturning ? "bg-[hsl(var(--warning))]/15" : "bg-primary/10"}`}>
                      <DeviceIcon className={`h-4.5 w-4.5 ${viewer.isReturning ? "text-[hsl(var(--warning))]" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {viewer.device_type} · {viewer.os}
                        </p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {viewer.browser}
                        </Badge>
                        {viewer.isReturning && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 hover:bg-[hsl(var(--warning))]/20">
                            <RotateCw className="h-2.5 w-2.5 mr-0.5" />
                            Returning · {viewer.visitCount}x
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {location}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {source}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground block">
                        {formatDistanceToNow(new Date(viewer.created_at), { addSuffix: true })}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {format(new Date(viewer.created_at), "h:mm a")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right column: Insights */}
        <div className="space-y-6">
          {/* Devices */}
          <motion.div {...anim} transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold mb-4">Devices</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : stats.topDevices.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topDevices.map(([device, count]) => {
                  const pct = stats.totalViews > 0 ? Math.round((count / stats.totalViews) * 100) : 0;
                  const Icon = deviceIcons[device] || Monitor;
                  return (
                    <div key={device}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {device}
                        </span>
                        <span className="text-xs text-muted-foreground">{pct}% ({count})</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Top Locations */}
          <motion.div {...anim} transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold mb-4">Top Locations</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : stats.topLocations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No location data yet</p>
            ) : (
              <div className="space-y-2">
                {stats.topLocations.map(([loc, count]) => (
                  <div key={loc} className="flex items-center justify-between py-1.5">
                    <span className="text-sm flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {loc}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Top Sources */}
          <motion.div {...anim} transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold mb-4">Traffic Sources</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : stats.topSources.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No source data yet</p>
            ) : (
              <div className="space-y-2">
                {stats.topSources.map(([src, count]) => (
                  <div key={src} className="flex items-center justify-between py-1.5">
                    <span className="text-sm flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" /> {src}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url.slice(0, 30); }
}
