import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Eye, Users, CalendarCheck, Star, TrendingUp, CheckCircle2, AlertCircle, Plus, Pencil, Trash2, Rocket, ArrowUpRight, ShieldCheck, Zap, Crown } from "lucide-react";
import { ReviewDashboard } from "../components/ReviewDashboard";
import ProviderAIAssistant from "../components/ProviderAIAssistant";
import CopilotPriorityStack from "../components/CopilotPriorityStack";
import AIRoiPanel from "../components/AIRoiPanel";
import ReplyStatsPanel from "../components/ReplyStatsPanel";
import AutoReplySettings from "../components/AutoReplySettings";
import { ProfileOptimizePanel } from "../components/AIActionCards";
import AIFeatureGate from "../components/AIFeatureGate";
import { useAIUsage, useProviderBusiness, useDashboardSummary } from "../hooks/useProviderInsights";
import { useBusinessServices, useBusinessAreas, useBusinessCategories, useMarketplaceMetrics, useProfileCompleteness } from "../hooks/useProviderData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BoostCampaignPanel from "../components/BoostCampaignPanel";
import PlanLimitModal from "../components/PlanLimitModal";
import { useBusinessPlanStatus, type LimitKind } from "../hooks/useBusinessPlanStatus";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
  growth: "bg-warning/10 text-warning",
};

