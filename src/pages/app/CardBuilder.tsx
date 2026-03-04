import { CreditCard, Eye, Paintbrush, Save, Globe, Sparkles, Loader2 } from "lucide-react";
import QRShareDialog from "@/components/card/QRShareDialog";
import CardPhotoTools from "@/components/card/CardPhotoTools";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  useCard,
  useUpsertCard,
  useProfile,
  useStylePack,
  DEFAULT_SECTIONS,
  CTA_TYPES,
  type CardSection,
} from "@/hooks/useCard";
import { resolveCardTheme } from "@/lib/cardTokens";
import { useGenerateCardContent } from "@/hooks/useGenerateContent";
import { useQueryClient } from "@tanstack/react-query";

export default function CardBuilder() {
  const { data: card, isLoading: cardLoading } = useCard();
  const { data: profile } = useProfile();
  const { data: stylePack } = useStylePack(profile?.style_pack);
  const upsertCard = useUpsertCard();
  const { generate, isGenerating, content: aiContent } = useGenerateCardContent();
  const qc = useQueryClient();

  const [sections, setSections] = useState<CardSection[]>(DEFAULT_SECTIONS);
  const [published, setPublished] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const professionName = (profile as any)?.professions?.name ?? "Professional";

  const handleAIGenerate = async () => {
    if (!profile) return;
    const result = await generate({
      profession: professionName,
      name: profile.name || "",
      company: profile.company || undefined,
    });
    if (result) {
      toast.success("AI content generated! It will appear on your published card.");
    }
  };

  // Hydrate from DB only once
  useEffect(() => {
    if (card && !hydrated.current) {
      hydrated.current = true;
      const dbSections = card.sections_json as unknown as CardSection[] | null;
      if (dbSections && Array.isArray(dbSections) && dbSections.length > 0) {
        setSections(dbSections);
      }
      setPublished(card.status === "published");
      // Hydrate cover from theme_json
      const themeJson = card.theme_json as any;
      if (themeJson?.cover_url) setCoverUrl(themeJson.cover_url);
    }
  }, [card]);

  // Hydrate avatar from profile
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Auto-save sections after toggle (debounced 800ms)
  const autoSave = useCallback(
    (newSections: CardSection[]) => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await upsertCard.mutateAsync({
            sections_json: newSections as any,
            status: published ? "published" : "draft",
            theme_json: { ...(card?.theme_json as any ?? {}), cover_url: coverUrl } as any,
          });
          toast.success("Sections saved");
        } catch {
          toast.error("Failed to save sections");
        }
      }, 800);
    },
    [published, card, upsertCard, coverUrl],
  );

  const toggleSection = (id: string) => {
    setSections((prev) => {
      const next = prev.map((sec) =>
        sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
      );
      autoSave(next);
      return next;
    });
  };

  const handlePublishToggle = async (val: boolean) => {
    setPublished(val);
    clearTimeout(saveTimer.current);
    try {
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: val ? "published" : "draft",
        theme_json: { ...(card?.theme_json as any ?? {}), cover_url: coverUrl } as any,
      });
      toast.success(val ? "Card published!" : "Card unpublished");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const handleCoverChange = async (url: string) => {
    setCoverUrl(url);
    // Save cover_url to card theme_json
    try {
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: { ...(card?.theme_json as any ?? {}), cover_url: url } as any,
      });
      toast.success("Backdrop saved!");
    } catch {
      toast.error("Failed to save backdrop");
    }
  };

  const primaryCta = profile?.primary_cta ?? "call";

  if (cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading card…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Card Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Design and publish your digital business card
          </p>
          {profile?.handle && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              cardpilot.com/{profile.handle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {published ? "Published" : "Unpublished"}
            </span>
            <Switch checked={published} onCheckedChange={handlePublishToggle} />
          </div>
          {profile?.handle && (
            <QRShareDialog
              url={`${window.location.origin}/${profile.handle}`}
              name={profile.name || "Card"}
            />
          )}
          {profile?.handle && (
            <Button variant="outline" asChild>
              <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                View Card
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-4"
        >
          {/* Photo & Backdrop Tools */}
          <div className="rounded-xl border border-border bg-card p-5">
            <CardPhotoTools
              avatarUrl={avatarUrl}
              coverUrl={coverUrl}
              profession={professionName}
              onAvatarChange={handleAvatarChange}
              onCoverChange={handleCoverChange}
            />
          </div>

          {/* Sections panel */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Sections</h2>
            </div>
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-medium">{section.label}</span>
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                </div>
              ))}
            </div>

            {/* AI Generate */}
            <div className="pt-3 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAIGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? "Generating..." : "AI Write My Card"}
              </Button>
              {aiContent && (
                <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">AI Tagline</p>
                  <p className="text-xs">{aiContent.tagline}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-2 mb-1">AI Bio</p>
                  <p className="text-xs">{aiContent.bio}</p>
                </div>
              )}
            </div>

            {/* CTA info */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Primary CTA</p>
              <p className="text-sm font-semibold capitalize">
                {CTA_TYPES.find((c) => c.value === primaryCta)?.label ?? primaryCta}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Change in Settings → Profile
              </p>
            </div>
          </div>
        </motion.div>

        {/* Live preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-muted/30 p-6 min-h-[600px] flex items-start justify-center"
        >
          <div className="w-full max-w-sm mx-auto">
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
              {/* Cover/Backdrop */}
              <div
                className="h-28 relative cursor-pointer group"
                style={{
                  background: coverUrl
                    ? `url(${coverUrl}) center/cover`
                    : "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))",
                }}
              >
                {!coverUrl && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-t-2xl">
                    <p className="text-xs text-white font-medium">Generate a backdrop →</p>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 -mt-10">
                {/* Avatar - clickable to upload */}
                <div
                  className="h-20 w-20 rounded-2xl bg-muted border-4 border-card flex items-center justify-center mb-3 cursor-pointer relative group overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="h-full w-full object-cover rounded-2xl"
                    />
                  ) : (
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !profile) return;
                    try {
                      const { supabase } = await import("@/integrations/supabase/client");
                      const ext = file.name.split(".").pop() || "jpg";
                      const path = `${profile.id}/avatar.${ext}`;
                      const { error } = await supabase.storage
                        .from("card-assets")
                        .upload(path, file, { upsert: true });
                      if (error) throw error;
                      const { data } = supabase.storage.from("card-assets").getPublicUrl(path);
                      const url = `${data.publicUrl}?t=${Date.now()}`;
                      await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
                      handleAvatarChange(url);
                      toast.success("Photo uploaded!");
                    } catch (err: any) {
                      toast.error(err.message || "Upload failed");
                    }
                  }}
                />

                <h3 className="text-lg font-bold">{profile?.name || "Your Name"}</h3>
                <p className="text-sm text-muted-foreground">
                  {professionName}
                </p>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 text-xs">
                    {CTA_TYPES.find((c) => c.value === primaryCta)?.label ?? "Call"}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">
                    Text
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">
                    Email
                  </Button>
                </div>

                {sections
                  .filter((s) => s.enabled)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="mt-4 p-3 rounded-lg border border-dashed border-border/60 bg-muted/20"
                    >
                      <p className="text-xs text-muted-foreground text-center">
                        {section.label} Section
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
