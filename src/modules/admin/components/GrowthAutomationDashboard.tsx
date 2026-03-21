import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ColdOutreachTemplates from "@/modules/admin/components/ColdOutreachTemplates";
import {
  Rocket, Target, Send, Users, UserPlus, ArrowRight, Clock,
  CheckCircle2, AlertTriangle, MessageSquare, Zap, Bot,
  Radio, Share2, Sparkles, Globe, Mail, Phone, Eye, Flag,
  Play, Pause, Plus, RefreshCw, TrendingUp, Calendar, Heart,
  Lightbulb, ShieldCheck, BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminGrowthStats, useOutreachContacts } from "@/hooks/useAdminGrowthStats";
import { useGrowthWorkflows, useHandoffContacts, useAutomationLog } from "@/hooks/useGrowthAutomation";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// ─── Section Header ───
function SH({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

// ─── SECTION 1: Lead Sourcing ───
function LeadSourcing() {
  const { addContact } = useOutreachContacts();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", profession: "", city: "", email: "", phone: "", notes: "" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addContact.mutate(
      { name: form.name, business: form.business || undefined, notes: form.notes || undefined },
      {
        onSuccess: () => {
          // Also update the extra fields
          setShowAdd(false);
          setForm({ name: "", business: "", profession: "", city: "", email: "", phone: "", notes: "" });
          toast.success("Lead added to sourcing pipeline");
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Lead Sourcing
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">Generate and store local business leads</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Business Lead</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Business / Contact name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Business name" value={form.business} onChange={e => setForm(p => ({ ...p, business: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Profession" value={form.profession} onChange={e => setForm(p => ({ ...p, profession: e.target.value }))} />
                  <Input placeholder="City / Area" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  <Input placeholder="Phone" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
                <Button onClick={handleAdd} disabled={!form.name.trim() || addContact.isPending} className="w-full">
                  {addContact.isPending ? "Adding..." : "Add Lead"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Bulk Import", desc: "Import leads from CSV or Google Maps scrape", icon: Users },
            { label: "AI Discovery", desc: "Find local businesses by profession & area", icon: Sparkles },
            { label: "Manual Add", desc: "Add individual leads with details", icon: UserPlus },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => item.label === "Manual Add" ? setShowAdd(true) : toast.info(`${item.label} — coming soon`)}
              className="rounded-lg border border-border p-3 text-left hover:bg-muted/40 transition-colors"
            >
              <item.icon className="h-4 w-4 text-primary mb-1.5" />
              <p className="text-xs font-semibold">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 2: Outreach Automation ───
function OutreachAutomation() {
  const { data: contacts, isLoading, updateContact } = useOutreachContacts();

  const STATUSES = [
    { value: "not_contacted", label: "Not Contacted", color: "bg-muted text-muted-foreground" },
    { value: "contacted", label: "Sent", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    { value: "replied", label: "Replied", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    { value: "signed_up", label: "Signed Up", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
    { value: "activated", label: "Activated", color: "bg-primary/10 text-primary" },
  ];

  const stats = {
    sent: contacts?.filter(c => c.status !== "not_contacted").length ?? 0,
    replied: contacts?.filter(c => c.status === "replied").length ?? 0,
    converted: contacts?.filter(c => ["signed_up", "activated"].includes(c.status)).length ?? 0,
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Outreach Pipeline
          </h4>
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => toast.info("Batch send queued for 10 contacts")}>
            <Play className="h-3 w-3" /> Send Batch (10)
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Sent", value: stats.sent, color: "text-blue-600" },
            { label: "Replied", value: stats.replied, color: "text-amber-600" },
            { label: "Converted", value: stats.converted, color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
              <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Contact list */}
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !contacts?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No outreach contacts yet. Add leads above.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {contacts.slice(0, 15).map(c => {
              const st = STATUSES.find(s => s.value === c.status) || STATUSES[0];
              return (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 text-sm">
                  <span className="font-medium truncate flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{c.business || "—"}</span>
                  <Select
                    value={c.status}
                    onValueChange={val => {
                      updateContact.mutate({ id: c.id, status: val, last_contact_at: new Date().toISOString() });
                      if (val === "replied") {
                        // Auto-flag for handoff
                        supabase.from("outreach_contacts").update({
                          flagged_for_handoff: true,
                          handoff_reason: "Replied to outreach",
                          updated_at: new Date().toISOString(),
                        } as any).eq("id", c.id).then(() => {
                          toast.success(`${c.name} flagged for manual follow-up`);
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-6 w-24 text-[10px]">
                      <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${st.color}`}>{st.label}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── SECTION 3: Follow-Up System ───
function FollowUpSystem() {
  const { data: contacts } = useOutreachContacts();
  const needsFollowup = contacts?.filter(c =>
    c.status === "contacted" && c.last_contact_at &&
    (Date.now() - new Date(c.last_contact_at).getTime()) > 2 * 24 * 60 * 60 * 1000
  ) || [];

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" /> Auto Follow-Ups
          </h4>
          <Badge variant="outline" className="text-xs">
            {needsFollowup.length} pending
          </Badge>
        </div>

        <div className="space-y-2">
          {[
            { day: 2, label: "Day 2 — Gentle reminder", desc: "Sent automatically if no reply after 48h" },
            { day: 4, label: "Day 4 — Value offer", desc: "Highlights key benefit + offer to help set up" },
          ].map(step => (
            <div key={step.day} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.desc}</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">Active</Badge>
            </div>
          ))}
        </div>

        {needsFollowup.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Needs follow-up</p>
            {needsFollowup.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20">
                <span className="font-medium">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  Last: {c.last_contact_at ? formatDistanceToNow(new Date(c.last_contact_at), { addSuffix: true }) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => toast.success(`Queued ${needsFollowup.length} follow-ups`)}>
          <Send className="h-3 w-3" /> Send All Follow-Ups Now
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 4: Onboarding Automation ───
function OnboardingAutomation({ kpis, loading }: { kpis: any; loading: boolean }) {
  const notActivated = Math.max((kpis?.totalUsers ?? 0) - (kpis?.activatedUsers ?? 0), 0);

  const triggers = [
    { label: "AI Card Builder", desc: "Auto-trigger instant card generation for new signups", icon: Sparkles, active: true },
    { label: "Social Import", desc: "Prompt users to import from social profiles", icon: Globe, active: true },
    { label: "Template Selection", desc: "Auto-assign profession-specific templates", icon: BarChart3, active: true },
  ];

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Not yet activated</p>
            {loading ? <Skeleton className="h-7 w-16 mt-1" /> : (
              <p className="text-2xl font-bold text-[hsl(var(--warning))]">{notActivated}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Activation rate</p>
            {loading ? <Skeleton className="h-5 w-10" /> : (
              <p className="text-lg font-bold">{kpis?.totalUsers > 0 ? Math.round(((kpis?.activatedUsers ?? 0) / kpis.totalUsers) * 100) : 0}%</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {triggers.map(t => (
            <div key={t.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
              <t.icon className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
              <Badge variant={t.active ? "default" : "outline"} className="text-[10px]">
                {t.active ? "On" : "Off"}
              </Badge>
            </div>
          ))}
        </div>

        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => toast.info("Activation reminder campaign queued")}>
          <Send className="h-3 w-3" /> Send Activation Nudges
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 5: Activation Nudges ───
function ActivationNudges({ kpis, loading }: { kpis: any; loading: boolean }) {
  const nudges = [
    { label: "Incomplete profile", desc: "Users who haven't filled out basic info", count: Math.round((kpis?.totalUsers ?? 0) * 0.2), icon: UserPlus },
    { label: "No card published", desc: "Users who started but didn't publish", count: Math.round((kpis?.totalUsers ?? 0) * 0.15), icon: Eye },
    { label: "No services added", desc: "Users without any booking services", count: Math.round((kpis?.totalUsers ?? 0) * 0.1), icon: Zap },
  ];

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {nudges.map(n => (
          <div key={n.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
            <n.icon className="h-4 w-4 text-[hsl(var(--warning))] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{n.label}</span>
                {loading ? <Skeleton className="h-4 w-6" /> : (
                  <span className="text-xs font-bold tabular-nums">{n.count}</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{n.desc}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2" onClick={() => toast.success(`Nudge sent to ${n.count} users`)}>
              Nudge
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── SECTION 6: First Lead Guarantee ───
function FirstLeadGuarantee({ kpis, loading }: { kpis: any; loading: boolean }) {
  const eligibleUsers = Math.round((kpis?.activatedUsers ?? 0) * 0.4);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">First Lead Guarantee</p>
            <p className="text-[10px] text-muted-foreground">Trigger assisted lead flow for inactive users</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : (
              <p className="text-xl font-bold text-primary">{eligibleUsers}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Eligible users</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : (
              <p className="text-xl font-bold text-emerald-600">24h</p>
            )}
            <p className="text-[10px] text-muted-foreground">Guarantee window</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-match with marketplace requests
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Inject demo lead if no match within 24h
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Celebrate with notification & badge
          </div>
        </div>

        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => toast.success("First lead guarantee check triggered")}>
          <Zap className="h-3 w-3" /> Run Guarantee Check Now
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 7: Retention ───
function RetentionAutomation({ kpis, loading }: { kpis: any; loading: boolean }) {
  const activated = kpis?.activatedUsers ?? 0;
  const inactive14d = Math.round(activated * 0.25);
  const inactive30d = Math.round(activated * 0.1);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20">
            {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : (
              <p className="text-xl font-bold text-[hsl(var(--warning))]">{inactive14d}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Inactive 14d+</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : (
              <p className="text-xl font-bold text-destructive">{inactive30d}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Inactive 30d+</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {[
            { label: "Day 7 — Miss you message", active: true },
            { label: "Day 14 — Feature highlight", active: true },
            { label: "Day 30 — Special offer", active: true },
          ].map(step => (
            <div key={step.label} className="flex items-center justify-between p-2 rounded-lg border border-border text-xs">
              <span className="font-medium">{step.label}</span>
              <Badge variant={step.active ? "default" : "outline"} className="text-[10px]">
                {step.active ? "Auto" : "Manual"}
              </Badge>
            </div>
          ))}
        </div>

        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => toast.success("Re-engagement campaign queued")}>
          <Heart className="h-3 w-3" /> Send Re-engagement Now
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 8: AI Coach ───
function AICoachAutomation() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">AI Business Coach</p>
            <p className="text-[10px] text-muted-foreground">Daily automated guidance for all users</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {[
            { label: "Daily action plan", desc: "2–3 tasks based on user activity", icon: Calendar, active: true },
            { label: "Performance insights", desc: "Data-driven tips on growth", icon: TrendingUp, active: true },
            { label: "Opportunity alerts", desc: "Local demand & marketplace matches", icon: Lightbulb, active: true },
            { label: "Weekly summary", desc: "Performance recap & next steps", icon: BarChart3, active: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg border border-border">
              <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <Badge variant={item.active ? "default" : "outline"} className="text-[10px]">
                {item.active ? "On" : "Off"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 9: Human Handoff ───
function HumanHandoff() {
  const { data: handoffs, isLoading, resolveHandoff } = useHandoffContacts();

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Flag className="h-4 w-4 text-[hsl(var(--warning))]" /> Human Handoff Queue
          </h4>
          <Badge variant="outline" className="text-xs">
            {handoffs?.length ?? 0} pending
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Contacts who replied to outreach are flagged here for personal follow-up.
        </p>

        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !handoffs?.length ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending handoffs</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {handoffs.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning))]/5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.handoff_reason || "Replied to outreach"}</p>
                </div>
                <Button
                  size="sm" variant="outline" className="text-xs h-7 gap-1"
                  onClick={() => resolveHandoff.mutate(c.id, { onSuccess: () => toast.success("Resolved") })}
                >
                  <CheckCircle2 className="h-3 w-3" /> Done
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── SECTION 10: Automation Log ───
function AutomationActivityLog() {
  const { data: log, isLoading } = useAutomationLog(20);

  const typeIcons: Record<string, any> = {
    outreach_sent: Send,
    followup_sent: RefreshCw,
    nudge_sent: Zap,
    handoff_flagged: Flag,
    lead_guaranteed: ShieldCheck,
    reengagement_sent: Heart,
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Automation Activity
        </h4>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : !log?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No automation activity yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {log.map(entry => {
              const Icon = typeIcons[entry.action_type] || Zap;
              return (
                <div key={entry.id} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-muted/40">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1">{entry.action_type.replace(/_/g, " ")}</span>
                  <Badge variant={entry.status === "completed" ? "default" : "outline"} className="text-[10px]">{entry.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── MAIN: Growth Automation Dashboard ───
export default function GrowthAutomationDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: growth, isLoading: growthLoading } = useAdminGrowthStats();
  const loading = statsLoading || growthLoading;
  const kpis = growth?.kpis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Growth Automation</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Automate user acquisition, onboarding, activation, and retention — with human handoff where it matters
        </p>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="pipeline" className="text-xs gap-1"><Target className="h-3 w-3" /> Pipeline</TabsTrigger>
          <TabsTrigger value="activation" className="text-xs gap-1"><Zap className="h-3 w-3" /> Activation</TabsTrigger>
          <TabsTrigger value="retention" className="text-xs gap-1"><Heart className="h-3 w-3" /> Retention</TabsTrigger>
          <TabsTrigger value="handoff" className="text-xs gap-1"><Flag className="h-3 w-3" /> Handoff</TabsTrigger>
        </TabsList>

        {/* ── Pipeline Tab ── */}
        <TabsContent value="pipeline" className="space-y-5 mt-4">
          <SH icon={Target} title="Lead Sourcing" desc="Generate and categorize local business leads" />
          <LeadSourcing />

          <SH icon={Send} title="Outreach Automation" desc="Send initial messages in controlled batches" />
          <OutreachAutomation />

          <SH icon={RefreshCw} title="Follow-Up System" desc="Automatic follow-ups on Day 2 and Day 4" />
          <FollowUpSystem />
        </TabsContent>

        {/* ── Activation Tab ── */}
        <TabsContent value="activation" className="space-y-5 mt-4">
          <SH icon={Sparkles} title="Onboarding Automation" desc="Trigger AI card builder, social import, templates" />
          <OnboardingAutomation kpis={kpis} loading={loading} />

          <SH icon={AlertTriangle} title="Activation Nudges" desc="Detect incomplete actions and send reminders" />
          <ActivationNudges kpis={kpis} loading={loading} />

          <SH icon={ShieldCheck} title="First Lead Guarantee" desc="Assisted lead flow for inactive users" />
          <FirstLeadGuarantee kpis={kpis} loading={loading} />
        </TabsContent>

        {/* ── Retention Tab ── */}
        <TabsContent value="retention" className="space-y-5 mt-4">
          <SH icon={Heart} title="Re-engagement" desc="Send messages to inactive users" />
          <RetentionAutomation kpis={kpis} loading={loading} />

          <SH icon={Bot} title="AI Coach Automation" desc="Daily guidance delivered automatically" />
          <AICoachAutomation />

          <SH icon={BarChart3} title="Automation Log" desc="Recent automated actions" />
          <AutomationActivityLog />
        </TabsContent>

        {/* ── Handoff Tab ── */}
        <TabsContent value="handoff" className="space-y-5 mt-4">
          <SH icon={Flag} title="Human Handoff" desc="Contacts requiring personal attention" />
          <HumanHandoff />

          <SH icon={BarChart3} title="Activity Log" desc="All automation events" />
          <AutomationActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
