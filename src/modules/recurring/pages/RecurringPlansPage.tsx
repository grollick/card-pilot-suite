import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Loader2, RefreshCw, Pause, Play, SkipForward, X,
  MoreHorizontal, Trash2, Calendar, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  useRecurringPlans, usePausePlan, useResumePlan, useCancelPlan,
  useSkipNextService, useDeleteRecurringPlan,
  PLAN_STATUS_LABELS, PLAN_STATUS_COLORS, FREQUENCY_LABELS,
  type RecurringPlanStatus,
} from "@/hooks/useRecurringPlans";
import { format } from "date-fns";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

export default function RecurringPlansPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: plans = [], isLoading } = useRecurringPlans(statusFilter);
  const pausePlan = usePausePlan();
  const resumePlan = useResumePlan();
  const cancelPlan = useCancelPlan();
  const skipNext = useSkipNextService();
  const deletePlan = useDeleteRecurringPlan();

  const activePlans = plans.filter((p: any) => p.status === "active");
  const monthlyRevenue = activePlans.reduce((sum: number, p: any) => {
    const price = Number(p.price);
    switch (p.frequency) {
      case "weekly": return sum + price * 4.33;
      case "biweekly": return sum + price * 2.17;
      case "monthly": return sum + price;
      case "quarterly": return sum + price / 3;
      case "custom": return sum + (p.custom_interval_days ? (price * 30) / p.custom_interval_days : price);
      default: return sum + price;
    }
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal text-muted-foreground">Recurring Services</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Automate repeat scheduling and billing</p>
        </div>
        <Button className="shadow-glow" onClick={() => navigate("/app/recurring/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Plan
        </Button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Active Plans</p>
          <p className="text-2xl font-bold">{activePlans.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Projected Monthly</p>
          <p className="text-2xl font-bold text-success">${Math.round(monthlyRevenue).toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Visits</p>
          <p className="text-2xl font-bold">
            {plans.reduce((sum: number, p: any) => sum + (p.visits_completed || 0), 0)}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Upcoming This Week</p>
          <p className="text-2xl font-bold text-primary">
            {activePlans.filter((p: any) => {
              if (!p.next_service_date) return false;
              const next = new Date(p.next_service_date);
              const now = new Date();
              const weekEnd = new Date(now);
              weekEnd.setDate(weekEnd.getDate() + 7);
              return next >= now && next <= weekEnd;
            }).length}
          </p>
        </CardContent></Card>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No recurring plans yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create a recurring service plan to automate scheduling and billing for repeat customers.
            </p>
            <Button className="mt-4" onClick={() => navigate("/app/recurring/new")}>
              <Plus className="h-4 w-4 mr-2" /> Create Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {plans.map((plan: any) => (
            <Card
              key={plan.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/app/recurring/${plan.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{plan.service_name}</span>
                    <Badge className={`text-[10px] ${PLAN_STATUS_COLORS[plan.status as RecurringPlanStatus]}`}>
                      {PLAN_STATUS_LABELS[plan.status as RecurringPlanStatus]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {FREQUENCY_LABELS[plan.frequency as keyof typeof FREQUENCY_LABELS]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {plan.leads?.name || "No customer"}
                    {plan.next_service_date && ` • Next: ${format(new Date(plan.next_service_date), "MMM d")}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">${Number(plan.price).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.visits_completed} visit{plan.visits_completed !== 1 ? "s" : ""}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {plan.status === "active" && (
                      <>
                        <DropdownMenuItem onClick={() => pausePlan.mutate(plan.id)}>
                          <Pause className="h-4 w-4 mr-2" /> Pause Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => skipNext.mutate(plan.id)}>
                          <SkipForward className="h-4 w-4 mr-2" /> Skip Next
                        </DropdownMenuItem>
                      </>
                    )}
                    {plan.status === "paused" && (
                      <DropdownMenuItem onClick={() => resumePlan.mutate(plan.id)}>
                        <Play className="h-4 w-4 mr-2" /> Resume Plan
                      </DropdownMenuItem>
                    )}
                    {["active", "paused"].includes(plan.status) && (
                      <DropdownMenuItem onClick={() => cancelPlan.mutate(plan.id)}>
                        <X className="h-4 w-4 mr-2" /> Cancel Plan
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => deletePlan.mutate(plan.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
