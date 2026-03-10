import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useCard";
import { useBoosts, useActiveBoosts, useCreateBoost, useCancelBoost, type NeighborhoodBoost } from "@/hooks/useBoosts";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Rocket, MapPin, Clock, Eye, Users, Calendar, TrendingUp,
  Zap, CheckCircle, XCircle, Plus, BarChart3, Target, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInDays, isPast } from "date-fns";

const DURATION_OPTIONS = [
  { days: 3, label: "3 Days", price: "$5" },
  { days: 7, label: "7 Days", price: "$9" },
  { days: 14, label: "14 Days", price: "$15" },
  { days: 30, label: "30 Days", price: "$25" },
];

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function BoostPage() {
  const { data: profile } = useProfile();
  const { data: allBoosts, isLoading } = useBoosts();
  const { data: activeBoosts } = useActiveBoosts();
  const { planKey } = usePlanLimits();
  const createBoost = useCreateBoost();
  const cancelBoost = useCancelBoost();

  // ── Create boost form ──
  const [city, setCity] = useState(profile?.city || "");
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState(10);
  const [duration, setDuration] = useState(7);
  const [showCreate, setShowCreate] = useState(false);

  const isPro = planKey === "pro" || planKey === "agency";
  const hasActiveBoost = (activeBoosts?.length ?? 0) > 0;

  // ── Stats ──
  const totalViews = useMemo(() => allBoosts?.reduce((sum, b) => sum + b.views_count, 0) ?? 0, [allBoosts]);
  const totalLeads = useMemo(() => allBoosts?.reduce((sum, b) => sum + b.leads_count, 0) ?? 0, [allBoosts]);
  const totalBookings = useMemo(() => allBoosts?.reduce((sum, b) => sum + b.bookings_count, 0) ?? 0, [allBoosts]);

  const handleCreate = () => {
    if (!city.trim()) {
      toast.error("Please enter a city");
      return;
    }
    createBoost.mutate({
      target_city: city.trim(),
      target_postal_code: postalCode.trim() || undefined,
      radius_km: radius,
      duration_days: duration,
    });
    setShowCreate(false);
  };

  const selectedDuration = DURATION_OPTIONS.find(d => d.days === duration)!;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Neighborhood Boost
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Promote your business to nearby customers searching for services
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} disabled={hasActiveBoost && !isPro}>
          <Plus className="h-4 w-4 mr-1" />
          {hasActiveBoost ? "New Boost" : "Activate Boost"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Boosts", value: activeBoosts?.length ?? 0, icon: Zap, color: "text-primary" },
          { label: "Total Views", value: totalViews, icon: Eye, color: "text-accent" },
          { label: "Leads Generated", value: totalLeads, icon: Users, color: "text-success" },
          { label: "Bookings", value: totalBookings, icon: Calendar, color: "text-warning" },
        ].map((kpi) => (
          <Card key={kpi.label} className="dash-card">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create boost form */}
      {showCreate && (
        <Card className="dash-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Set Up Your Boost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* City */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Target City
                </Label>
                <Input
                  placeholder="e.g. Austin, TX"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              {/* Postal code */}
              <div className="space-y-2">
                <Label className="text-sm">Postal Code (optional)</Label>
                <Input
                  placeholder="e.g. 78701"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-3">
              <Label className="text-sm">Boost Radius: {radius} km</Label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <Button
                    key={r}
                    variant={radius === r ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRadius(r)}
                    className="flex-1"
                  >
                    {r} km
                  </Button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-sm">Duration</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setDuration(opt.days)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      duration === opt.days
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isPro ? "Included" : opt.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Boost in <span className="text-primary">{city || "—"}</span> for {selectedDuration.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {radius} km radius • Your card will appear as "Boosted" on Discover
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  onClick={handleCreate}
                  disabled={createBoost.isPending || !city.trim()}
                  className="shadow-glow"
                >
                  <Rocket className="h-4 w-4 mr-1" />
                  {isPro ? "Activate Boost" : `Activate — ${selectedDuration.price}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active boosts */}
      {(activeBoosts?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Active Boosts
          </h2>
          {activeBoosts!.map((boost) => (
            <BoostCard key={boost.id} boost={boost} onCancel={() => cancelBoost.mutate(boost.id)} />
          ))}
        </div>
      )}

      {/* Past boosts */}
      {(allBoosts?.filter(b => b.status !== "active" || isPast(new Date(b.expires_at))).length ?? 0) > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" /> Past Boosts
          </h2>
          {allBoosts!
            .filter(b => b.status !== "active" || isPast(new Date(b.expires_at)))
            .map((boost) => (
              <BoostCard key={boost.id} boost={boost} past />
            ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (allBoosts?.length ?? 0) === 0 && !showCreate && (
        <Card className="dash-card">
          <CardContent className="py-12 text-center">
            <Rocket className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No boosts yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Activate a Neighborhood Boost to promote your business on the Discover page and attract nearby customers.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Rocket className="h-4 w-4 mr-1" /> Create Your First Boost
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pro tip */}
      {!isPro && (
        <Card className="dash-card border-dashed">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Pro & Agency plans include unlimited boosts</p>
              <p className="text-xs text-muted-foreground">Upgrade to boost your visibility without per-boost fees.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Boost card component ──
function BoostCard({ boost, onCancel, past }: { boost: NeighborhoodBoost; onCancel?: () => void; past?: boolean }) {
  const expired = isPast(new Date(boost.expires_at));
  const daysLeft = expired ? 0 : differenceInDays(new Date(boost.expires_at), new Date());
  const isActive = boost.status === "active" && !expired;

  return (
    <Card className="dash-card">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
              isActive ? "bg-primary/10" : "bg-muted"
            }`}>
              <MapPin className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{boost.target_city || "All areas"}</p>
                <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] shrink-0">
                  {isActive ? "Active" : expired ? "Expired" : "Cancelled"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {boost.radius_km} km radius • {boost.duration_days} days
                {isActive && ` • ${daysLeft} days remaining`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-sm font-bold">{boost.views_count}</p>
              <p className="text-[10px] text-muted-foreground">Views</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">{boost.leads_count}</p>
              <p className="text-[10px] text-muted-foreground">Leads</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">{boost.bookings_count}</p>
              <p className="text-[10px] text-muted-foreground">Bookings</p>
            </div>
            {isActive && onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive hover:text-destructive">
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
