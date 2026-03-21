import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio, Clock, MapPin, Target, Zap, Shield, ChevronDown, ChevronUp,
  CheckCircle2, BarChart3, Inbox, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useEstimateDuty } from "@/hooks/useEstimateDuty";
import { useEstimateMatches } from "@/hooks/useEstimateRequests";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import DutySettingsPanel from "./duty/DutySettingsPanel";
import DutyAnalyticsPanel from "./duty/DutyAnalyticsPanel";
import DutyMatchesList from "./duty/DutyMatchesList";
import DutyGoLiveOverlay from "./duty/DutyGoLiveOverlay";

/* ───────── CSS keyframes injected once ───────── */
const glowKeyframes = `
@keyframes duty-pulse {
  0%, 100% { opacity: 0.15; transform: scale(0.97); }
  50%      { opacity: 1;    transform: scale(1.03); }
}
@keyframes duty-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 0 hsl(var(--success) / 0.4); }
  50%      { box-shadow: 0 0 0 6px hsl(var(--success) / 0); }
}
`;

export default function EstimateDutyPanel() {
  const navigate = useNavigate();
  const { status, isOnDuty, isLoading, analytics, toggleDuty } = useEstimateDuty();
  const { pendingCount } = useEstimateMatches();
  const { planKey } = usePlanLimits();
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [showGoLive, setShowGoLive] = useState(false);

  const isFreePlan = planKey === "starter";
  const isProPlus = planKey === "pro" || planKey === "agency";

  const handleToggle = (on: boolean, settings?: any) => {
    toggleDuty.mutate(
      { is_on_duty: on, ...settings },
      { onSuccess: (data) => { if (data?.is_on_duty) setShowGoLive(true); } }
    );
  };

  const handleGoLiveComplete = useCallback(() => setShowGoLive(false), []);

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  const leadsUsed = status?.leads_received ?? 0;
  const leadsMax = status?.max_leads ?? 0;
  const leadsProgress = leadsMax > 0 ? Math.min((leadsUsed / leadsMax) * 100, 100) : 0;

  return (
    <>
      {/* Inject keyframes — only renders a tiny <style> tag */}
      <style>{glowKeyframes}</style>

      <div className="relative">
        {/* ── Outer ambient glow (CSS animation, GPU-friendly) ── */}
        {isOnDuty && (
          <div
            className="absolute -inset-6 rounded-3xl pointer-events-none z-0"
            style={{
              background: "radial-gradient(ellipse at center, hsl(var(--success) / 0.45), transparent 70%)",
              filter: "blur(45px)",
              animation: "duty-pulse 2s ease-in-out infinite",
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className={`dash-card relative overflow-hidden transition-all duration-500 z-10 ${
            isOnDuty ? "ring-2 ring-success/40 -translate-y-0.5" : ""
          }`}
          style={isOnDuty ? {
            boxShadow: `
              0 0 12px hsl(var(--success) / 0.35),
              0 0 40px hsl(var(--success) / 0.2),
              0 0 80px hsl(var(--success) / 0.1)
            `,
          } : undefined}
        >
          {/* ── Inner effects (inside card) ── */}
          {isOnDuty && (
            <>
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-success/80 via-success to-success/40 rounded-t-xl" />
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 30px hsl(var(--success) / 0.12)",
                  animation: "duty-pulse 2.5s ease-in-out infinite",
                }}
              />
            </>
          )}

          {/* ── Header ── */}
          <div className="dash-card-header pt-3">
            <div className="flex items-center gap-2.5">
              <div className={`relative h-9 w-9 rounded-xl flex items-center justify-center ring-1 ${
                isOnDuty ? "bg-success/15 ring-success/30" : "bg-muted ring-border"
              }`}>
                <Radio className={`h-4.5 w-4.5 ${isOnDuty ? "text-success" : "text-muted-foreground"}`} />
                {/* Pulsing ring on icon */}
                {isOnDuty && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ animation: "duty-ring-pulse 2s ease-out infinite" }}
                  />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm flex items-center gap-1.5">
                  On Duty for Estimates
                  {isOnDuty && (
                    <Badge className="text-[10px] h-4 px-1.5 font-medium bg-success/15 text-success border-success/20 gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                      </span>
                      Live
                    </Badge>
                  )}
                  {pendingCount > 0 && (
                    <Badge className="text-[10px] h-4 px-1.5 font-medium bg-primary/15 text-primary border-primary/20">
                      {pendingCount} new
                    </Badge>
                  )}
                </h2>
                <p className="text-2xs text-muted-foreground">
                  {isOnDuty
                    ? `Receiving estimate leads${leadsMax > 0 ? ` (${leadsUsed}/${leadsMax})` : ""}`
                    : "Toggle on to receive estimate requests"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-72 text-xs space-y-2">
                  <p className="font-semibold text-sm">How On Duty Works</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>Toggle on to mark yourself as <span className="text-foreground font-medium">available</span> for real-time estimate requests from the marketplace.</li>
                    <li>Set a <span className="text-foreground font-medium">max leads cap</span>, <span className="text-foreground font-medium">service radius</span>, and <span className="text-foreground font-medium">availability window</span> in Settings.</li>
                    <li>Incoming requests appear in the <span className="text-foreground font-medium">Requests</span> tab — accept or decline before the deadline.</li>
                    <li>Your <span className="text-foreground font-medium">response speed</span> boosts your ranking in marketplace results.</li>
                  </ul>
                  <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                    Pro plan required. Pro+ unlocks radius filtering and auto-off timers.
                  </p>
                </PopoverContent>
              </Popover>

              {!isFreePlan && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch
                        checked={isOnDuty}
                        onCheckedChange={(on) => handleToggle(on)}
                        disabled={toggleDuty.isPending}
                        className={isOnDuty ? "data-[state=checked]:bg-success" : ""}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {isOnDuty
                      ? "You are visible to customers right now"
                      : "Toggle to go on duty and receive leads"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="dash-card-body space-y-3">
            {isFreePlan && (
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Upgrade to go On Duty</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Pro plan and above can receive real-time estimate requests from the marketplace.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs gap-1 border-warning/30 text-warning hover:bg-warning/10"
                    onClick={() => navigate("/app/settings?tab=billing")}
                  >
                    <Zap className="h-3 w-3" /> Upgrade
                  </Button>
                </div>
              </div>
            )}

            {isOnDuty && !isFreePlan && (
              <div className="space-y-2">
                {leadsMax > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xs text-muted-foreground">Leads received</span>
                      <span className="text-2xs font-semibold tabular-nums">{leadsUsed} / {leadsMax}</span>
                    </div>
                    <Progress value={leadsProgress} className="h-1.5 [&>div]:bg-success" />
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {status?.available_until && (
                    <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                      <Clock className="h-2.5 w-2.5" />
                      Until {new Date(status.available_until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Badge>
                  )}
                  {status?.service_radius_km && (
                    <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                      <MapPin className="h-2.5 w-2.5" />
                      {status.service_radius_km} km radius
                    </Badge>
                  )}
                  {(status?.service_types?.length ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                      <Target className="h-2.5 w-2.5" />
                      {status!.service_types.length} services
                    </Badge>
                  )}
                  {(status?.accepted_leads_count ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1 font-normal bg-success/5 border-success/20 text-success">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {status!.accepted_leads_count} accepted
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {!isFreePlan && (
              <div className="flex flex-wrap gap-1.5">
                <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1.5 h-7 text-muted-foreground"
                  onClick={() => { setShowSettings(!showSettings); setShowAnalytics(false); setShowMatches(false); }}>
                  {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Settings
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1.5 h-7 text-muted-foreground"
                  onClick={() => { setShowAnalytics(!showAnalytics); setShowSettings(false); setShowMatches(false); }}>
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </Button>
                {pendingCount > 0 && (
                  <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1.5 h-7 text-muted-foreground"
                    onClick={() => { setShowMatches(!showMatches); setShowSettings(false); setShowAnalytics(false); }}>
                    <Inbox className="h-3 w-3" />
                    Requests ({pendingCount})
                  </Button>
                )}
              </div>
            )}

            <AnimatePresence>
              {showSettings && !isFreePlan && (
                <DutySettingsPanel isOnDuty={isOnDuty} isProPlus={isProPlus} isPending={toggleDuty.isPending}
                  onSave={(settings) => handleToggle(true, settings)} />
              )}
              {showAnalytics && analytics && !isFreePlan && (
                <DutyAnalyticsPanel analytics={analytics} />
              )}
              {showMatches && !isFreePlan && (
                <DutyMatchesList />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
