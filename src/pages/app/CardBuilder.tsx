import { CreditCard, Eye, Paintbrush, Palette, Globe, Sparkles, Loader2, Pencil } from "lucide-react";
import QRShareDialog from "@/components/card/QRShareDialog";
import CardPhotoTools from "@/components/card/CardPhotoTools";
import SectionEditor, { type SectionContent } from "@/components/card/SectionEditor";
import CardAssistant from "@/components/card/CardAssistant";
import SortableSectionItem from "@/components/card/SortableSectionItem";
import CardThemeEditor, { type CardThemeOverrides } from "@/components/card/CardThemeEditor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  useCard,
  useUpsertCard,
  useProfile,
  useStylePack,
  DEFAULT_SECTIONS,
  CTA_TYPES,
  type CardSection,
} from "@/hooks/useCard";
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
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      const themeJson = card.theme_json as any;
      if (themeJson?.cover_url) setCoverUrl(themeJson.cover_url);
    }
  }, [card]);

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  const saveSections = useCallback(
    async (newSections: CardSection[], immediate = false) => {
      clearTimeout(saveTimer.current);
      const doSave = async () => {
        try {
          await upsertCard.mutateAsync({
            sections_json: newSections as any,
            status: published ? "published" : "draft",
            theme_json: { ...(card?.theme_json as any ?? {}), cover_url: coverUrl } as any,
          });
          toast.success("Card saved");
        } catch {
          toast.error("Failed to save");
        }
      };
      if (immediate) {
        await doSave();
      } else {
        saveTimer.current = setTimeout(doSave, 800);
      }
    },
    [published, card, upsertCard, coverUrl],
  );

  const toggleSection = (id: string) => {
    setSections((prev) => {
      const next = prev.map((sec) =>
        sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
      );
      saveSections(next);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      saveSections(next);
      return next;
    });
  };

  const handleSectionContentSave = (sectionId: string, content: SectionContent) => {
    setSections((prev) => {
      const next = prev.map((sec) =>
        sec.id === sectionId ? { ...sec, content } : sec
      );
      saveSections(next, true);
      return next;
    });
  };

  // Paste AI-generated text into a section's primary content field
  const handleCopyToSection = (sectionId: string, text: string) => {
    // Strip markdown formatting for clean paste
    const clean = text.replace(/[#*_`~>\-]/g, "").replace(/\n{3,}/g, "\n\n").trim();

    setSections((prev) => {
      const next = prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const existing = (sec.content || {}) as SectionContent;
        let updated: SectionContent;

        switch (sectionId) {
          case "hero":
            // Use first line as tagline, rest as subtitle
            const lines = clean.split("\n").filter(Boolean);
            updated = { ...existing, tagline: lines[0] || clean, subtitle: lines.slice(1).join(" ") };
            break;
          case "about":
            updated = { ...existing, text: clean };
            break;
          case "contact":
            updated = { ...existing, heading: clean.slice(0, 60), description: clean };
            break;
          case "booking":
            updated = { ...existing, bookingHeading: clean.slice(0, 60) };
            break;
          case "services": {
            // Try to parse lines as service items
            const serviceLines = clean.split("\n").filter(Boolean);
            const items = serviceLines.map((line) => ({ name: line.slice(0, 80), description: "", price: "" }));
            updated = { ...existing, items: items.length > 0 ? items : existing.items };
            break;
          }
          case "testimonials": {
            // Add as a single testimonial
            updated = {
              ...existing,
              testimonials: [...(existing.testimonials || []), { name: "Client", text: clean, role: "" }],
            };
            break;
          }
          default:
            updated = existing;
        }
        return { ...sec, content: updated, enabled: true };
      });
      saveSections(next, true);
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
    try {
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: { ...(card?.theme_json as any ?? {}), cover_url: url } as any,
      });
    } catch {
      toast.error("Failed to save backdrop");
    }
  };

  const primaryCta = profile?.primary_cta ?? "call";

  const currentThemeOverrides: CardThemeOverrides = {
    palette: (card?.theme_json as any)?.palette ?? undefined,
    fonts: (card?.theme_json as any)?.fonts ?? undefined,
  };

  const handleThemeSave = async (overrides: CardThemeOverrides) => {
    try {
      const existing = (card?.theme_json as any) ?? {};
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: { ...existing, cover_url: coverUrl, palette: overrides.palette, fonts: overrides.fonts } as any,
      });
      toast.success("Theme updated!");
    } catch {
      toast.error("Failed to save theme");
    }
  };

  const editingSec = sections.find((s) => s.id === editingSection);

  // Preview content helpers
  const getSectionPreview = (section: CardSection) => {
    const c = section.content;
    if (!c) return <p className="text-xs text-muted-foreground text-center">{section.label} Section</p>;

    switch (section.id) {
      case "hero":
        return c.tagline ? (
          <div className="text-center">
            <p className="text-sm font-semibold">{c.tagline}</p>
            {c.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{c.subtitle}</p>}
          </div>
        ) : <p className="text-xs text-muted-foreground text-center">Hero Section</p>;

      case "about":
        return c.text ? (
          <p className="text-xs leading-relaxed">{c.text}</p>
        ) : <p className="text-xs text-muted-foreground text-center">About Section</p>;

      case "services":
        return c.items?.length ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Services</p>
            {c.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>{item.name || "Untitled"}</span>
                {item.price && <span className="text-muted-foreground">{item.price}</span>}
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground text-center">Services Section</p>;

      case "testimonials":
        return c.testimonials?.length ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Testimonials</p>
            {c.testimonials.map((t: any, i: number) => (
              <div key={i} className="text-xs italic">
                "{t.text}" — <span className="font-medium not-italic">{t.name}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground text-center">Testimonials Section</p>;

      case "gallery":
        return c.images?.length ? (
          <div className="grid grid-cols-3 gap-1">
            {c.images.slice(0, 6).map((img: any, i: number) => (
              <img key={i} src={img.url} alt={img.caption || ""} className="w-full h-16 object-cover rounded" />
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground text-center">Gallery Section</p>;

      case "social":
        return c.links?.length ? (
          <div className="flex flex-wrap gap-2">
            {c.links.map((l: any, i: number) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {l.platform}
              </span>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground text-center">Social Links</p>;

      case "contact":
        return (
          <div className="text-center">
            <p className="text-xs font-medium">{c.heading || "Get in Touch"}</p>
            {c.description && <p className="text-[10px] text-muted-foreground mt-0.5">{c.description}</p>}
          </div>
        );

      case "booking":
        return (
          <p className="text-xs text-center font-medium">{c.bookingHeading || "Book an Appointment"}</p>
        );

      default:
        return <p className="text-xs text-muted-foreground text-center">{section.label} Section</p>;
    }
  };

  if (cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading card…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Card Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Design and publish your digital business card</p>
          {profile?.handle && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              cardpilot.com/{profile.handle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{published ? "Published" : "Unpublished"}</span>
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
          {/* Photo & Backdrop */}
          <div className="rounded-xl border border-border bg-card p-5">
            <CardPhotoTools
              avatarUrl={avatarUrl}
              coverUrl={coverUrl}
              profession={professionName}
              onAvatarChange={handleAvatarChange}
              onCoverChange={handleCoverChange}
            />
          </div>

          {/* Theme */}
          <div className="rounded-xl border border-border bg-card p-5">
            <Button variant="outline" className="w-full" onClick={() => setThemeEditorOpen(true)}>
              <Palette className="h-4 w-4 mr-2" />
              Customize Theme
            </Button>
          </div>

          {/* Sections */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Sections</h2>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <SortableSectionItem
                      key={section.id}
                      section={section}
                      onEdit={setEditingSection}
                      onToggle={toggleSection}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* AI Generate */}
            <div className="pt-3 border-t border-border/50">
              <Button variant="outline" className="w-full" onClick={handleAIGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
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
              <p className="text-[10px] text-muted-foreground mt-0.5">Change in Settings → Profile</p>
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
              {/* Cover */}
              <div
                className="h-28 relative"
                style={{
                  background: coverUrl
                    ? `url(${coverUrl}) center/cover`
                    : "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))",
                }}
              />

              <div className="px-5 pb-5 -mt-10">
                {/* Avatar */}
                <div
                  className="h-20 w-20 rounded-2xl bg-muted border-4 border-card flex items-center justify-center mb-3 cursor-pointer relative group overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover rounded-2xl" />
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
                      const { error } = await supabase.storage.from("card-assets").upload(path, file, { upsert: true });
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
                <p className="text-sm text-muted-foreground">{professionName}</p>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 text-xs">
                    {CTA_TYPES.find((c) => c.value === primaryCta)?.label ?? "Call"}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">Text</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">Email</Button>
                </div>

                {/* Section previews - clickable to edit */}
                {sections
                  .filter((s) => s.enabled)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="mt-4 p-3 rounded-lg border border-dashed border-border/60 bg-muted/20 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                      onClick={() => setEditingSection(section.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {section.label}
                        </span>
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {getSectionPreview(section)}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section Editor Sheet */}
      {editingSec && (
        <SectionEditor
          sectionId={editingSec.id}
          sectionLabel={editingSec.label}
          content={(editingSec.content || {}) as SectionContent}
          open={!!editingSection}
          onOpenChange={(open) => { if (!open) setEditingSection(null); }}
          onSave={(content) => handleSectionContentSave(editingSec.id, content)}
        />
      )}

      {/* Theme Editor Sheet */}
      <CardThemeEditor
        open={themeEditorOpen}
        onOpenChange={setThemeEditorOpen}
        currentOverrides={currentThemeOverrides}
        stylePackPalettes={(stylePack?.default_palettes as any[]) ?? undefined}
        stylePackFonts={
          stylePack?.theme_tokens
            ? { primary: (stylePack.theme_tokens as any).fontPrimary ?? "Inter", secondary: (stylePack.theme_tokens as any).fontSecondary ?? "Inter" }
            : undefined
        }
        onSave={handleThemeSave}
      />
      {/* AI Assistant */}
      <CardAssistant
        context={{
          name: profile?.name || "",
          profession: professionName,
          company: profile?.company || undefined,
          sections: sections.filter((s) => s.enabled).map((s) => s.label).join(", "),
          hasAvatar: !!avatarUrl,
          hasBackdrop: !!coverUrl,
          cardStatus: published ? "published" : "draft",
        }}
        sectionTargets={sections.map((s) => ({ id: s.id, label: s.label, enabled: s.enabled }))}
        onCopyToSection={handleCopyToSection}
      />
    </div>
  );
}
