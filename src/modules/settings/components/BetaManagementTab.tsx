import { useState, useMemo } from "react";
import { format, differenceInDays, addDays, isPast, isBefore, addWeeks } from "date-fns";
import {
  Search, Plus, Clock, XCircle, RefreshCw, FlaskConical,
  CheckCircle2, AlertTriangle, User, MoreHorizontal, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  useAdminBetaList,
  useCreateBetaAccess,
  useUpdateBetaAccess,
} from "@/hooks/useBetaAccess";
import { PLAN_TIERS } from "@/lib/plans";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "expiring_soon" | "expired";
type PlanFilter = "all" | "starter" | "growth" | "pro";

const PLAN_OPTIONS = PLAN_TIERS.filter((p) => p.key !== "agency").map((p) => ({
  value: p.key,
  label: p.name,
}));

function getStatus(b: { is_active: boolean; expiry_date: string }) {
  const expired = isPast(new Date(b.expiry_date));
  if (!b.is_active) return "revoked" as const;
  if (expired) return "expired" as const;
  const daysLeft = differenceInDays(new Date(b.expiry_date), new Date());
  if (daysLeft <= 7) return "expiring_soon" as const;
  return "active" as const;
}

export default function BetaManagementTab() {
  const { user } = useAuth();
  const { data: betaList = [], isLoading } = useAdminBetaList();
  const createBeta = useCreateBetaAccess();
  const updateBeta = useUpdateBetaAccess();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extendDialogId, setExtendDialogId] = useState<string | null>(null);
  const [customDays, setCustomDays] = useState("14");

  // Create form state
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("growth");
  const [days, setDays] = useState("14");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Summary metrics
  const metrics = useMemo(() => {
    let active = 0, expiringSoon = 0, expired = 0;
    for (const b of betaList) {
      const s = getStatus(b);
      if (s === "active") active++;
      else if (s === "expiring_soon") { expiringSoon++; active++; }
      else if (s === "expired" || s === "revoked") expired++;
    }
    return { active, expiringSoon, expired, total: betaList.length };
  }, [betaList]);

  // Expiry alerts (users expiring within 7 days)
  const expiringUsers = useMemo(
    () => betaList.filter((b) => getStatus(b) === "expiring_soon"),
    [betaList]
  );

  // Filtered list
  const filtered = useMemo(() => {
    let list = betaList;

    if (statusFilter === "active") list = list.filter((b) => {
      const s = getStatus(b);
      return s === "active" || s === "expiring_soon";
    });
    if (statusFilter === "expiring_soon") list = list.filter((b) => getStatus(b) === "expiring_soon");
    if (statusFilter === "expired") list = list.filter((b) => {
      const s = getStatus(b);
      return s === "expired" || s === "revoked";
    });

    if (planFilter !== "all") list = list.filter((b) => b.granted_plan === planFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.user_email?.toLowerCase().includes(q) ||
          b.user_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [betaList, statusFilter, planFilter, search]);

  const handleCreate = async () => {
    if (!email.trim()) return toast.error("Please enter a user email");
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();
    if (error || !profile) return toast.error("User not found with that email");

    const start = new Date(startDate);
    await createBeta.mutateAsync({
      user_id: profile.id,
      granted_plan: plan,
      expiry_date: addDays(start, Number(days)).toISOString(),
      notes: notes || undefined,
      admin_id: user!.id,
    });
    setDialogOpen(false);
    setEmail("");
    setNotes("");
    setPlan("growth");
    setDays("14");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleRevoke = (id: string) => updateBeta.mutate({ id, is_active: false });

  const handleExtend = (id: string, extendDays: number) => {
    const record = betaList.find((b) => b.id === id);
    if (!record) return;
    const currentExpiry = new Date(record.expiry_date);
    const base = isPast(currentExpiry) ? new Date() : currentExpiry;
    const newExpiry = addDays(base, extendDays).toISOString();
    updateBeta.mutate({ id, expiry_date: newExpiry, is_active: true });
  };

  const handleChangePlan = (id: string, newPlan: string) => {
    updateBeta.mutate({ id, notes: `Plan changed to ${newPlan}` });
    // We need to update granted_plan - extend the mutation
    supabase.from("beta_access").update({ granted_plan: newPlan }).eq("id", id).then(() => {
      toast.success(`Plan changed to ${PLAN_TIERS.find((p) => p.key === newPlan)?.name ?? newPlan}`);
    });
  };

  const resetForm = () => {
    setEmail("");
    setPlan("growth");
    setDays("14");
    setNotes("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<FlaskConical className="h-4 w-4" />}
          label="Active Beta Users"
          value={metrics.active}
          variant="primary"
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Expiring Soon"
          value={metrics.expiringSoon}
          variant="warning"
        />
        <MetricCard
          icon={<XCircle className="h-4 w-4" />}
          label="Expired"
          value={metrics.expired}
          variant="muted"
        />
        <MetricCard
          icon={<User className="h-4 w-4" />}
          label="Total Records"
          value={metrics.total}
          variant="muted"
        />
      </div>

      {/* Expiry Alerts */}
      {expiringUsers.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {expiringUsers.length} user{expiringUsers.length !== 1 ? "s" : ""} expiring within 7 days
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringUsers.map((u) => (
              <Badge key={u.id} variant="outline" className="text-destructive border-destructive/30 text-xs">
                {u.user_name || u.user_email || u.user_id.slice(0, 8)} —{" "}
                {differenceInDays(new Date(u.expiry_date), new Date())}d left
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as PlanFilter)}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {PLAN_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" onClick={resetForm}>
            <Plus className="h-4 w-4 mr-1" /> Grant Beta
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No beta access records found.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const status = getStatus(b);
                const daysLeft = differenceInDays(new Date(b.expiry_date), new Date());
                const planLabel = PLAN_TIERS.find((p) => p.key === b.granted_plan)?.name ?? b.granted_plan;

                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{b.user_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{b.user_email || b.user_id.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{planLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} daysLeft={daysLeft} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(b.expiry_date), "MMM d, yyyy")}
                        {(status === "active" || status === "expiring_soon") && (
                          <span className={`block text-xs ${status === "expiring_soon" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {b.notes || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      {(status === "active" || status === "expiring_soon") ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Extend Access
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleExtend(b.id, 7)}>+7 days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExtend(b.id, 14)}>+14 days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExtend(b.id, 30)}>+30 days</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setExtendDialogId(b.id); setCustomDays("14"); }}>
                                  Custom…
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <ArrowUpRight className="h-3.5 w-3.5 mr-2" /> Change Plan
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {PLAN_OPTIONS.filter((p) => p.value !== b.granted_plan).map((p) => (
                                  <DropdownMenuItem key={p.value} onClick={() => handleChangePlan(b.id, p.value)}>
                                    {p.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleRevoke(b.id)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-2" /> Revoke Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleExtend(b.id, 14)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Beta Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>User Email</Label>
              <Input
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan Level</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration</Label>
                <Select value={days} onValueChange={setDays}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days (default)</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Reason for beta access…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Expires: {format(addDays(new Date(startDate), Number(days)), "MMM d, yyyy")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createBeta.isPending}>
              {createBeta.isPending ? "Granting…" : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Extend Dialog */}
      <Dialog open={!!extendDialogId} onOpenChange={(o) => !o && setExtendDialogId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Custom Extension</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Extend by (days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogId(null)}>Cancel</Button>
            <Button onClick={() => {
              if (extendDialogId) handleExtend(extendDialogId, Number(customDays));
              setExtendDialogId(null);
            }}>
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Sub-components ── */

function MetricCard({ icon, label, value, variant }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant: "primary" | "warning" | "muted";
}) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className={`rounded-lg px-3 py-3 ${styles[variant]}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status, daysLeft }: { status: string; daysLeft: number }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-primary/15 text-primary border-primary/20">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
        </Badge>
      );
    case "expiring_soon":
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/20">
          <AlertTriangle className="h-3 w-3 mr-1" /> {daysLeft}d left
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" /> Expired
        </Badge>
      );
    case "revoked":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <XCircle className="h-3 w-3 mr-1" /> Revoked
        </Badge>
      );
    default:
      return null;
  }
}
