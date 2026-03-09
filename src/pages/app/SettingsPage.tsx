import { Settings as SettingsIcon, User, Palette, Bell, RotateCw, Loader2, Mail, Clock } from "lucide-react";
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

        <TabsContent value="notifications" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Notification Preferences</h2>
            </div>
            <p className="text-sm text-muted-foreground">Notification settings will be available once backend is connected.</p>
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