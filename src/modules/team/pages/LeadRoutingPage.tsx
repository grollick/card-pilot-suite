import { useState, useEffect } from "react";
import {
  Route, Users, Shuffle, Clock, Hand, Shield, MapPin, Wrench,
  Calendar, Loader2, BarChart3, AlertTriangle, CheckCircle2, Timer,
  RefreshCw, Bell, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useLeadAssignmentSettings,
  useUpsertLeadAssignmentSettings,
  useLeadDistribution,
  useMissedLeadStats,
  type AssignmentMode,
  type RecoveryMode,
} from "@/hooks/useLeadAssignment";
import { useTeamMembers, ROLE_LABELS } from "@/hooks/useTeam";
import GuzzlLogo from "@/components/brand/GuzzlLogo";

const MODES: { value: AssignmentMode; label: string; icon: any; desc: string }[] = [
  { value: "round_robin", label: "Round Robin", icon: Shuffle, desc: "Distribute leads evenly across all staff in rotation" },
  { value: "availability", label: "Availability-Based", icon: Clock, desc: "Assign to staff who are currently available" },
  { value: "manual", label: "Manual", icon: Hand, desc: "Assign leads manually from the CRM" },
];

const RECOVERY_MODES: { value: RecoveryMode; label: string; icon: any; desc: string }[] = [
  { value: "reassign", label: "Auto-Reassign", icon: RefreshCw, desc: "Automatically reassign to the next available staff member" },
  { value: "notify_backup", label: "Notify Backup", icon: Bell, desc: "Send alert to backup staff without auto-reassigning" },
  { value: "open_to_all", label: "Open to All", icon: Globe, desc: "Make the lead available for any team member to claim" },
];

const TIMEOUT_OPTIONS = [
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
];

