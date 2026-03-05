import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LogoUploaderProps {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  logoFrostedBg?: boolean;
  onLogoFrostedBgChange?: (val: boolean) => void;
}

export default function LogoUploader({ logoUrl, onLogoChange, logoFrostedBg = true, onLogoFrostedBgChange }: LogoUploaderProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo.${ext}`;
      const { error } = await supabase.storage
        .from("card-assets")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("card-assets").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      onLogoChange(url);
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      <Label className="text-xs text-muted-foreground">Logo</Label>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {logoUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Change"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onLogoChange(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {onLogoFrostedBgChange && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Frosted background</span>
              <Switch checked={logoFrostedBg} onCheckedChange={onLogoFrostedBgChange} />
            </div>
          )}
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
          Upload Logo
        </Button>
      )}
    </div>
  );
}
