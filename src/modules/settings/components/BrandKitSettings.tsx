import { useState, useEffect, useRef } from "react";
import { Palette, Upload, Loader2, X, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const FONT_OPTIONS = [
  "DM Sans", "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
  "Poppins", "Raleway", "Playfair Display", "Merriweather",
  "Source Sans 3", "Nunito", "Work Sans", "Outfit", "Space Grotesk",
  "Sora", "Manrope", "Plus Jakarta Sans",
];

function ColorWheel({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 w-12 rounded-full border-2 border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-sm"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export default function BrandKitSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brandKitId, setBrandKitId] = useState<string | null>(null);

  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#1E3A8A");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("brand_kits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBrandKitId(data.id);
          setPrimaryColor(data.primary_color ?? "#3B82F6");
          setSecondaryColor(data.secondary_color ?? "#1E3A8A");
          setFontFamily(data.font_family ?? "Inter");
          setLogoUrl(data.logo_url);
        }
        setLoading(false);
      });
  }, [user]);

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/brand-logo-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("card-assets")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("card-assets")
        .getPublicUrl(path);

      setLogoUrl(urlData.publicUrl);
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        font_family: fontFamily,
        logo_url: logoUrl,
      };

      if (brandKitId) {
        const { error } = await supabase
          .from("brand_kits")
          .update(payload)
          .eq("id", brandKitId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("brand_kits")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setBrandKitId(data.id);
      }

      queryClient.invalidateQueries({ queryKey: ["brand-kit"] });
      toast.success("Brand kit saved!");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-6"
    >
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Brand Kit</h2>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ColorWheel value={primaryColor} onChange={setPrimaryColor} label="Primary Color" />
        <ColorWheel value={secondaryColor} onChange={setSecondaryColor} label="Secondary Color" />
      </div>

      {/* Font */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5" /> Font Family
        </Label>
        <Select value={fontFamily} onValueChange={setFontFamily}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((f) => (
              <SelectItem key={f} value={f}>
                <span style={{ fontFamily: f }}>{f}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Preview: <span style={{ fontFamily }} className="font-medium">The quick brown fox jumps over the lazy dog</span>
        </p>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Logo
        </Label>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoUpload(file);
          }}
        />
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              <img src={logoUrl} alt="Brand logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Replace"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload Logo
          </Button>
        )}
        <p className="text-xs text-muted-foreground">PNG or SVG recommended. Max 2 MB.</p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="shadow-glow">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Brand Kit
      </Button>
    </motion.div>
  );
}
