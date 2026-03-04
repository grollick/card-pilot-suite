import { CreditCard, Eye, Paintbrush, Smartphone, Save, Globe, QrCode } from "lucide-react";
import QRShareDialog from "@/components/card/QRShareDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
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

export default function CardBuilder() {
  const { data: card, isLoading: cardLoading } = useCard();
  const { data: profile } = useProfile();
  const { data: stylePack } = useStylePack(profile?.style_pack);
  const upsertCard = useUpsertCard();

  const [sections, setSections] = useState<CardSection[]>(DEFAULT_SECTIONS);
  const [published, setPublished] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Hydrate from DB
  useEffect(() => {
    if (card) {
      const dbSections = card.sections_json as unknown as CardSection[] | null;
      if (dbSections && Array.isArray(dbSections) && dbSections.length > 0) {
        setSections(dbSections);
      }
      setPublished(card.status === "published");
    }
  }, [card]);

  const toggleSection = (id: string) => {
    setSections((s) =>
      s.map((sec) => (sec.id === id ? { ...sec, enabled: !sec.enabled } : sec))
    );
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: (card?.theme_json ?? {}) as any,
      });
      setDirty(false);
      toast.success("Card saved");
    } catch {
      toast.error("Failed to save card");
    }
  };

  const handlePublishToggle = async (val: boolean) => {
    setPublished(val);
    try {
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: val ? "published" : "draft",
      });
      toast.success(val ? "Card published!" : "Card unpublished");
      setDirty(false);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Resolve theme for preview
  const themeTokens = (stylePack?.theme_tokens as Record<string, any>) ?? {};
  const palettes = (stylePack?.default_palettes as any[]) ?? [];
  const palette = palettes[0] ?? {
    primary: "hsl(230, 80%, 56%)",
    secondary: "#818cf8",
    accent: "#a78bfa",
    background: "#ffffff",
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
          {dirty && (
            <Button onClick={handleSave} disabled={upsertCard.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
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
                Preview
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections panel */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 rounded-xl border border-border bg-card p-5 space-y-4"
        >
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
              <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5" />
              <div className="px-5 pb-5 -mt-10">
                <div className="h-20 w-20 rounded-2xl bg-muted border-4 border-card flex items-center justify-center mb-3">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="h-full w-full object-cover rounded-2xl"
                    />
                  ) : (
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-bold">{profile?.name || "Your Name"}</h3>
                <p className="text-sm text-muted-foreground">
                  {(profile as any)?.professions?.name ?? "Your Profession"}
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