export default function LeadRoutingPage() {
  const isMobile = useIsMobile();
  const { data: settings, isLoading } = useLeadAssignmentSettings();
  const upsert = useUpsertLeadAssignmentSettings();
  const { data: teamMembers = [] } = useTeamMembers();
  const distribution = useLeadDistribution();
  const missedStats = useMissedLeadStats();

  const [mode, setMode] = useState<AssignmentMode>("manual");
  const [fallbackToOwner, setFallbackToOwner] = useState(true);
  const [matchByServices, setMatchByServices] = useState(false);
  const [matchByLocation, setMatchByLocation] = useState(false);
  const [filterByAvailability, setFilterByAvailability] = useState(false);
  const [recoveryEnabled, setRecoveryEnabled] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>("reassign");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setMode(settings.assignment_mode as AssignmentMode);
      setFallbackToOwner(settings.fallback_to_owner);
      setMatchByServices(settings.match_by_services);
      setMatchByLocation(settings.match_by_location);
      setFilterByAvailability(settings.filter_by_availability);
      setRecoveryEnabled(settings.recovery_enabled);
      setTimeoutMinutes(settings.timeout_minutes);
      setRecoveryMode(settings.recovery_mode as RecoveryMode);
    }
  }, [settings]);

  const handleSave = () => {
    upsert.mutate({
      assignment_mode: mode,
      fallback_to_owner: fallbackToOwner,
      match_by_services: matchByServices,
      match_by_location: matchByLocation,
      filter_by_availability: filterByAvailability,
      recovery_enabled: recoveryEnabled,
      timeout_minutes: timeoutMinutes,
      recovery_mode: recoveryMode,
    });
    setDirty(false);
  };

  const update = (fn: () => void) => { fn(); setDirty(true); };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" /> <GuzzlLogo to={null} size="lg" suffix="Lead Routing" />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure assignment, recovery, and distribution
          </p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || upsert.isPending}>
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="routing">
        <TabsList>
          <TabsTrigger value="routing" className="gap-1.5">
            <Shuffle className="h-3.5 w-3.5" /> Routing
          </TabsTrigger>
          <TabsTrigger value="recovery" className="gap-1.5">
            <Timer className="h-3.5 w-3.5" /> Recovery
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
        </TabsList>

        {/* ── Routing Tab ── */}
        <TabsContent value="routing" className="mt-4 space-y-6">
          {/* Assignment Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assignment Mode</CardTitle>
              <CardDescription>Choose how leads are distributed to team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const selected = mode === m.value;
                  return (
                    <motion.button
                      key={m.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => update(() => setMode(m.value))}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`rounded-lg p-1.5 ${selected ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className="font-medium text-sm">{m.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Matching & Filtering */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Matching & Filtering</CardTitle>
              <CardDescription>Refine how leads are matched to staff</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow icon={Wrench} label="Match by Services" desc="Assign to staff who offer the requested service" checked={matchByServices} onChange={(v) => update(() => setMatchByServices(v))} />
              <Separator />
              <SettingRow icon={MapPin} label="Match by Location" desc="Prefer staff nearest to the lead's location" checked={matchByLocation} onChange={(v) => update(() => setMatchByLocation(v))} />
              <Separator />
              <SettingRow icon={Calendar} label="Filter by Availability" desc="Only assign to staff within their working hours" checked={filterByAvailability} onChange={(v) => update(() => setFilterByAvailability(v))} />
            </CardContent>
          </Card>

          {/* Fallback */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fallback</CardTitle>
              <CardDescription>What happens when no staff match</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow icon={Shield} label="Assign to Owner" desc="If no staff are available, assign the lead to the business owner" checked={fallbackToOwner} onChange={(v) => update(() => setFallbackToOwner(v))} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Recovery Tab ── */}
        <TabsContent value="recovery" className="mt-4 space-y-6">
          {/* Enable Recovery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4" /> Missed Lead Recovery
              </CardTitle>
              <CardDescription>Automatically recover leads when staff don't respond in time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                icon={AlertTriangle}
                label="Enable Recovery"
                desc="Trigger recovery actions when assigned staff don't respond within the timeout"
                checked={recoveryEnabled}
                onChange={(v) => update(() => setRecoveryEnabled(v))}
              />

              {recoveryEnabled && (
                <>
                  <Separator />
                  {/* Timeout Duration */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-sm font-medium">Response Timeout</Label>
                        <p className="text-xs text-muted-foreground">How long to wait before triggering recovery</p>
                      </div>
                    </div>
                    <Select value={String(timeoutMinutes)} onValueChange={(v) => update(() => setTimeoutMinutes(Number(v)))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEOUT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recovery Mode */}
          {recoveryEnabled && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recovery Mode</CardTitle>
                <CardDescription>What happens when a lead is missed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                  {RECOVERY_MODES.map((rm) => {
                    const Icon = rm.icon;
                    const selected = recoveryMode === rm.value;
                    return (
                      <motion.button
                        key={rm.value}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => update(() => setRecoveryMode(rm.value))}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`rounded-lg p-1.5 ${selected ? "bg-primary/10" : "bg-muted"}`}>
                            <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <span className="font-medium text-sm">{rm.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{rm.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recovery Info */}
          {recoveryEnabled && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">How it works</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground text-xs">
                      <li>• Lead is assigned to a staff member</li>
                      <li>• A {timeoutMinutes}-minute timer starts</li>
                      <li>• If no response, the lead is marked as "missed"</li>
                      <li>• {recoveryMode === "reassign" ? "Lead is auto-reassigned to the next available member (rotated for fairness)" : recoveryMode === "notify_backup" ? "Backup staff are notified of the available lead" : "Lead becomes visible to all team members to claim"}</li>
                      <li>• Original assignee is notified of the missed lead</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard" className="mt-4 space-y-6">
          {/* Stats Cards */}
          <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
            <StatCard label="Total Assigned" value={missedStats.total} icon={Users} />
            <StatCard label="Responded" value={missedStats.respondedCount} icon={CheckCircle2} color="text-emerald-600" />
            <StatCard label="Missed" value={missedStats.missedCount} icon={AlertTriangle} color="text-amber-600" />
            <StatCard label="Recovered" value={missedStats.recoveredCount} icon={RefreshCw} color="text-blue-600" />
          </div>

          {/* Rates */}
          <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-2xl font-bold tabular-nums">{missedStats.responseRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${missedStats.responseRate}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Recovery Rate</span>
                  <span className="text-2xl font-bold tabular-nums">{missedStats.recoveryRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${missedStats.recoveryRate}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Lead Distribution
              </CardTitle>
              <CardDescription>Current lead assignment per team member</CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No team members yet. Add members to see distribution.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((m, i) => {
                    const count = distribution[m.user_id] || 0;
                    const maxCount = Math.max(1, ...Object.values(distribution).concat(1));
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <motion.div
                        key={m.user_id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {(m.profile?.name || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{m.profile?.name || "Unknown"}</span>
                            <Badge variant="secondary" className="text-[10px] ml-2">
                              {ROLE_LABELS[m.role] || m.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                              />
                            </div>
                            <span className="text-xs font-medium tabular-nums text-muted-foreground w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Reusable components ── */

function SettingRow({ icon: Icon, label, desc, checked, onChange }: {
  icon: any; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: any; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
