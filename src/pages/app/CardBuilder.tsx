import { CreditCard, Eye, Paintbrush, Palette, Globe, Sparkles, Loader2, Pencil, MousePointerClick, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import CtaEditor, { type CtaItem, DEFAULT_CTA_CONFIG } from "@/components/card/CtaEditor";
import { resolveCardTheme, type ResolvedCardTheme } from "@/lib/cardTokens";
import QRShareDialog from "@/components/card/QRShareDialog";
import CardPhotoTools from "@/components/card/CardPhotoTools";
import SectionEditor, { type SectionContent } from "@/components/card/SectionEditor";
import CardAssistant from "@/components/card/CardAssistant";
import SortableSectionItem from "@/components/card/SortableSectionItem";
import CardThemeEditor, { type CardThemeOverrides } from "@/components/card/CardThemeEditor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const [avatarBgColor, setAvatarBgColor] = useState("transparent");
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFrostedBg, setLogoFrostedBg] = useState(true);
  const [logoGlow, setLogoGlow] = useState(false);
  const [ctaConfig, setCtaConfig] = useState<CtaItem[]>(DEFAULT_CTA_CONFIG);
  const [showSectionIcons, setShowSectionIcons] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState<string | null>(null);
  const [editJobTitle, setEditJobTitle] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverUrlRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const professionName = (profile as any)?.professions?.name ?? "Professional";
  const displayJobTitle = jobTitle || professionName;

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
      if (themeJson?.cover_url) {
        setCoverUrl(themeJson.cover_url);
        coverUrlRef.current = themeJson.cover_url;
      }
      if (themeJson?.avatar_bg_color) setAvatarBgColor(themeJson.avatar_bg_color);
      if (typeof themeJson?.avatar_rotation === "number") setAvatarRotation(themeJson.avatar_rotation);
      if (typeof themeJson?.cover_offset_y === "number") setCoverOffsetY(themeJson.cover_offset_y);
      if (themeJson?.logo_url) setLogoUrl(themeJson.logo_url);
      if (typeof themeJson?.logo_frosted_bg === "boolean") setLogoFrostedBg(themeJson.logo_frosted_bg);
      if (typeof themeJson?.logo_glow === "boolean") setLogoGlow(themeJson.logo_glow);
      if (themeJson?.job_title) { setJobTitle(themeJson.job_title); }
      if (typeof themeJson?.section_icons === "boolean") setShowSectionIcons(themeJson.section_icons);
      if (themeJson?.cta_config && Array.isArray(themeJson.cta_config)) {
        setCtaConfig(themeJson.cta_config as CtaItem[]);
      }
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
            theme_json: { ...(card?.theme_json as any ?? {}), cover_url: coverUrlRef.current } as any,
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
    [published, card, upsertCard],
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

  const saveThemeField = async (fields: Record<string, any>) => {
    try {
      const existing = (card?.theme_json as any) ?? {};
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: { ...existing, cover_url: coverUrlRef.current, ...fields } as any,
      });
    } catch {
      // silent — debounced visual updates don't need error toasts
    }
  };

  const handleAvatarBgColorChange = (color: string) => {
    setAvatarBgColor(color);
    saveThemeField({ avatar_bg_color: color });
  };

  const handleAvatarRotationChange = (deg: number) => {
    setAvatarRotation(deg);
    saveThemeField({ avatar_rotation: deg });
  };

  const handleCoverOffsetYChange = (y: number) => {
    setCoverOffsetY(y);
    saveThemeField({ cover_offset_y: y });
  };

  const handleLogoChange = (url: string | null) => {
    setLogoUrl(url);
    saveThemeField({ logo_url: url });
  };

  const handleLogoFrostedBgChange = (val: boolean) => {
    setLogoFrostedBg(val);
    saveThemeField({ logo_frosted_bg: val });
  };

  const handleLogoGlowChange = (val: boolean) => {
    setLogoGlow(val);
    saveThemeField({ logo_glow: val });
  };

  const handleCoverChange = async (url: string) => {
    setCoverUrl(url);
    coverUrlRef.current = url;
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

  const primaryCta = ctaConfig.find(c => c.isPrimary)?.id ?? profile?.primary_cta ?? "call";

  const handleCtaConfigChange = (newConfig: CtaItem[]) => {
    setCtaConfig(newConfig);
    saveThemeField({ cta_config: newConfig });
  };

  const currentThemeOverrides: CardThemeOverrides = {
    palette: (card?.theme_json as any)?.palette ?? undefined,
    fonts: (card?.theme_json as any)?.fonts ?? undefined,
    tokens: (card?.theme_json as any)?.tokens ?? undefined,
  };

  // Resolve the full theme for the live preview
  const FALLBACK_PALETTE = { primary: "#4361ee", secondary: "#6b7280", accent: "#7c3aed", background: "#ffffff" };
  const previewTheme: ResolvedCardTheme = useMemo(() => {
    const tokens = (stylePack?.theme_tokens as Record<string, any>) ?? {};
    const palettes = (stylePack?.default_palettes as any[]) ?? [];
    const basePalette = palettes[0] ?? FALLBACK_PALETTE;
    const themeJson = (card?.theme_json as any) ?? {};
    const palette = themeJson.palette
      ? { ...basePalette, ...themeJson.palette }
      : basePalette;
    let mergedTokens = { ...tokens };
    if (themeJson.fonts) {
      mergedTokens = { ...mergedTokens, fontPrimary: themeJson.fonts.primary, fontSecondary: themeJson.fonts.secondary };
    }
    // Merge card style token overrides
    if (themeJson.tokens) {
      const t = themeJson.tokens;
      if (t.button) mergedTokens = { ...mergedTokens, button: { ...(mergedTokens.button ?? {}), ...t.button } };
      if (t.header) mergedTokens = { ...mergedTokens, header: { ...(mergedTokens.header ?? {}), ...t.header } };
      if (t.section) mergedTokens = { ...mergedTokens, section: { ...(mergedTokens.section ?? {}), ...t.section } };
      if (t.spacingScale) mergedTokens = { ...mergedTokens, spacingScale: t.spacingScale };
      if (t.shadow) mergedTokens = { ...mergedTokens, shadow: { ...(mergedTokens.shadow ?? {}), ...t.shadow } };
      if (t.radius) mergedTokens = { ...mergedTokens, radius: { ...(mergedTokens.radius ?? {}), ...t.radius } };
    }
    return resolveCardTheme(mergedTokens, palette);
  }, [stylePack, card?.theme_json]);

  const handleThemeSave = async (overrides: CardThemeOverrides) => {
    try {
      const existing = (card?.theme_json as any) ?? {};
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: { ...existing, cover_url: coverUrl, palette: overrides.palette, fonts: overrides.fonts, tokens: overrides.tokens } as any,
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
          {/* Name & Title */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Identity</h2>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Display Name</label>
              <div className="flex gap-2">
                <Input
                  value={editName ?? profile?.name ?? ""}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name"
                  className="text-sm"
                />
                {editName !== null && editName !== (profile?.name ?? "") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={async () => {
                      if (!profile) return;
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { error } = await supabase.from("profiles").update({ name: editName }).eq("id", profile.id);
                      if (error) { toast.error("Failed to save name"); return; }
                      qc.invalidateQueries({ queryKey: ["profile"] });
                      qc.invalidateQueries({ queryKey: ["public-card"] });
                      setEditName(null);
                      toast.success("Name updated");
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Company / Title</label>
              <div className="flex gap-2">
                <Input
                  value={editCompany ?? profile?.company ?? ""}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="Your Company"
                  className="text-sm"
                />
                {editCompany !== null && editCompany !== (profile?.company ?? "") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={async () => {
                      if (!profile) return;
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { error } = await supabase.from("profiles").update({ company: editCompany }).eq("id", profile.id);
                      if (error) { toast.error("Failed to save company"); return; }
                      qc.invalidateQueries({ queryKey: ["profile"] });
                      qc.invalidateQueries({ queryKey: ["public-card"] });
                      setEditCompany(null);
                      toast.success("Company updated");
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Job Title</label>
              <div className="flex gap-2">
                <Input
                  value={editJobTitle ?? jobTitle ?? ""}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  placeholder={professionName}
                  className="text-sm"
                />
                {editJobTitle !== null && editJobTitle !== (jobTitle ?? "") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => {
                      const val = editJobTitle.trim() || null;
                      setJobTitle(val);
                      setEditJobTitle(null);
                      saveThemeField({ job_title: val });
                      toast.success("Job title updated");
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {jobTitle && (
                <p className="text-[10px] text-muted-foreground">Clear to use default: {professionName}</p>
              )}
            </div>
          </div>

          {/* Photo & Backdrop */}
          <div className="rounded-xl border border-border bg-card p-5">
            <CardPhotoTools
              avatarUrl={avatarUrl}
              coverUrl={coverUrl}
              profession={professionName}
              onAvatarChange={handleAvatarChange}
              onCoverChange={handleCoverChange}
              avatarBgColor={avatarBgColor}
              avatarRotation={avatarRotation}
              onAvatarBgColorChange={handleAvatarBgColorChange}
              onAvatarRotationChange={handleAvatarRotationChange}
              coverOffsetY={coverOffsetY}
              onCoverOffsetYChange={handleCoverOffsetYChange}
              logoUrl={logoUrl}
              onLogoChange={handleLogoChange}
              logoFrostedBg={logoFrostedBg}
              onLogoFrostedBgChange={handleLogoFrostedBgChange}
              logoGlow={logoGlow}
              onLogoGlowChange={handleLogoGlowChange}
              avatarShape={previewTheme.header.avatarShape}
              onAvatarShapeChange={(shape) => {
                const existing = (card?.theme_json as any)?.tokens ?? {};
                saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarShape: shape } } });
              }}
              avatarBorderWidth={((card?.theme_json as any)?.tokens?.header?.avatarBorderWidth) ?? 3}
              onAvatarBorderWidthChange={(val) => {
                const existing = (card?.theme_json as any)?.tokens ?? {};
                saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBorderWidth: val } } });
              }}
              avatarSize={((card?.theme_json as any)?.tokens?.header?.avatarSize) ?? 80}
              onAvatarSizeChange={(val) => {
                const existing = (card?.theme_json as any)?.tokens ?? {};
                saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarSize: val } } });
              }}
              avatarBannerText={((card?.theme_json as any)?.tokens?.header?.avatarBannerText) ?? ""}
              onAvatarBannerTextChange={(val) => {
                const existing = (card?.theme_json as any)?.tokens ?? {};
                saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerText: val } } });
              }}
              avatarBannerBg={((card?.theme_json as any)?.tokens?.header?.avatarBannerBg) ?? ""}
              onAvatarBannerBgChange={(val) => {
                const existing = (card?.theme_json as any)?.tokens ?? {};
                saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerBg: val } } });
              }}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Sections</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Icons</span>
                <Switch checked={showSectionIcons} onCheckedChange={(val) => { setShowSectionIcons(val); saveThemeField({ section_icons: val }); }} />
              </div>
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

            {/* CTA Buttons */}
            <div className="pt-3 border-t border-border/50 space-y-3">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">CTA Buttons</h2>
              </div>
              <CtaEditor ctas={ctaConfig} onChange={handleCtaConfigChange} />
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
            <div className="rounded-2xl border border-border overflow-hidden shadow-card" style={{ background: previewTheme.palette.background }}>
              {/* Cover */}
              <div
                className="h-28 relative overflow-hidden"
                style={{
                  background: coverUrl
                    ? undefined
                    : `linear-gradient(135deg, ${previewTheme.palette.primary}33, ${previewTheme.palette.primary}0D)`,
                }}
              >
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt="cover"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: `center ${coverOffsetY}%` }}
                  />
                )}
                {logoUrl && (
                  <div className={`absolute top-2 right-2 h-12 w-12 rounded-lg flex items-center justify-center ${logoFrostedBg ? 'bg-white/80 backdrop-blur-sm p-1 shadow-sm' : ''}`}>
                    <img src={logoUrl} alt="logo" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 -mt-10">
                {/* Avatar */}
                <div
                  className="h-20 w-20 rounded-2xl border-4 flex items-center justify-center mb-3 cursor-pointer relative group overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    borderColor: previewTheme.palette.background,
                    backgroundColor: avatarBgColor === "transparent" ? `${previewTheme.palette.secondary}15` : avatarBgColor,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="h-full w-full object-cover rounded-2xl"
                      style={{ transform: `rotate(${avatarRotation}deg)` }}
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

                <h3 className="text-lg font-bold" style={{ color: previewTheme.palette.secondary, fontFamily: `'${previewTheme.fonts.primary}', sans-serif` }}>{(editName ?? profile?.name) || "Your Name"}</h3>
                <p className="text-sm" style={{ color: `${previewTheme.palette.secondary}99` }}>{displayJobTitle}</p>
                {(editCompany ?? profile?.company) && (
                  <p className="text-xs mt-0.5" style={{ color: `${previewTheme.palette.secondary}70` }}>{editCompany ?? profile?.company}</p>
                )}

                {(() => {
                  const enabledCtas = ctaConfig.filter(c => c.enabled);
                  const primaryCta = enabledCtas.find(c => c.isPrimary) || enabledCtas[0];
                  const secondaryCtas = enabledCtas.filter(c => c !== primaryCta);
                  return (
                    <div className="space-y-2 mt-4">
                      {primaryCta && (
                        <button
                          className="w-full text-xs font-semibold py-2.5 rounded-lg transition-colors"
                          style={{ background: previewTheme.palette.primary, color: previewTheme.palette.background }}
                        >
                          {primaryCta.label}
                        </button>
                      )}
                      {secondaryCtas.length > 0 && (
                        <div className="flex gap-2">
                          {secondaryCtas.map(c => (
                            <button
                              key={c.id}
                              className="flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors"
                              style={{ borderColor: `${previewTheme.palette.primary}40`, color: previewTheme.palette.primary, background: "transparent" }}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

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
          profession={(profile as any)?.professions?.name ?? ""}
          userName={profile?.name ?? ""}
          company={profile?.company ?? ""}
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
        stylePackTokens={(stylePack?.theme_tokens as Record<string, any>) ?? undefined}
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
