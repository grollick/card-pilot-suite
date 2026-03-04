import { useState, useRef } from "react";
import { Camera, Eraser, ImagePlus, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CardPhotoToolsProps {
  avatarUrl: string | null | undefined;
  coverUrl: string | null | undefined;
  profession: string;
  onAvatarChange: (url: string) => void;
  onCoverChange: (url: string) => void;
}

export default function CardPhotoTools({
  avatarUrl,
  coverUrl,
  profession,
  onAvatarChange,
  onCoverChange,
}: CardPhotoToolsProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [generatingBackdrop, setGeneratingBackdrop] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from("card-assets")
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("card-assets").getPublicUrl(path);
    // Add cache-buster to force reload
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/png" });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const url = await uploadFile(file, path);

      // Update profile avatar_url
      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

      onAvatarChange(url);
      toast.success("Photo uploaded!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

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

      // Upload the result to storage
      const file = await base64ToFile(imageUrl, "avatar-nobg.png");
      const path = `${user.id}/avatar-nobg.png`;
      const url = await uploadFile(file, path);

      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

      onAvatarChange(url);
      toast.success("Background removed!");
    } catch (err: any) {
      console.error("BG removal error:", err);
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

      const { data, error } = await supabase.functions.invoke("generate-backdrop", {
        body,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const imageUrl = data.image_url;
      if (!imageUrl) throw new Error("No image returned");

      // Upload the result to storage
      const file = await base64ToFile(imageUrl, "backdrop.png");
      const path = `${user.id}/backdrop.png`;
      const url = await uploadFile(file, path);

      onCoverChange(url);
      toast.success("Backdrop generated!");
    } catch (err: any) {
      console.error("Backdrop generation error:", err);
      toast.error(err.message || "Failed to generate backdrop");
    } finally {
      setGeneratingBackdrop(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Photo & Backdrop</h2>
      </div>

      {/* Upload Photo */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Profile Photo</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Uploading…" : avatarUrl ? "Change Photo" : "Upload Photo"}
        </Button>
      </div>

      {/* Remove Background */}
      {avatarUrl && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Background Removal</Label>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleRemoveBackground}
            disabled={removingBg}
          >
            {removingBg ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eraser className="h-4 w-4 mr-2" />
            )}
            {removingBg ? "Removing BG…" : "Remove Background"}
          </Button>
        </div>
      )}

      {/* AI Backdrop Generator */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <Label className="text-xs text-muted-foreground">AI Cover Backdrop</Label>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleGenerateBackdrop(false)}
          disabled={generatingBackdrop}
        >
          {generatingBackdrop ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4 mr-2" />
          )}
          {generatingBackdrop ? "Generating…" : `Generate for "${profession}"`}
        </Button>

        <div className="flex gap-1.5">
          <Input
            placeholder="Or describe your backdrop…"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="text-xs h-8"
          />
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-3 shrink-0"
            onClick={() => handleGenerateBackdrop(true)}
            disabled={generatingBackdrop || !customPrompt.trim()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {coverUrl && (
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <img
              src={coverUrl}
              alt="Backdrop preview"
              className="w-full h-20 object-cover"
            />
            <p className="text-[10px] text-muted-foreground text-center py-1">
              Current backdrop
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
