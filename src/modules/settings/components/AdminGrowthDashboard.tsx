import { useState } from "react";
import {
  Users, UserCheck, Zap, Briefcase, BarChart3, TrendingUp,
  Plus, Send, Eye, Activity, ArrowRight, Target, CheckCircle2,
  Clock, MessageSquare, Trash2, ChevronRight, Lightbulb, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAdminGrowthStats, useOutreachContacts } from "@/hooks/useAdminGrowthStats";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

// ─── KPI Cards ───
function KPICards({ kpis, isLoading }: { kpis: any; isLoading: boolean }) {
  const cards = [
    { label: "New Users (7d)", value: kpis?.newUsers7d ?? 0, icon: Users, color: "text-primary" },
    { label: "Activated Users", value: kpis?.activatedUsers ?? 0, icon: UserCheck, color: "text-success" },
    { label: "Leads Generated", value: kpis?.leads30d ?? 0, icon: Zap, color: "text-warning" },
    { label: "Job Requests", value: kpis?.jobRequests30d ?? 0, icon: Briefcase, color: "text-accent" },
    { label: "Response Rate", value: `${kpis?.responseRate ?? 0}%`, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <motion.div key={c.label} {...fadeUp} transition={{ delay: i * 0.03 }}
          className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
          </div>
          {isLoading ? <Skeleton className="h-7 w-14" /> : (
            <p className="text-2xl font-bold tabular-nums">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Funnel View ───
function FunnelView({ funnel, isLoading }: { funnel: any; isLoading: boolean }) {
  const steps = [
    { label: "Outreach", value: funnel?.outreach ?? 0 },
    { label: "Signups", value: funnel?.signups ?? 0 },
    { label: "Activated", value: funnel?.activated ?? 0 },
    { label: "Leads", value: funnel?.leads ?? 0 },
    { label: "Wins", value: funnel?.wins ?? 0 },
  ];

  const getRate = (curr: number, prev: number) =>
    prev === 0 ? "—" : `${Math.round((curr / prev) * 100)}%`;

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.1 }}
      className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Conversion Funnel (30d)
      </h3>
      <div className="flex items-end gap-1">
        {steps.map((s, i) => {
          const maxVal = Math.max(...steps.map(st => st.value), 1);
          const height = Math.max((s.value / maxVal) * 120, 20);
          return (
            <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
              {isLoading ? <Skeleton className="w-full h-20" /> : (
                <>
                  <span className="text-xs font-bold tabular-nums">{s.value.toLocaleString()}</span>
                  <div
                    className="w-full rounded-t-md bg-primary/20 border border-primary/30 transition-all"
                    style={{ height: `${height}px` }}
                  />
                  {i > 0 && (
                    <span className="text-2xs text-muted-foreground">{getRate(s.value, steps[i - 1].value)}</span>
                  )}
                </>
              )}
              <span className="text-2xs text-muted-foreground font-medium mt-1">{s.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Outreach Tracker ───
const OUTREACH_STATUSES = [
  { value: "not_contacted", label: "Not Contacted", color: "bg-muted text-muted-foreground" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "replied", label: "Replied", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "signed_up", label: "Signed Up", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "activated", label: "Activated", color: "bg-primary/10 text-primary" },
];

function OutreachTracker() {
  const { data: contacts, isLoading, addContact, updateContact, deleteContact } = useOutreachContacts();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBiz, setNewBiz] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addContact.mutate({ name: newName, business: newBiz || undefined, notes: newNotes || undefined }, {
      onSuccess: () => { setShowAdd(false); setNewName(""); setNewBiz(""); setNewNotes(""); toast.success("Contact added"); },
      onError: () => toast.error("Failed to add contact"),
    });
  };

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.15 }}
      className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Outreach Tracker
        </h3>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-3 w-3" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Outreach Contact</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} />
              <Input placeholder="Business" value={newBiz} onChange={e => setNewBiz(e.target.value)} />
              <Textarea placeholder="Notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} />
              <Button onClick={handleAdd} disabled={!newName.trim() || addContact.isPending} className="w-full">
                {addContact.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : !contacts?.length ? (
        <p className="text-sm text-muted-foreground text-center py-6">No outreach contacts yet. Add your first lead above.</p>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          <div className="grid grid-cols-[1fr_1fr_130px_100px_40px] gap-2 px-2 py-1 text-2xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Name</span><span>Business</span><span>Status</span><span>Last Contact</span><span />
          </div>
          {contacts.map(c => {
            const statusObj = OUTREACH_STATUSES.find(s => s.value === c.status) || OUTREACH_STATUSES[0];
            return (
              <div key={c.id} className="grid grid-cols-[1fr_1fr_130px_100px_40px] gap-2 px-2 py-2 rounded-lg hover:bg-muted/40 items-center text-sm">
                <span className="font-medium truncate">{c.name}</span>
                <span className="text-muted-foreground truncate">{c.business || "—"}</span>
                <Select
                  value={c.status}
                  onValueChange={(val) => updateContact.mutate({
                    id: c.id,
                    status: val,
                    last_contact_at: new Date().toISOString(),
                  })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${statusObj.color}`}>
                      {statusObj.label}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {OUTREACH_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-2xs text-muted-foreground">
                  {c.last_contact_at ? formatDistanceToNow(new Date(c.last_contact_at), { addSuffix: true }) : "—"}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6"
                  onClick={() => { if (confirm("Delete this contact?")) deleteContact.mutate(c.id); }}>
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Daily Action Panel ───
function DailyActions({ kpis, contacts }: { kpis: any; contacts: any[] }) {
  const pendingFollowups = (contacts || []).filter(c => c.status === "contacted").length;
  const notContacted = (contacts || []).filter(c => c.status === "not_contacted").length;

  const tasks = [
    { label: `Follow up with ${pendingFollowups} contacted leads`, done: pendingFollowups === 0, icon: MessageSquare },
    { label: `Reach out to ${notContacted} new prospects`, done: notContacted === 0, icon: Send },
    { label: "Check marketplace for new job requests", done: false, icon: Briefcase },
    { label: "Review response rates and optimize", done: (kpis?.responseRate ?? 0) >= 80, icon: BarChart3 },
  ];

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-success" /> Daily Actions
      </h3>
      <div className="space-y-2">
        {tasks.map((t, i) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${t.done ? "bg-success/5" : "bg-muted/30"}`}>
            <t.icon className={`h-4 w-4 shrink-0 ${t.done ? "text-success" : "text-muted-foreground"}`} />
            <span className={`text-sm flex-1 ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.label}</span>
            {t.done && <Badge variant="secondary" className="text-2xs">Done</Badge>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Activity Feed ───
function ActivityFeed({ feed, isLoading }: { feed: any[]; isLoading: boolean }) {
  const typeIcons: Record<string, any> = {
    signup: Users,
    job_request: Briefcase,
    response: Zap,
  };
  const typeColors: Record<string, string> = {
    signup: "text-primary",
    job_request: "text-warning",
    response: "text-success",
  };

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.25 }}
      className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" /> Activity Feed
      </h3>
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
      ) : !feed?.length ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {feed.slice(0, 15).map((item, i) => {
            const Icon = typeIcons[item.type] || Activity;
            return (
              <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30 text-sm">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${typeColors[item.type] || "text-muted-foreground"}`} />
                <span className="flex-1 truncate">{item.title}</span>
                <span className="text-2xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Marketplace Health ───
function MarketplaceHealth({ marketplace, isLoading }: { marketplace: any; isLoading: boolean }) {
  const stats = [
    { label: "Active Businesses", value: marketplace?.activeBusinesses ?? 0, icon: Briefcase },
    { label: "On-Duty Users", value: marketplace?.onDutyUsers ?? 0, icon: UserCheck },
    { label: "Total Requests", value: marketplace?.totalRequests ?? 0, icon: Zap },
    { label: "Avg Responses", value: marketplace?.avgResponses ?? 0, icon: BarChart3 },
  ];

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Rocket className="h-4 w-4 text-primary" /> Marketplace Health
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg bg-muted/30 p-3 text-center">
            {isLoading ? <Skeleton className="h-7 w-10 mx-auto" /> : (
              <p className="text-xl font-bold tabular-nums">{s.value.toLocaleString()}</p>
            )}
            <p className="text-2xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Insights ───
function GrowthInsights({ kpis, funnel, marketplace }: { kpis: any; funnel: any; marketplace: any }) {
  const insights: string[] = [];

  if ((kpis?.responseRate ?? 0) < 50) insights.push("Response rate is below 50%. Consider reaching out to professionals to improve engagement.");
  if ((funnel?.activated ?? 0) < (funnel?.signups ?? 0) * 0.3) insights.push("Less than 30% of signups are activating. Focus onboarding improvements.");
  if ((marketplace?.onDutyUsers ?? 0) === 0) insights.push("No on-duty users. Encourage professionals to toggle on-duty status.");
  if ((kpis?.newUsers7d ?? 0) === 0) insights.push("No new users this week. Ramp up outreach efforts.");
  if ((kpis?.jobRequests30d ?? 0) > 0 && (funnel?.wins ?? 0) === 0) insights.push("Job requests coming in but no wins yet. Help professionals respond faster.");
  if (insights.length === 0) insights.push("Growth looks healthy! Keep up the outreach momentum.");

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.35 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-card to-primary/[0.03] p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-warning" /> Growth Insights
      </h3>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Main Dashboard ───
export default function AdminGrowthDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useAdminGrowthStats();
  const { data: contacts } = useOutreachContacts();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Growth Dashboard</h2>
        <p className="text-sm text-muted-foreground">Track acquisition, activation, and marketplace performance</p>
      </div>

      {/* KPIs */}
      <KPICards kpis={data?.kpis} isLoading={isLoading} />

      {/* Funnel + Marketplace side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelView funnel={data?.funnel} isLoading={isLoading} />
        <MarketplaceHealth marketplace={data?.marketplace} isLoading={isLoading} />
      </div>

      {/* Outreach Tracker */}
      <OutreachTracker />

      {/* Daily Actions + Activity Feed side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyActions kpis={data?.kpis} contacts={contacts || []} />
        <ActivityFeed feed={data?.activityFeed || []} isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5"
          onClick={() => { /* open add contact dialog via state would require lifting — using outreach tracker instead */ toast.info("Use the Outreach Tracker above to add contacts"); }}>
          <Plus className="h-3.5 w-3.5" /> Add Contact
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5"
          onClick={() => navigate("/app/admin-marketing")}>
          <Send className="h-3.5 w-3.5" /> Send Outreach
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5"
          onClick={() => navigate("/app/platform-admin")}>
          <Eye className="h-3.5 w-3.5" /> View Users
        </Button>
      </motion.div>

      {/* Insights */}
      <GrowthInsights kpis={data?.kpis} funnel={data?.funnel} marketplace={data?.marketplace} />
    </div>
  );
}
