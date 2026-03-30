import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Eye, Users, CalendarCheck, Star, TrendingUp, CheckCircle2, AlertCircle, Plus, Pencil, Trash2, Rocket, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BoostCampaignPanel from "../components/BoostCampaignPanel";

const MOCK_SERVICES = [
  { id: "1", title: "Spring Cleanup", price: 250, active: true },
  { id: "2", title: "Lawn Maintenance", price: 75, active: true },
  { id: "3", title: "Garden Design", price: null, active: false },
];

const MOCK_AREAS = ["Thunder Bay", "Sudbury", "Sault Ste. Marie"];

const MOCK_CATEGORIES = [
  { key: "landscaping", label: "Landscaping", selected: true },
  { key: "lawn-care", label: "Lawn Care", selected: true },
  { key: "snow-removal", label: "Snow Removal", selected: false },
];

const TIPS = [
  { done: true, label: "Upload a logo" },
  { done: true, label: "Add at least 3 services" },
  { done: false, label: "Get your first review" },
  { done: false, label: "Complete your profile bio" },
  { done: true, label: "Set service areas" },
];

export default function ProviderDashboard() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const completeness = 68;
  const currentPlan: string = "free"; // mock

  return (
    <div className="space-y-6">
      <Helmet><title>Marketplace | Dashboard</title></Helmet>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visible on marketplace</span>
          <Switch checked={isVisible} onCheckedChange={(v) => { setIsVisible(v); toast.success(v ? "You're now visible on the marketplace" : "Hidden from marketplace"); }} />
        </div>
      </div>

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
            { label: "Profile Views", value: "142", icon: Eye, change: "+12%" },
            { label: "Leads Received", value: "23", icon: Users, change: "+8%" },
            { label: "Bookings", value: "11", icon: CalendarCheck, change: "+15%" },
            { label: "Avg. Rating", value: "4.8", icon: Star, change: "↑ 0.1" },
          ].map((stat) => (
            <div key={stat.label} className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-success font-medium mb-0.5">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Upgrade hook inside performance */}
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
          {currentPlan === "growth" ? (
            <Badge className="bg-warning/10 text-warning border-warning/20 gap-1">
              <ShieldCheck className="h-3 w-3" /> Active
            </Badge>
          ) : (
            <Button size="sm" onClick={() => navigate("/pricing")}>
              <Zap className="h-3.5 w-3.5 mr-1" /> Upgrade to Growth
            </Button>
          )}
        </div>
        {currentPlan !== "growth" && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Growth plan providers see <span className="font-medium text-foreground">40% more clicks</span> with the Premium badge.
              Customers trust verified professionals more.
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
          {TIPS.map((tip, i) => (
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

      {/* Categories */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-3">Business Categories</h2>
        <div className="flex flex-wrap gap-2">
          {MOCK_CATEGORIES.map((c) => (
            <Badge key={c.key} variant={c.selected ? "default" : "outline"} className="cursor-pointer" onClick={() => toast.info(`Toggle ${c.label}`)}>
              {c.label}
            </Badge>
          ))}
          <Badge variant="outline" className="cursor-pointer border-dashed" onClick={() => toast.info("Add category")}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Badge>
        </div>
      </div>

      {/* Service Areas */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-3">Service Areas</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {MOCK_AREAS.map((a) => (
            <Badge key={a} variant="secondary" className="gap-1">
              {a}
              <button className="ml-1 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add a city…" className="max-w-xs" />
          <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Services */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Services</h2>
          <Button size="sm" variant="outline" onClick={() => toast.info("Add service")}><Plus className="h-4 w-4 mr-1" /> Add Service</Button>
        </div>
        <div className="space-y-2">
          {MOCK_SERVICES.map((s) => (
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
      </div>

      {/* Review Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-3">Review Summary</h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">4.8</span>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= 5 ? "fill-warning text-warning" : "text-muted"}`} />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">47 total reviews</p>
            <p className="text-xs text-success">+3 this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
