import { useState, useRef, useCallback } from "react";
import { Camera, Eraser, ImagePlus, Loader2, RotateCw, Wand2, Paintbrush, Sparkles, FlipHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import CoverPositioner from "./CoverPositioner";
import LogoUploader from "./LogoUploader";
import ImageCropDialog from "./ImageCropDialog";

const BG_PRESETS = [
  { label: "None", value: "transparent" },
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#000000" },
  { label: "Soft Gray", value: "#F3F4F6" },
  { label: "Sky", value: "#DBEAFE" },
  { label: "Mint", value: "#D1FAE5" },
  { label: "Peach", value: "#FEF3C7" },
  { label: "Lavender", value: "#EDE9FE" },
];

interface CardPhotoToolsProps {
  avatarUrl: string | null | undefined;
  coverUrl: string | null | undefined;
  profession: string;
  onAvatarChange: (url: string) => void;
  onCoverChange: (url: string) => void;
  avatarBgColor?: string;
  avatarRotation?: number;
  onAvatarBgColorChange?: (color: string) => void;
  onAvatarRotationChange?: (deg: number) => void;
  coverOffsetY?: number;
  onCoverOffsetYChange?: (y: number) => void;
  coverFlipX?: boolean;
  onCoverFlipXChange?: (flip: boolean) => void;
  coverHeight?: number;
  onCoverHeightChange?: (h: number) => void;
  logoUrl?: string | null;
  onLogoChange?: (url: string | null) => void;
  logoFrostedBg?: boolean;
  onLogoFrostedBgChange?: (val: boolean) => void;
  logoGlow?: boolean;
  onLogoGlowChange?: (val: boolean) => void;
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "beside-name" | "beside-name-right";
  onLogoPositionChange?: (pos: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "beside-name" | "beside-name-right") => void;
  logoSize?: "small" | "medium" | "large" | "xl" | "xxl";
  onLogoSizeChange?: (size: "small" | "medium" | "large" | "xl" | "xxl") => void;
  logoOpacity?: number;
  onLogoOpacityChange?: (val: number) => void;
  logoPadding?: number;
  onLogoPaddingChange?: (val: number) => void;
  logoNameGap?: number;
  onLogoNameGapChange?: (val: number) => void;
  logoVerticalAlign?: "top" | "center" | "bottom";
  onLogoVerticalAlignChange?: (val: "top" | "center" | "bottom") => void;
  avatarShape?: "circle" | "rounded" | "square";
  onAvatarShapeChange?: (shape: "circle" | "rounded" | "square") => void;
  avatarBorderWidth?: number;
  onAvatarBorderWidthChange?: (val: number) => void;
  avatarSize?: number;
  onAvatarSizeChange?: (val: number) => void;
  avatarBannerText?: string;
  onAvatarBannerTextChange?: (val: string) => void;
  avatarBannerBg?: string;
  onAvatarBannerBgChange?: (val: string) => void;
  avatarBannerPosition?: "top" | "bottom";
  onAvatarBannerPositionChange?: (val: "top" | "bottom") => void;
  avatarBannerAnimation?: "none" | "pulse" | "bounce" | "shimmer";
  onAvatarBannerAnimationChange?: (val: "none" | "pulse" | "bounce" | "shimmer") => void;
}

export default function CardPhotoTools({
  avatarUrl,
  coverUrl,
  profession,
  onAvatarChange,
  onCoverChange,
  avatarBgColor = "transparent",
  avatarRotation = 0,
  onAvatarBgColorChange,
  onAvatarRotationChange,
  coverOffsetY = 0,
  onCoverOffsetYChange,
  coverFlipX = false,
  onCoverFlipXChange,
  coverHeight = 144,
  onCoverHeightChange,
  logoUrl = null,
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
  avatarShape = "circle",
  onAvatarShapeChange,
  avatarBorderWidth = 3,
  onAvatarBorderWidthChange,
  avatarSize = 80,
  onAvatarSizeChange,
  avatarBannerText = "",
  onAvatarBannerTextChange,
  avatarBannerBg = "",
  onAvatarBannerBgChange,
  avatarBannerPosition = "bottom",
  onAvatarBannerPositionChange,
  avatarBannerAnimation = "none",
  onAvatarBannerAnimationChange,
}: CardPhotoToolsProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [generatingBackdrop, setGeneratingBackdrop] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [bgRemoved, setBgRemoved] = useState(false);
  const [cartoonizing, setCartoonizing] = useState(false);
  const [cartoonStyle, setCartoonStyle] = useState<string>("cartoon");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverCameraInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from("card-assets")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("card-assets").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const base64ToFile = async (value: string, filename: string): Promise<File> => {
    if (value.startsWith("data:")) {
      const [header, data] = value.split(",", 2);
      if (!header || !data) throw new Error("Invalid image payload");

      const mimeMatch = header.match(/data:(.*?);base64/i);
      const mimeType = mimeMatch?.[1] || "image/png";
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return new File([bytes], filename, { type: mimeType });
    }

    const res = await fetch(value);
    if (!res.ok) throw new Error("Failed to download generated image");
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/png" });
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset inputs so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleCroppedUpload = useCallback(async (blob: Blob) => {
    setCropSrc(null);
    if (!user) return;
    setUploading(true);
    try {
      const file = new File([blob], "avatar.png", { type: "image/png" });
      const path = `${user.id}/avatar.png`;
      const url = await uploadFile(file, path);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      onAvatarChange(url);
      setBgRemoved(false);
      onAvatarRotationChange?.(0);
      toast.success("Photo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }, [user, onAvatarChange, onAvatarRotationChange]);

  const handleCoverSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    if (coverCameraInputRef.current) coverCameraInputRef.current.value = "";
  };

  const handleCroppedCoverUpload = useCallback(async (blob: Blob) => {
    setCoverCropSrc(null);
    if (!user) return;
    setUploading(true);
    try {
      const file = new File([blob], "cover.png", { type: "image/png" });
      const path = `${user.id}/cover.png`;
      const url = await uploadFile(file, path);
      onCoverChange(url);
      toast.success("Cover photo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cover");
    } finally {
      setUploading(false);
    }
  }, [user, onCoverChange]);

  const handleRemoveBackground = async () => {
    if (!avatarUrl || !user) return;
    setRemovingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { image_url: avatarUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const imageUrl = data.image_url;
      if (!imageUrl) throw new Error("No image returned");
      const file = await base64ToFile(imageUrl, "avatar-nobg.png");
      const path = `${user.id}/avatar-nobg.png`;
      const url = await uploadFile(file, path);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      onAvatarChange(url);
      onAvatarRotationChange?.(0);
      setBgRemoved(true);
      toast.success("Background removed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove background");
    } finally {
      setRemovingBg(false);
    }
  };

  const handleGenerateBackdrop = async (useCustom: boolean) => {
    if (!user) return;
    setGeneratingBackdrop(true);
    try {
      const body: Record<string, string> = {};
      if (useCustom && customPrompt.trim()) {
        body.custom_prompt = customPrompt.trim();
      } else {
        body.profession = profession;
      }
      const { data, error } = await supabase.functions.invoke("generate-backdrop", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const imageUrl = data.image_url;
      if (!imageUrl) throw new Error("No image returned");
      const file = await base64ToFile(imageUrl, "backdrop.png");
      const path = `${user.id}/backdrop.png`;
      const url = await uploadFile(file, path);
      onCoverChange(url);
      toast.success("Backdrop generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate backdrop");
    } finally {
      setGeneratingBackdrop(false);
    }
  };

  const handleRotate90 = () => {
    const next = ((avatarRotation || 0) + 90) % 360;
    onAvatarRotationChange?.(next);
  };

  const handleCartoonize = async () => {
    if (!avatarUrl || !user) return;
    setCartoonizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("cartoonize-avatar", {
        body: { image_url: avatarUrl, style: cartoonStyle },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const imageUrl = data.image_url;
      if (!imageUrl) throw new Error("No image returned");
      const file = await base64ToFile(imageUrl, "avatar-cartoon.png");
      const path = `${user.id}/avatar-cartoon.png`;
      const url = await uploadFile(file, path);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      onAvatarChange(url);
      onAvatarRotationChange?.(0);
      toast.success("Avatar cartoonized!");
    } catch (err: any) {
      toast.error(err.message || "Failed to cartoonize avatar");
    } finally {
      setCartoonizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Photo & Backdrop</h2>
      </div>

      {/* Upload / Take Profile Photo */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Profile Photo</Label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoSelected} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
            {avatarUrl ? "Change" : "Upload"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Remove Background + Rotation */}
      {avatarUrl && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleRemoveBackground} disabled={removingBg}>
              {removingBg ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eraser className="h-4 w-4 mr-2" />}
              {removingBg ? "Removing…" : "Remove BG"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate90} title="Rotate 90°">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Cartoonize Avatar */}
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              AI Art Style
            </Label>
            <div className="flex flex-wrap gap-1">
              {([
                { value: "cartoon", label: "Cartoon" },
                { value: "anime", label: "Anime" },
                { value: "pixar", label: "3D/Pixar" },
                { value: "comic", label: "Comic" },
                { value: "watercolor", label: "Watercolor" },
              ] as const).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setCartoonStyle(s.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    cartoonStyle === s.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCartoonize}
              disabled={cartoonizing}
            >
              {cartoonizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {cartoonizing ? "Generating…" : `Apply ${cartoonStyle.charAt(0).toUpperCase() + cartoonStyle.slice(1)} Style`}
            </Button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Rotation</Label>
              <span className="text-xs text-muted-foreground">{avatarRotation}°</span>
            </div>
            <Slider
              min={0}
              max={359}
              step={1}
              value={[avatarRotation]}
              onValueChange={([v]) => onAvatarRotationChange?.(v)}
              className="w-full"
            />
          </div>

          {/* Avatar Border Width */}
          {onAvatarBorderWidthChange && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Border Thickness — {avatarBorderWidth}px</Label>
              <Slider
                min={0}
                max={8}
                step={1}
                value={[avatarBorderWidth]}
                onValueChange={([v]) => onAvatarBorderWidthChange(v)}
                className="w-full"
              />
            </div>
          )}

          {/* Avatar Size */}
          {onAvatarSizeChange && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Photo Size</Label>
              <div className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
                {([
                  { label: "S", value: 56 },
                  { label: "M", value: 80 },
                  { label: "L", value: 112 },
                  { label: "XL", value: 160 },
                ] as const).map((s) => (
                  <button
                    key={s.label}
                    onClick={() => onAvatarSizeChange(s.value)}
                    className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                      avatarSize === s.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  min={40}
                  max={200}
                  step={2}
                  value={[avatarSize]}
                  onValueChange={([v]) => onAvatarSizeChange(v)}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{avatarSize}px</span>
              </div>
            </div>
          )}

          {/* Avatar Shape */}
          {onAvatarShapeChange && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Photo Shape</Label>
              <div className="flex gap-1.5">
                {([
                  { value: "circle", label: "Circle" },
                  { value: "rounded", label: "Rounded" },
                  { value: "square", label: "Square" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onAvatarShapeChange(opt.value)}
                    className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      avatarShape === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Avatar Title Banner */}
          {onAvatarBannerTextChange && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title Banner</Label>
              <Input
                value={avatarBannerText}
                onChange={(e) => onAvatarBannerTextChange(e.target.value)}
                placeholder="e.g. CEO, Founder, Available"
                className="text-xs h-8"
                maxLength={20}
              />
              {avatarBannerText && (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    {onAvatarBannerBgChange && (
                      <>
                        <input
                          type="color"
                          value={avatarBannerBg || "#4361ee"}
                          onChange={(e) => onAvatarBannerBgChange(e.target.value)}
                          className="h-7 w-7 rounded cursor-pointer border border-border"
                        />
                        <span className="text-[10px] text-muted-foreground">Color</span>
                      </>
                    )}
                    {onAvatarBannerPositionChange && (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => onAvatarBannerPositionChange("top")}
                          className={`text-[10px] px-2 py-0.5 rounded-l border border-border ${avatarBannerPosition === "top" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          Top
                        </button>
                        <button
                          type="button"
                          onClick={() => onAvatarBannerPositionChange("bottom")}
                          className={`text-[10px] px-2 py-0.5 rounded-r border border-l-0 border-border ${avatarBannerPosition === "bottom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          Bottom
                        </button>
                      </div>
                    )}
                  </div>
                  {onAvatarBannerAnimationChange && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-muted-foreground mr-1">Effect</span>
                      {(["none", "pulse", "bounce", "shimmer"] as const).map((anim) => (
                        <button
                          key={anim}
                          type="button"
                          onClick={() => onAvatarBannerAnimationChange(anim)}
                          className={`text-[10px] px-2 py-0.5 border border-border capitalize ${
                            avatarBannerAnimation === anim ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          } ${anim === "none" ? "rounded-l" : ""} ${anim === "shimmer" ? "rounded-r" : ""} ${anim !== "none" ? "border-l-0" : ""}`}
                        >
                          {anim === "none" ? "Off" : anim}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Background Color Picker (shown after BG removal or always available) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Paintbrush className="h-3 w-3" />
              Photo Background
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {BG_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={`h-7 w-7 rounded-md border-2 transition-all ${
                    avatarBgColor === preset.value
                      ? "border-primary ring-2 ring-primary/30 scale-110"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{
                    background: preset.value === "transparent"
                      ? "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 12px 12px"
                      : preset.value,
                  }}
                  onClick={() => onAvatarBgColorChange?.(preset.value)}
                  title={preset.label}
                />
              ))}
            </div>
            <div className="flex gap-1.5 items-center mt-1">
              <input
                type="color"
                value={avatarBgColor === "transparent" ? "#ffffff" : avatarBgColor}
                onChange={(e) => onAvatarBgColorChange?.(e.target.value)}
                className="h-7 w-7 rounded cursor-pointer border border-border"
              />
              <span className="text-[10px] text-muted-foreground">Custom color</span>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Upload */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <Label className="text-xs text-muted-foreground">Cover Photo</Label>
        <input ref={coverFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelected} />
        <input ref={coverCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCoverSelected} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => coverFileInputRef.current?.click()} disabled={uploading}>
            <ImagePlus className="h-4 w-4 mr-2" />
            {coverUrl ? "Change Cover" : "Upload Cover"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => coverCameraInputRef.current?.click()} disabled={uploading}>
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Backdrop Generator */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <Label className="text-xs text-muted-foreground">AI Cover Backdrop</Label>
        <Button variant="outline" size="sm" className="w-full" onClick={() => handleGenerateBackdrop(false)} disabled={generatingBackdrop}>
          {generatingBackdrop ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
          {generatingBackdrop ? "Generating…" : `Generate for "${profession}"`}
        </Button>
        <div className="flex gap-1.5">
          <Input placeholder="Or describe your backdrop…" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="text-xs h-8" />
          <Button variant="secondary" size="sm" className="h-8 px-3 shrink-0" onClick={() => handleGenerateBackdrop(true)} disabled={generatingBackdrop || !customPrompt.trim()}>
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {coverUrl && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CoverPositioner
                coverUrl={coverUrl}
                offsetY={coverOffsetY}
                onOffsetChange={(y) => onCoverOffsetYChange?.(y)}
              />
            </div>
            <Button
              variant={coverFlipX ? "default" : "outline"}
              size="sm"
              className="h-8 px-2.5 shrink-0"
              onClick={() => onCoverFlipXChange?.(!coverFlipX)}
              title="Flip cover horizontally"
            >
              <FlipHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {coverUrl && onCoverHeightChange && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Backdrop height</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{coverHeight}px</span>
            </div>
            <Slider
              value={[coverHeight]}
              onValueChange={([v]) => onCoverHeightChange(v)}
              min={80}
              max={280}
              step={4}
            />
          </div>
        )}
      </div>

      {/* Logo Upload */}
      {onLogoChange && (
        <LogoUploader logoUrl={logoUrl} onLogoChange={onLogoChange} logoFrostedBg={logoFrostedBg} onLogoFrostedBgChange={onLogoFrostedBgChange} logoGlow={logoGlow} onLogoGlowChange={onLogoGlowChange} logoPosition={logoPosition} onLogoPositionChange={onLogoPositionChange} logoSize={logoSize} onLogoSizeChange={onLogoSizeChange} logoOpacity={logoOpacity} onLogoOpacityChange={onLogoOpacityChange} logoPadding={logoPadding} onLogoPaddingChange={onLogoPaddingChange} logoNameGap={logoNameGap} onLogoNameGapChange={onLogoNameGapChange} logoVerticalAlign={logoVerticalAlign} onLogoVerticalAlignChange={onLogoVerticalAlignChange} />
      )}

      {/* Profile Photo Crop Dialog */}
      <ImageCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc || ""}
        onClose={() => setCropSrc(null)}
        onCropComplete={handleCroppedUpload}
        aspect={1}
        title="Crop Profile Photo"
      />

      {/* Cover Photo Crop Dialog */}
      <ImageCropDialog
        open={!!coverCropSrc}
        imageSrc={coverCropSrc || ""}
        onClose={() => setCoverCropSrc(null)}
        onCropComplete={handleCroppedCoverUpload}
        aspect={16 / 9}
        title="Crop Cover Photo"
      />
    </div>
  );
}
