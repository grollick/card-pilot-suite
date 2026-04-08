import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "beside-name" | "beside-name-right";
export type LogoSize = "small" | "medium" | "large" | "xl" | "xxl";
export type LogoVerticalAlign = "top" | "center" | "bottom";

interface LogoUploaderProps {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  logoFrostedBg?: boolean;
  onLogoFrostedBgChange?: (val: boolean) => void;
  logoGlow?: boolean;
  onLogoGlowChange?: (val: boolean) => void;
  logoPosition?: LogoPosition;
  onLogoPositionChange?: (pos: LogoPosition) => void;
  logoSize?: LogoSize;
  onLogoSizeChange?: (size: LogoSize) => void;
  logoOpacity?: number;
  onLogoOpacityChange?: (val: number) => void;
  logoPadding?: number;
  onLogoPaddingChange?: (val: number) => void;
  logoNameGap?: number;
  onLogoNameGapChange?: (val: number) => void;
  logoVerticalAlign?: LogoVerticalAlign;
  onLogoVerticalAlignChange?: (val: LogoVerticalAlign) => void;
}

const POSITIONS: { value: LogoPosition; label: string }[] = [
  { value: "top-left", label: "↖" },
  { value: "top-right", label: "↗" },
  { value: "bottom-left", label: "↙" },
  { value: "bottom-right", label: "↘" },
  { value: "beside-name", label: "≡←" },
  { value: "beside-name-right", label: "→≡" },
];

const SIZES: { value: LogoSize; label: string }[] = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
];

export default function LogoUploader({
  logoUrl,
  onLogoChange,
  logoFrostedBg = true,
  onLogoFrostedBgChange,
  logoGlow = false,
  onLogoGlowChange,
  logoPosition = "top-right",
  onLogoPositionChange,
  logoSize = "medium",
  onLogoSizeChange,
  logoOpacity = 100,
  onLogoOpacityChange,
  logoPadding = 4,
  onLogoPaddingChange,
  logoNameGap = 8,
  onLogoNameGapChange,
  logoVerticalAlign = "center",
  onLogoVerticalAlignChange,
}: LogoUploaderProps) {
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
        <div className="space-y-3">
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

          {/* Position selector */}
          {onLogoPositionChange && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Position</span>
              <div className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => onLogoPositionChange(p.value)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                      logoPosition === p.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={p.value}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {onLogoSizeChange && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Size</span>
              <div className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onLogoSizeChange(s.value)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                      logoSize === s.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={s.value}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opacity slider */}
          {onLogoOpacityChange && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Opacity</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{logoOpacity}%</span>
              </div>
              <Slider
                value={[logoOpacity]}
                onValueChange={([v]) => onLogoOpacityChange(v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          )}
          {/* Padding slider */}
          {onLogoPaddingChange && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Padding</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{logoPadding}px</span>
              </div>
              <Slider
                value={[logoPadding]}
                onValueChange={([v]) => onLogoPaddingChange(v)}
                min={0}
                max={24}
                step={1}
              />
            </div>
          )}
          {/* Name gap slider — only for beside-name positions */}
          {onLogoNameGapChange && (logoPosition === "beside-name" || logoPosition === "beside-name-right") && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Name spacing</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{logoNameGap ?? 8}px</span>
              </div>
              <Slider
                value={[logoNameGap ?? 8]}
                onValueChange={([v]) => onLogoNameGapChange(v)}
                min={0}
                max={32}
                step={2}
              />
            </div>
          )}
          {/* Vertical alignment — only for beside-name positions */}
          {onLogoVerticalAlignChange && (logoPosition === "beside-name" || logoPosition === "beside-name-right") && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Vertical align</span>
              <div className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
                {([
                  { value: "top" as const, label: "↑" },
                  { value: "center" as const, label: "—" },
                  { value: "bottom" as const, label: "↓" },
                ] as const).map((a) => (
                  <button
                    key={a.value}
                    onClick={() => onLogoVerticalAlignChange(a.value)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                      logoVerticalAlign === a.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={a.value}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {onLogoFrostedBgChange && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Frosted background</span>
              <Switch checked={logoFrostedBg} onCheckedChange={onLogoFrostedBgChange} />
            </div>
          )}
          {onLogoGlowChange && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Glow effect</span>
              <Switch checked={logoGlow} onCheckedChange={onLogoGlowChange} />
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
