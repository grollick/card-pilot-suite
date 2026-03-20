import { useState, useEffect } from "react";
import {
  Route, Users, Shuffle, Clock, Hand, Shield, MapPin, Wrench,
  Calendar, Loader2, ArrowRight, BarChart3, User
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
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useLeadAssignmentSettings,
  useUpsertLeadAssignmentSettings,
  useLeadDistribution,
  type AssignmentMode,
} from "@/hooks/useLeadAssignment";
import { useTeamMembers, ROLE_LABELS } from "@/hooks/useTeam";

const MODES: { value: AssignmentMode; label: string; icon: any; desc: string }[] = [
  { value: "round_robin", label: "Round Robin", icon: Shuffle, desc: "Distribute leads evenly across all staff in rotation" },
  { value: "availability", label: "Availability-Based", icon: Clock, desc: "Assign to staff who are currently available" },
  { value: "manual", label: "Manual", icon: Hand, desc: "Assign leads manually from the CRM" },
];

export default function LeadRoutingPage() {
  const isMobile = useIsMobile();
  const { data: settings, isLoading } = useLeadAssignmentSettings();
  const upsert = useUpsertLeadAssignmentSettings();
  const { data: teamMembers = [] } = useTeamMembers();
  const distribution = useLeadDistribution();

  const [mode, setMode] = useState<AssignmentMode>("manual");
  const [fallbackToOwner, setFallbackToOwner] = useState(true);
  const [matchByServices, setMatchByServices] = useState(false);
  const [matchByLocation, setMatchByLocation] = useState(false);
  const [filterByAvailability, setFilterByAvailability] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setMode(settings.assignment_mode as AssignmentMode);
      setFallbackToOwner(settings.fallback_to_owner);
      setMatchByServices(settings.match_by_services);
      setMatchByLocation(settings.match_by_location);
      setFilterByAvailability(settings.filter_by_availability);
    }
  }, [settings]);

  const handleSave = () => {
    upsert.mutate({
      assignment_mode: mode,
      fallback_to_owner: fallbackToOwner,
      match_by_services: matchByServices,
      match_by_location: matchByLocation,
      filter_by_availability: filterByAvailability,
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
            <Route className="h-6 w-6 text-primary" /> Lead Routing
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure how incoming leads are assigned to your team
          </p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || upsert.isPending}>
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Settings
        </Button>
      </div>

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
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Match by Services</Label>
                <p className="text-xs text-muted-foreground">Assign to staff who offer the requested service</p>
              </div>
            </div>
            <Switch checked={matchByServices} onCheckedChange={(v) => update(() => setMatchByServices(v))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Match by Location</Label>
                <p className="text-xs text-muted-foreground">Prefer staff nearest to the lead's location</p>
              </div>
            </div>
            <Switch checked={matchByLocation} onCheckedChange={(v) => update(() => setMatchByLocation(v))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Filter by Availability</Label>
                <p className="text-xs text-muted-foreground">Only assign to staff within their working hours</p>
              </div>
            </div>
            <Switch checked={filterByAvailability} onCheckedChange={(v) => update(() => setFilterByAvailability(v))} />
          </div>
        </CardContent>
      </Card>

      {/* Fallback */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fallback</CardTitle>
          <CardDescription>What happens when no staff match</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Assign to Owner</Label>
                <p className="text-xs text-muted-foreground">If no staff are available, assign the lead to the business owner</p>
              </div>
            </div>
            <Switch checked={fallbackToOwner} onCheckedChange={(v) => update(() => setFallbackToOwner(v))} />
          </div>
        </CardContent>
      </Card>

      {/* Lead Distribution Dashboard */}
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
                const maxCount = Math.max(1, ...Object.values(distribution));
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
    </div>
  );
}
