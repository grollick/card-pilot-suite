import { Settings as SettingsIcon, User, Palette, Bell, RotateCw, Loader2, Mail, Clock, CheckCircle, AlertTriangle, Clock3, TrendingUp, Send, Plus, Trash2, GripVertical, Store, Download } from "lucide-react";
import MarketplaceSettings from "@/modules/settings/components/MarketplaceSettings";
import DataExportSection from "@/modules/settings/components/DataExportSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useCard";
import { useQueryClient } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [showReOnboard, setShowReOnboard] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  // Seed form when profile loads
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setHandle(profile.handle ?? "");
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setCompany(profile.company ?? "");
    setCity((profile as any).city ?? "");
    setBio((profile as any).bio ?? "");
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!handle.trim()) {
      toast.error("Handle is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          handle: handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null,
          city: city.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", profile.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="brand">Brand Kit</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-6 space-y-5">

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-2xl">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
                    <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{name || "Your Name"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {profile?.professions?.name ?? "No profession set"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">Full Name</Label>
                    <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-handle">Handle</Label>
                    <Input id="settings-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourhandle" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-email">Email</Label>
                    <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-phone">Phone</Label>
                    <Input id="settings-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-company">Company</Label>
                    <Input id="settings-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-city">City</Label>
                    <Input id="settings-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toronto, ON" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="settings-bio">Bio</Label>
                    <Textarea id="settings-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio about you and your business…" rows={3} />
                  </div>
                </div>

                <Button className="shadow-glow" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </>
            )}
          </motion.div>

          {/* Re-onboard section */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Change Profession</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Re-run the setup wizard to change your profession, style pack, and regenerate default templates. Your existing contacts and custom data will be preserved.
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowReOnboard(true)}>
              <RotateCw className="h-4 w-4 mr-2" />
              Re-run Setup Wizard
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-4">
          <MarketplaceSettings profile={profile} />
        </TabsContent>

        <TabsContent value="brand" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Brand Kit</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary border border-border" />
                  <Input defaultValue="#4361ee" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-secondary border border-border" />
                  <Input defaultValue="#f0f1f5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Input defaultValue="DM Sans" />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <Button variant="outline" size="sm">Upload Logo</Button>
              </div>
            </div>
            <Button className="shadow-glow">Save Brand Kit</Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <FollowUpAnalytics userId={profile?.id} />
          <FollowUpSettings profile={profile} queryClient={queryClient} />

          <DailyReportToggle profile={profile} queryClient={queryClient} />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Other Notifications</h2>
            </div>
            <p className="text-sm text-muted-foreground">Additional notification preferences coming soon.</p>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Confirmation dialog */}
      <AlertDialog open={showReOnboard} onOpenChange={setShowReOnboard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-run Setup Wizard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will take you through the onboarding flow again. You can change your profession, style pack, and CTA. Your existing pipeline stages, booking services, and email templates will be replaced with the new profession's defaults. Contacts and custom card content are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/onboarding")}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Follow-Up Sequence Builder ──
interface SequenceStep {
  id?: string;
  step_number: number;
  delay_minutes: number;
  subject: string;
  body: string;
  enabled: boolean;
}

const DEFAULT_STEPS: SequenceStep[] = [
  { step_number: 1, delay_minutes: 120, subject: "Thanks for connecting, {{name}}!", body: "Hi {{name}},\n\nThanks for reaching out! I wanted to follow up personally and let you know I received your information.\n\nI'd love to chat more about how I can help. Feel free to reply to this email or book a time on my calendar.\n\nLooking forward to connecting!", enabled: true },
  { step_number: 2, delay_minutes: 1440, subject: "Quick follow-up, {{first_name}}", body: "Hi {{first_name}},\n\nJust checking in — I wanted to make sure you received my previous message.\n\nIf you have any questions or would like to discuss further, I'm here to help!\n\nBest regards", enabled: true },
  { step_number: 3, delay_minutes: 4320, subject: "One last thing, {{first_name}}", body: "Hi {{first_name}},\n\nI know things get busy, so I wanted to reach out one more time.\n\nIf now isn't the right time, no worries at all. But if you'd like to connect, just reply to this email — I'd love to hear from you.\n\nAll the best!", enabled: false },
];

const DELAY_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "2 hrs", value: 120 },
  { label: "4 hrs", value: 240 },
  { label: "12 hrs", value: 720 },
  { label: "24 hrs", value: 1440 },
  { label: "3 days", value: 4320 },
  { label: "7 days", value: 10080 },
];

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr${minutes >= 120 ? "s" : ""}`;
  const days = Math.round(minutes / 1440);
  return `${days} day${days > 1 ? "s" : ""}`;
}

function FollowUpSettings({ profile, queryClient }: { profile: any; queryClient: any }) {
  const [enabled, setEnabled] = useState(false);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Load steps from DB or defaults
  useEffect(() => {
    if (!profile) return;
    setEnabled((profile as any).followup_enabled ?? false);

    const loadSteps = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("followup_steps")
        .select("*")
        .eq("user_id", profile.id)
        .order("step_number", { ascending: true });

      if (data && data.length > 0) {
        setSteps(data.map((s: any) => ({
          id: s.id,
          step_number: s.step_number,
          delay_minutes: s.delay_minutes,
          subject: s.subject,
          body: s.body,
          enabled: s.enabled,
        })));
      } else {
        setSteps(DEFAULT_STEPS);
      }
      setLoading(false);
    };
    loadSteps();
  }, [profile]);

  const updateStep = (index: number, updates: Partial<SequenceStep>) => {
    setSteps((prev) => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const addStep = () => {
    const nextNum = steps.length + 1;
    const lastDelay = steps.length > 0 ? steps[steps.length - 1].delay_minutes : 120;
    setSteps((prev) => [
      ...prev,
      {
        step_number: nextNum,
        delay_minutes: lastDelay * 2,
        subject: `Follow-up #${nextNum}, {{first_name}}`,
        body: `Hi {{first_name}},\n\nJust following up on my previous message. Would love to connect!\n\nBest regards`,
        enabled: true,
      },
    ]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      // Update profile enabled flag
      await supabase
        .from("profiles")
        .update({ followup_enabled: enabled } as any)
        .eq("id", profile.id);

      // Delete existing steps and re-insert
      await supabase
        .from("followup_steps")
        .delete()
        .eq("user_id", profile.id);

      if (steps.length > 0) {
        const rows = steps.map((s, i) => ({
          user_id: profile.id,
          step_number: i + 1,
          delay_minutes: s.delay_minutes,
          subject: s.subject,
          body: s.body,
          enabled: s.enabled,
        }));
        const { error } = await supabase
          .from("followup_steps")
          .insert(rows as any);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Follow-up sequence saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    // Immediately persist the toggle
    await supabase
      .from("profiles")
      .update({ followup_enabled: val } as any)
      .eq("id", profile?.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Auto Follow-Up Sequence</h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>
      <p className="text-sm text-muted-foreground">
        Build a multi-step email sequence that sends automatically after someone submits the contact form on your card.
      </p>

      {enabled && (
        loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {/* Sequence timeline */}
            {steps.map((step, index) => {
              const isExpanded = expandedStep === index;
              return (
                <div key={index} className={`relative rounded-lg border transition-colors ${step.enabled ? "border-border bg-background" : "border-border/50 bg-muted/30 opacity-60"}`}>
                  {/* Step header */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandedStep(isExpanded ? null : index)}
                  >
                    {/* Timeline dot */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{step.subject || `Step ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Send after {formatDelay(step.delay_minutes)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={step.enabled}
                        onCheckedChange={(val) => { updateStep(index, { enabled: val }); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {steps.length > 1 && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeStep(index); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded editor */}
                  {isExpanded && (
                    <div className="px-3 pb-4 space-y-3 border-t border-border pt-3">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          Delay after form submission
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {DELAY_PRESETS.map((opt) => (
                            <Button
                              key={opt.value}
                              size="sm"
                              variant={step.delay_minutes === opt.value ? "default" : "outline"}
                              className="h-7 text-xs"
                              onClick={() => updateStep(index, { delay_minutes: opt.value })}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Subject</Label>
                        <Input
                          value={step.subject}
                          onChange={(e) => updateStep(index, { subject: e.target.value })}
                          placeholder="Email subject..."
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Body</Label>
                        <Textarea
                          value={step.body}
                          onChange={(e) => updateStep(index, { body: e.target.value })}
                          rows={5}
                          className="text-sm"
                          placeholder="Hi {{name}}..."
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Variables: <code className="bg-muted px-1 rounded">{"{{name}}"}</code> <code className="bg-muted px-1 rounded">{"{{first_name}}"}</code> <code className="bg-muted px-1 rounded">{"{{sender_name}}"}</code>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="absolute -bottom-3 left-[22px] w-px h-3 bg-border z-10" />
                  )}
                </div>
              );
            })}

            {/* Add step */}
            {steps.length < 5 && (
              <Button variant="outline" size="sm" className="w-full" onClick={addStep}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Step
              </Button>
            )}
          </div>
        )
      )}

      <Button className="shadow-glow" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Sequence
      </Button>
    </motion.div>
  );
}

// ── Follow-Up Analytics Component ──
function FollowUpAnalytics({ userId }: { userId?: string }) {
  const [stats, setStats] = useState<{ sent: number; pending: number; failed: number; skipped: number } | null>(null);
  const [dailyData, setDailyData] = useState<{ date: string; sent: number; failed: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      setLoading(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("scheduled_followups")
        .select("status, sent_at, created_at")
        .eq("user_id", userId);

      if (!error && data) {
        const counts = { sent: 0, pending: 0, failed: 0, skipped: 0 };
        const dayMap: Record<string, { sent: number; failed: number }> = {};

        // Pre-fill last 30 days
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          dayMap[key] = { sent: 0, failed: 0 };
        }

        data.forEach((row: any) => {
          if (row.status === "sent") counts.sent++;
          else if (row.status === "pending") counts.pending++;
          else if (row.status === "failed") counts.failed++;
          else if (row.status === "skipped") counts.skipped++;

          // Aggregate daily for sent/failed
          if (row.status === "sent" || row.status === "failed") {
            const dateStr = (row.sent_at || row.created_at || "").slice(0, 10);
            if (dayMap[dateStr]) {
              dayMap[dateStr][row.status as "sent" | "failed"]++;
            }
          }
        });

        setStats(counts);
        setDailyData(
          Object.entries(dayMap).map(([date, vals]) => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            ...vals,
          }))
        );
      }
      setLoading(false);
    };
    fetchStats();
  }, [userId]);

  const total = stats ? stats.sent + stats.failed : 0;
  const successRate = total > 0 ? Math.round((stats!.sent / total) * 100) : 0;
  const hasData = stats && (stats.sent > 0 || stats.pending > 0 || stats.failed > 0);

  const kpis = stats
    ? [
        { label: "Sent", value: stats.sent, icon: CheckCircle, color: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10" },
        { label: "Pending", value: stats.pending, icon: Clock3, color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10" },
        { label: "Failed", value: stats.failed, icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
        { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "text-primary bg-primary/10" },
      ]
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Follow-Up Analytics</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !hasData ? (
        <div className="text-center py-6">
          <Send className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No follow-up emails yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Enable auto follow-ups below to get started.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-border bg-background p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Daily trend chart */}
          <div className="pt-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Daily Trend (Last 30 Days)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke="hsl(var(--success))" fill="url(#sentGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke="hsl(var(--destructive))" fill="url(#failedGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── Daily Report Toggle ──
function DailyReportToggle({ profile, queryClient }: { profile: any; queryClient: any }) {
  const [enabled, setEnabled] = useState(profile?.daily_report_enabled ?? false);

  useEffect(() => {
    if (profile) setEnabled(profile.daily_report_enabled ?? false);
  }, [profile]);

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    await supabase
      .from("profiles")
      .update({ daily_report_enabled: val } as any)
      .eq("id", profile?.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(val ? "Daily report enabled" : "Daily report disabled");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Daily Business Report</h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>
      <p className="text-sm text-muted-foreground">
        Receive a daily email summary with your card views, new leads, bookings, and estimated revenue.
      </p>
    </motion.div>
  );
}