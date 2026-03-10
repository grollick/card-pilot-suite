import { useState, useEffect } from "react";
import { Palette, Globe, Mail, Type, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrg } from "@/contexts/OrgContext";
import { useQueryClient } from "@tanstack/react-query";

export default function WhiteLabelSettings() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [poweredBy, setPoweredBy] = useState("");
  const [brandColor, setBrandColor] = useState("#4361ee");

  useEffect(() => {
    if (!currentOrg) return;
    // Fetch extended org data
    supabase
      .from("organizations")
      .select("white_label_enabled, custom_domain, custom_email_from, powered_by_text, brand_color" as any)
      .eq("id", currentOrg.id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setEnabled(data.white_label_enabled ?? false);
          setCustomDomain(data.custom_domain ?? "");
          setEmailFrom(data.custom_email_from ?? "");
          setPoweredBy(data.powered_by_text ?? "");
          setBrandColor(data.brand_color ?? "#4361ee");
        }
      });
  }, [currentOrg?.id]);

  const handleSave = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          white_label_enabled: enabled,
          custom_domain: customDomain.trim() || null,
          custom_email_from: emailFrom.trim() || null,
          powered_by_text: poweredBy.trim() || null,
          brand_color: brandColor || null,
        } as any)
        .eq("id", currentOrg.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["client-workspaces"] });
      toast.success("White-label settings saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrg) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">White Label Settings</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Customize branding for <strong>{currentOrg.name}</strong>. Replace CardPilot branding with your own.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Enable White Label</Label>
            <p className="text-xs text-muted-foreground">Remove all CardPilot branding from this workspace</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Custom Domain
              </Label>
              <Input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="cards.youragency.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email From Address
              </Label>
              <Input
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                placeholder="noreply@youragency.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> Custom "Powered By" Text
              </Label>
              <Input
                value={poweredBy}
                onChange={(e) => setPoweredBy(e.target.value)}
                placeholder="Powered by Your Agency Name"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to completely remove the footer badge.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Brand Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="shadow-glow">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save White Label Settings
      </Button>
    </motion.div>
  );
}
