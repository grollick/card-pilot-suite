import { useState, useEffect } from "react";
import { Store, MapPin, Eye, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface MarketplaceSettingsProps {
  profile: any;
}

export default function MarketplaceSettings({ profile }: MarketplaceSettingsProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [serviceArea, setServiceArea] = useState("");

  useEffect(() => {
    if (!profile) return;
    setEnabled(profile.marketplace_enabled ?? false);
    setServiceArea(profile.service_area ?? "");
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          marketplace_enabled: enabled,
          service_area: serviceArea.trim() || null,
        } as any)
        .eq("id", profile.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("Marketplace settings saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Marketplace Presence</h2>
        </div>
        {profile?.featured && (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Crown className="h-3 w-3 mr-1" /> Featured
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Control how your business appears on the guzzl.pro Discover marketplace. When enabled, potential customers can find and contact you.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Show on Marketplace
            </Label>
            <p className="text-xs text-muted-foreground">
              Allow people to discover your business on /discover
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-area" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Service Area
          </Label>
          <Input
            id="service-area"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="e.g. Toronto, GTA, Southern Ontario"
          />
          <p className="text-xs text-muted-foreground">
            Describe the area you serve. This helps customers find you by location.
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="shadow-glow">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Marketplace Settings
      </Button>
    </motion.div>
  );
}
