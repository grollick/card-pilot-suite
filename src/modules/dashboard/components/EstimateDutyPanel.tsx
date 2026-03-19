import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio, Clock, MapPin, Target, Zap, Shield, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3,
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
import { usePlanLimits } from "@/hooks/usePlanLimits";

export default function EstimateDutyPanel() {
  const navigate = useNavigate();
  const { status, isOnDuty, isLoading, analytics, toggleDuty } = useEstimateDuty();
  const { planKey } = usePlanLimits();
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Local form state
  const [availableUntil, setAvailableUntil] = useState("");
  const [maxLeads, setMaxLeads] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [autoOffHours, setAutoOffHours] = useState("");
  const [autoOffOutside, setAutoOffOutside] = useState(false);

  const isFreePlan = planKey === "starter";
  const isProPlus = planKey === "pro" || planKey === "agency";

  const handleToggle = (on: boolean) => {
    toggleDuty.mutate({
      is_on_duty: on,
      available_until: availableUntil || null,
      max_leads: maxLeads ? parseInt(maxLeads) : null,
      service_radius_km: radiusKm ? parseInt(radiusKm) : null,
      auto_off_after_hours: autoOffHours ? parseInt(autoOffHours) : null,
      auto_off_outside_hours: autoOffOutside,
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
      {/* Accent bar */}
      {isOnDuty && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-success via-emerald-400 to-success rounded-t-xl" />
      )}

      <div className="dash-card-header pt-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ring-1 ${
            isOnDuty
              ? "bg-success/15 ring-success/20"
              : "bg-muted ring-border"
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
              onCheckedChange={handleToggle}
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
            {/* Lead progress */}
            {leadsMax > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xs text-muted-foreground">Leads received</span>
                  <span className="text-2xs font-semibold tabular-nums">{leadsUsed} / {leadsMax}</span>
                </div>
                <Progress value={leadsProgress} className="h-1.5 [&>div]:bg-success" />
              </div>
            )}

            {/* Status badges */}
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
            </div>
          </div>
        )}

        {/* Settings expandable */}
        {!isFreePlan && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs gap-1.5 h-7 text-muted-foreground"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showSettings ? "Hide settings" : "Duty settings"}
            </Button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Available until</Label>
                        <Input
                          type="time"
                          value={availableUntil}
                          onChange={(e) => setAvailableUntil(e.target.value)}
                          className="h-8 text-xs"
                          placeholder="HH:MM"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Max leads</Label>
                        <Input
                          type="number"
                          value={maxLeads}
                          onChange={(e) => setMaxLeads(e.target.value)}
                          className="h-8 text-xs"
                          placeholder="e.g. 5"
                          min={1}
                        />
                      </div>
                    </div>

                    {isProPlus && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Service radius (km)</Label>
                          <Input
                            type="number"
                            value={radiusKm}
                            onChange={(e) => setRadiusKm(e.target.value)}
                            className="h-8 text-xs"
                            placeholder="e.g. 25"
                            min={1}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Auto-off after (hrs)</Label>
                          <Input
                            type="number"
                            value={autoOffHours}
                            onChange={(e) => setAutoOffHours(e.target.value)}
                            className="h-8 text-xs"
                            placeholder="e.g. 8"
                            min={1}
                          />
                        </div>
                      </div>
                    )}

                    {isProPlus && (
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Auto-off outside business hours</Label>
                        <Switch
                          checked={autoOffOutside}
                          onCheckedChange={setAutoOffOutside}
                          className="scale-90"
                        />
                      </div>
                    )}

                    <Button
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => handleToggle(true)}
                      disabled={toggleDuty.isPending}
                    >
                      {isOnDuty ? "Update settings" : "Go On Duty"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Analytics expandable */}
        {!isFreePlan && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs gap-1.5 h-7 text-muted-foreground"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 className="h-3 w-3" />
              {showAnalytics ? "Hide analytics" : "View performance"}
            </Button>

            <AnimatePresence>
              {showAnalytics && analytics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Leads received", value: analytics.leadsReceived, icon: Target },
                        { label: "Response rate", value: `${analytics.responseRate}%`, icon: TrendingUp },
                        { label: "Avg response", value: analytics.avgResponseMin ? `${analytics.avgResponseMin}m` : "—", icon: Clock },
                        { label: "Missed", value: analytics.missedLeads, icon: AlertTriangle },
                      ].map((m) => (
                        <div key={m.label} className="p-2.5 rounded-lg bg-muted/40 text-center">
                          <m.icon className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                          <p className="text-sm font-bold tabular-nums">{m.value}</p>
                          <p className="text-[10px] text-muted-foreground">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    {analytics.bookingsFromDuty > 0 && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/10">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="text-xs text-success font-medium">
                          {analytics.bookingsFromDuty} booking{analytics.bookingsFromDuty > 1 ? "s" : ""} from On Duty leads
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}
