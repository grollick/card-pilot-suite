import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio, Clock, MapPin, Target, Zap, Shield, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useEstimateDuty } from "@/hooks/useEstimateDuty";
import { useEstimateMatches } from "@/hooks/useEstimateRequests";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import DutySettingsPanel from "./duty/DutySettingsPanel";
import DutyAnalyticsPanel from "./duty/DutyAnalyticsPanel";
import DutyMatchesList from "./duty/DutyMatchesList";

export default function EstimateDutyPanel() {
  const navigate = useNavigate();
  const { status, isOnDuty, isLoading, analytics, toggleDuty } = useEstimateDuty();
  const { pendingCount } = useEstimateMatches();
  const { planKey } = usePlanLimits();
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  const isFreePlan = planKey === "starter";
  const isProPlus = planKey === "pro" || planKey === "agency";

  const handleToggle = (on: boolean, settings?: any) => {
    toggleDuty.mutate({
      is_on_duty: on,
      ...settings,
    });
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  const leadsUsed = status?.leads_received ?? 0;
  const leadsMax = status?.max_leads ?? 0;
  const leadsProgress = leadsMax > 0 ? Math.min((leadsUsed / leadsMax) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card relative overflow-hidden"
    >
      {isOnDuty && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-success to-success/60 rounded-t-xl" />
      )}

      <div className="dash-card-header pt-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ring-1 ${
            isOnDuty ? "bg-success/15 ring-success/20" : "bg-muted ring-border"
          }`}>
            <Radio className={`h-4.5 w-4.5 ${isOnDuty ? "text-success" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              On Duty for Estimates
              {isOnDuty && (
                <Badge className="text-[10px] h-4 px-1.5 font-medium bg-success/15 text-success border-success/20">
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
          {!isFreePlan && (
            <Switch
              checked={isOnDuty}
              onCheckedChange={(on) => handleToggle(on)}
              disabled={toggleDuty.isPending}
              className={isOnDuty ? "data-[state=checked]:bg-success" : ""}
            />
          )}
        </div>
      </div>

      <div className="dash-card-body space-y-3">
        {/* Free plan upgrade prompt */}
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

        {/* Active duty status */}
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

        {/* Expandable sections */}
        {!isFreePlan && (
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs gap-1.5 h-7 text-muted-foreground"
              onClick={() => { setShowSettings(!showSettings); setShowAnalytics(false); setShowMatches(false); }}
            >
              {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs gap-1.5 h-7 text-muted-foreground"
              onClick={() => { setShowAnalytics(!showAnalytics); setShowSettings(false); setShowMatches(false); }}
            >
              <BarChart3 className="h-3 w-3" />
              Analytics
            </Button>
            {pendingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs gap-1.5 h-7 text-muted-foreground"
                onClick={() => { setShowMatches(!showMatches); setShowSettings(false); setShowAnalytics(false); }}
              >
                <Inbox className="h-3 w-3" />
                Requests ({pendingCount})
              </Button>
            )}
          </div>
        )}

        <AnimatePresence>
          {showSettings && !isFreePlan && (
            <DutySettingsPanel
              isOnDuty={isOnDuty}
              isProPlus={isProPlus}
              isPending={toggleDuty.isPending}
              onSave={(settings) => handleToggle(true, settings)}
            />
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
  );
}
