import { Settings as SettingsIcon, User, Palette, Bell, RotateCw, Loader2, Mail, Clock, CheckCircle, AlertTriangle, Clock3, TrendingUp, Send, Plus, Trash2, GripVertical } from "lucide-react";
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

  // Seed form when profile loads
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setHandle(profile.handle ?? "");
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setCompany(profile.company ?? "");
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
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="settings-company">Company</Label>
                    <Input id="settings-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" />
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

// ── Follow-Up Settings Component ──
function FollowUpSettings({ profile, queryClient }: { profile: any; queryClient: any }) {
  const [enabled, setEnabled] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(120);
  const [subject, setSubject] = useState("Thanks for connecting, {{name}}!");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setEnabled((profile as any).followup_enabled ?? false);
    setDelayMinutes((profile as any).followup_delay_minutes ?? 120);
    setSubject((profile as any).followup_subject ?? "Thanks for connecting, {{name}}!");
    setBody((profile as any).followup_body ?? "");
  }, [profile]);

  const delayOptions = [
    { label: "30 min", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "2 hours", value: 120 },
    { label: "4 hours", value: 240 },
    { label: "24 hours", value: 1440 },
  ];

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          followup_enabled: enabled,
          followup_delay_minutes: delayMinutes,
          followup_subject: subject,
          followup_body: body,
        } as any)
        .eq("id", profile.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Follow-up settings saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Auto Follow-Up Emails</h2>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <p className="text-sm text-muted-foreground">
        Automatically send a personalized follow-up email after someone submits the contact form on your card.
      </p>

      {enabled && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Delay before sending
            </Label>
            <div className="flex flex-wrap gap-2">
              {delayOptions.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={delayMinutes === opt.value ? "default" : "outline"}
                  onClick={() => setDelayMinutes(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Thanks for connecting, {{name}}!"
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> and <code className="bg-muted px-1 rounded">{"{{first_name}}"}</code> for personalization.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Email Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Hi {{name}},&#10;&#10;Thanks for reaching out!..."
            />
          </div>
        </div>
      )}

      <Button className="shadow-glow" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Follow-Up Settings
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