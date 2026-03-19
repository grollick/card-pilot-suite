import { useState, useMemo } from "react";
import { format, differenceInDays, addDays, isPast } from "date-fns";
import { Search, Plus, Clock, XCircle, RefreshCw, FlaskConical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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

const PLAN_OPTIONS = PLAN_TIERS.filter((p) => p.key !== "agency").map((p) => ({
  value: p.key,
  label: p.name,
}));

export default function BetaManagementTab() {
  const { user } = useAuth();
  const { data: betaList = [], isLoading } = useAdminBetaList();
  const createBeta = useCreateBetaAccess();
  const updateBeta = useUpdateBetaAccess();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New beta form
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("growth");
  const [days, setDays] = useState("30");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    let list = betaList;
    if (filter === "active") list = list.filter((b) => b.is_active && !isPast(new Date(b.expiry_date)));
    if (filter === "expired") list = list.filter((b) => !b.is_active || isPast(new Date(b.expiry_date)));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.user_email?.toLowerCase().includes(q) ||
          b.user_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [betaList, filter, search]);

  const activeCount = betaList.filter((b) => b.is_active && !isPast(new Date(b.expiry_date))).length;

  const handleCreate = async () => {
    if (!email.trim()) return toast.error("Please enter a user email");
    // Look up user by email
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();
    if (error || !profile) return toast.error("User not found with that email");

    await createBeta.mutateAsync({
      user_id: profile.id,
      granted_plan: plan,
      expiry_date: addDays(new Date(), Number(days)).toISOString(),
      notes: notes || undefined,
      admin_id: user!.id,
    });
    setDialogOpen(false);
    setEmail("");
    setNotes("");
  };

  const handleRevoke = (id: string) => updateBeta.mutate({ id, is_active: false });
  const handleExtend = (id: string) => {
    const newExpiry = addDays(new Date(), 30).toISOString();
    updateBeta.mutate({ id, expiry_date: newExpiry });
  };

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{activeCount} active beta testers</span>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{betaList.length} total records</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Grant Beta
              </Button>
            </DialogTrigger>
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
                <div>
                  <Label>Plan Level</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (days)</Label>
                  <Select value={days} onValueChange={setDays}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createBeta.isPending}>
                  {createBeta.isPending ? "Granting…" : "Grant Access"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No beta access records found.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const expired = isPast(new Date(b.expiry_date));
                const isActive = b.is_active && !expired;
                const daysLeft = isActive ? differenceInDays(new Date(b.expiry_date), new Date()) : 0;
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
                      {isActive ? (
                        <Badge className="bg-green-500/15 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" /> {b.is_active ? "Expired" : "Revoked"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(b.expiry_date), "MMM d, yyyy")}
                        {isActive && (
                          <span className={`block text-xs ${daysLeft <= 7 ? "text-destructive" : "text-muted-foreground"}`}>
                            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {b.notes || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      {isActive ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExtend(b.id)}
                            disabled={updateBeta.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> +30d
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRevoke(b.id)}
                            disabled={updateBeta.isPending}
                          >
                            Revoke
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
