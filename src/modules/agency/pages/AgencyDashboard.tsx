import { useState } from "react";
import { useClientWorkspaces, useIsAgency } from "@/hooks/useAgency";
import WhiteLabelSettings from "@/modules/agency/components/WhiteLabelSettings";
import BulkActionsPanel from "@/modules/agency/components/BulkActionsPanel";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2, Plus, Users, Calendar, Briefcase, FileText,
  ArrowRight, Loader2, Crown, Search, LayoutGrid, List,
  TrendingUp, Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AgencyDashboard() {
  const { data: isAgency, isLoading: agencyLoading } = useIsAgency();
  const { data: workspaces, isLoading } = useClientWorkspaces();
  const { switchOrg, createOrg, currentOrg } = useOrg();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    try {
      await createOrg(newName.trim(), newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"));
      toast.success(`Workspace "${newName}" created!`);
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleSwitch = async (orgId: string) => {
    await switchOrg(orgId);
    navigate("/app");
    toast.success("Switched workspace");
  };

  const filtered = (workspaces ?? []).filter((w) =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalLeads = filtered.reduce((a, w) => a + w.lead_count, 0);
  const totalBookings = filtered.reduce((a, w) => a + w.booking_count, 0);
  const totalJobs = filtered.reduce((a, w) => a + w.job_count, 0);

  if (agencyLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAgency) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <Crown className="h-12 w-12 mx-auto text-primary/40" />
        <h2 className="text-2xl font-bold">Agency Mode</h2>
        <p className="text-muted-foreground">
          Manage multiple client businesses from one account. Upgrade to the Agency plan to unlock this feature.
        </p>
        <Button onClick={() => navigate("/app/settings")}>
          Upgrade Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal">Agency Command Center</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all your client workspaces from one place
          </p>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              New Client Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Client Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Client / Business Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                  }}
                  placeholder="Gary's Landscaping"
                />
              </div>
              <div className="space-y-2">
                <Label>Workspace Slug</Label>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="garys-landscaping"
                />
              </div>
              <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full">
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Client Workspaces", value: filtered.length, icon: Building2 },
          { label: "Total Leads", value: totalLeads, icon: Users },
          { label: "Total Bookings", value: totalBookings, icon: Calendar },
          { label: "Total Jobs", value: totalJobs, icon: Briefcase },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & View toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Client Grid / List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws, i) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className={`group hover:shadow-lg transition-all cursor-pointer border ${
                currentOrg?.id === ws.id ? "border-primary/40 ring-1 ring-primary/10" : "border-border/60 hover:border-primary/30"
              }`} onClick={() => handleSwitch(ws.id)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 rounded-xl border-2 border-border">
                      <AvatarImage src={ws.logo_url ?? undefined} />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-sm">
                        {ws.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{ws.name}</h3>
                      <p className="text-xs text-muted-foreground">/{ws.slug}</p>
                    </div>
                    {currentOrg?.id === ws.id && (
                      <Badge variant="secondary" className="text-xs shrink-0">Active</Badge>
                    )}
                  </div>

                  {ws.white_label_enabled && (
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      <Globe className="h-3 w-3 mr-1" /> White Label
                    </Badge>
                  )}

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { label: "Leads", val: ws.lead_count, icon: Users },
                      { label: "Book", val: ws.booking_count, icon: Calendar },
                      { label: "Jobs", val: ws.job_count, icon: Briefcase },
                      { label: "Est.", val: ws.estimate_count, icon: FileText },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className="text-lg font-bold">{m.val}</p>
                        <p className="text-2xs text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button size="sm" variant="ghost" className="text-xs text-primary">
                      Open <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-center px-3 py-3 font-medium">Leads</th>
                <th className="text-center px-3 py-3 font-medium">Bookings</th>
                <th className="text-center px-3 py-3 font-medium">Jobs</th>
                <th className="text-center px-3 py-3 font-medium">Estimates</th>
                <th className="text-center px-3 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ws) => (
                <tr
                  key={ws.id}
                  className="border-t border-border/40 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => handleSwitch(ws.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={ws.logo_url ?? undefined} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                          {ws.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{ws.name}</p>
                        <p className="text-2xs text-muted-foreground">/{ws.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-3 text-sm">{ws.lead_count}</td>
                  <td className="text-center px-3 py-3 text-sm">{ws.booking_count}</td>
                  <td className="text-center px-3 py-3 text-sm">{ws.job_count}</td>
                  <td className="text-center px-3 py-3 text-sm">{ws.estimate_count}</td>
                  <td className="text-center px-3 py-3">
                    {currentOrg?.id === ws.id ? (
                      <Badge variant="secondary" className="text-2xs">Active</Badge>
                    ) : (
                      <span className="text-2xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="text-right px-4 py-3">
                    <ArrowRight className="h-4 w-4 text-muted-foreground inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No client workspaces yet</h3>
          <p className="text-muted-foreground mb-6">Create your first client workspace to get started.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Workspace
          </Button>
        </div>
      )}

      {/* Bulk Actions */}
      {(workspaces ?? []).length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <BulkActionsPanel />
          </CardContent>
        </Card>
      )}

      {/* White Label Settings */}
      {currentOrg && <WhiteLabelSettings />}
    </div>
  );
}