export default function ProviderDashboard() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  // Real business data
  const { data: business, isLoading: bizLoading } = useProviderBusiness();
  const businessId = business?.id;
  const { data: aiUsage } = useAIUsage();
  const { data: summary } = useDashboardSummary();
  const { data: services = [], isLoading: servicesLoading } = useBusinessServices();
  const { data: areas = [], isLoading: areasLoading } = useBusinessAreas();
  const { data: categories = [], isLoading: catsLoading } = useBusinessCategories();
  const { data: metrics } = useMarketplaceMetrics();
  const { data: profile } = useProfileCompleteness();
  const { plan, isLimitReached, getLimit } = useBusinessPlanStatus(businessId);

  const completeness = profile?.percent ?? 0;
  const tips = profile?.tips ?? [];

  // Limit modal state
  const [limitModal, setLimitModal] = useState<{ open: boolean; kind: LimitKind; count: number }>({
    open: false,
    kind: "services",
    count: 0,
  });

  const openLimitModal = (kind: LimitKind, currentCount: number) => {
    setLimitModal({ open: true, kind, count: currentCount });
  };

  const handleAddService = () => {
    const activeCount = services.filter((s) => s.active).length;
    if (isLimitReached("services", activeCount)) {
      openLimitModal("services", activeCount);
      return;
    }
    toast.info("Add service");
  };

  const handleAddArea = () => {
    if (isLimitReached("service_areas", areas.length)) {
      openLimitModal("service_areas", areas.length);
      return;
    }
    toast.info("Add service area");
  };

  const handleNewBooking = () => {
    const monthlyBookings = summary?.pending_bookings ?? 0;
    if (isLimitReached("bookings", monthlyBookings)) {
      openLimitModal("bookings", monthlyBookings);
      return;
    }
    toast.info("Create booking");
  };

  const planColor = PLAN_COLORS[plan.plan_name] ?? PLAN_COLORS.free;

  return (
    <div className="space-y-6">
      <Helmet><title>Marketplace | Dashboard</title></Helmet>

      {/* Header with plan badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <Badge className={`text-xs capitalize gap-1 ${planColor}`}>
            <Crown className="h-3 w-3" />
            {plan.plan_name} plan
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visible on marketplace</span>
          <Switch checked={isVisible} onCheckedChange={(v) => { setIsVisible(v); toast.success(v ? "You're now visible on the marketplace" : "Hidden from marketplace"); }} />
        </div>
      </div>

      {/* Copilot Priority Stack — hero section */}
      <CopilotPriorityStack onAction={(s) => toast.info(`Action: ${s.title}`)} />

      {/* AI ROI Panel */}
      <AIRoiPanel />

      {/* AI Reply Stats */}
      <ReplyStatsPanel />

      {/* Performance Panel */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Marketplace Performance</h2>
            </div>
            <Badge variant="outline" className="text-xs">Last 30 days</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
          {[
            { label: "Profile Views", value: "—", icon: Eye },
            { label: "Leads Received", value: summary?.new_leads ?? metrics?.lead_count_30d ?? "—", icon: Users },
            { label: "Bookings", value: summary?.pending_bookings ?? metrics?.booking_count_30d ?? "—", icon: CalendarCheck },
            { label: "Avg. Rating", value: metrics?.avg_rating != null ? Number(metrics.avg_rating).toFixed(1) : "—", icon: Star },
          ].map((stat) => (
            <div key={stat.label} className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-primary/5 border-t border-primary/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <p className="text-sm text-foreground font-medium">Boost your profile to get more visibility</p>
          </div>
          <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => document.getElementById("boost-panel")?.scrollIntoView({ behavior: "smooth" })}>
            Get More Customers <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Premium Badge Section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
              <ShieldCheck className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Premium Badge</h2>
              <p className="text-xs text-muted-foreground">Increases trust and clicks on your profile</p>
            </div>
          </div>
          {plan.plan_name === "growth" ? (
            <Badge className="bg-warning/10 text-warning border-warning/20 gap-1">
              <ShieldCheck className="h-3 w-3" /> Active
            </Badge>
          ) : (
            <Button size="sm" onClick={() => navigate("/pricing")}>
              <Zap className="h-3.5 w-3.5 mr-1" /> Upgrade to Growth
            </Button>
          )}
        </div>
        {plan.plan_name !== "growth" && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Growth plan providers see <span className="font-medium text-foreground">40% more clicks</span> with the Premium badge.
            </p>
          </div>
        )}
      </div>

      {/* Upgrade Hooks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Appear higher in search</p>
            <p className="text-xs text-muted-foreground">Featured placement drives 3× more leads</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Get more customers</p>
            <p className="text-xs text-muted-foreground">Unlock unlimited bookings and better lead tools</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Reviews Dashboard */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-4">Reviews & Trust</h2>
        <ReviewDashboard businessId={businessId} />
      </div>

      {/* Boost Campaign Panel */}
      <div id="boost-panel">
        <BoostCampaignPanel />
      </div>

      {/* Profile Completeness */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Profile Completeness</h2>
          <span className="text-sm font-bold text-primary">{completeness}%</span>
        </div>
        <Progress value={completeness} className="h-2 mb-4" />
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {tip.done ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-warning" />
              )}
              <span className={tip.done ? "text-muted-foreground line-through" : "text-foreground"}>{tip.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Reply Settings */}
      <AutoReplySettings />

      {/* AI Profile Optimization */}
      <AIFeatureGate feature="profile_rewrite" enabled={aiUsage?.features?.profile_rewrite}>
        <ProfileOptimizePanel />
      </AIFeatureGate>

      {/* Categories */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-3">Business Categories</h2>
        {catsLoading ? (
          <div className="flex gap-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-20" /></div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c.key} variant={c.selected ? "default" : "outline"} className="cursor-pointer" onClick={() => toast.info(`Toggle ${c.label}`)}>
                {c.label}
              </Badge>
            ))}
          </div>
        )}
        <Badge variant="outline" className="cursor-pointer border-dashed mt-2" onClick={() => toast.info("Add category")}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Badge>
      </div>

      {/* Service Areas with limit check */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Service Areas</h2>
          {getLimit("service_areas") !== null && (
            <span className="text-xs text-muted-foreground">
              {areas.length}/{getLimit("service_areas")} used
            </span>
          )}
        </div>
        {areasLoading ? (
          <div className="flex gap-2"><Skeleton className="h-6 w-28" /><Skeleton className="h-6 w-24" /></div>
        ) : areas.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">No service areas set.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {areas.map((a) => (
              <Badge key={a.id} variant="secondary" className="gap-1">
                {a.city}{a.region ? `, ${a.region}` : ""}
                <button className="ml-1 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="Add a city…" className="max-w-xs" />
          <Button size="sm" variant="outline" onClick={handleAddArea}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Services with limit check */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">Services</h2>
            {getLimit("services") !== null && (
              <span className="text-xs text-muted-foreground">
                {services.filter((s) => s.active).length}/{getLimit("services")}
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={handleAddService}>
            <Plus className="h-4 w-4 mr-1" /> Add Service
          </Button>
        </div>
        {servicesLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services added yet.</p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <span className="text-sm font-medium text-foreground">{s.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{s.price ? `$${s.price}` : "Quote only"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.active ? "default" : "secondary"} className="text-xs">
                    {s.active ? "Active" : "Inactive"}
                  </Badge>
                  <button className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-3">Review Summary</h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">
              {metrics?.avg_rating != null ? Number(metrics.avg_rating).toFixed(1) : "—"}
            </span>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(Number(metrics?.avg_rating ?? 0)) ? "fill-warning text-warning" : "text-muted"}`} />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{metrics?.review_count ?? 0} total reviews</p>
          </div>
        </div>
      </div>

      {/* Plan Limit Modal */}
      <PlanLimitModal
        open={limitModal.open}
        onClose={() => setLimitModal((s) => ({ ...s, open: false }))}
        limitKind={limitModal.kind}
        currentPlan={plan.plan_name}
        currentCount={limitModal.count}
        maxLimit={getLimit(limitModal.kind)}
      />

      {/* Provider AI Assistant */}
      <ProviderAIAssistant />
    </div>
  );
}
