import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCard,
  useUpsertCard,
  useProfile,
  useStylePack,
  DEFAULT_SECTIONS,
  type CardSection,
} from "@/hooks/useCard";
import { useGenerateCardContent } from "@/hooks/useGenerateContent";
import { resolveCardTheme, type ResolvedCardTheme } from "@/lib/cardTokens";
import type { CtaItem } from "@/modules/card/components/CtaEditor";
import { DEFAULT_CTA_CONFIG } from "@/modules/card/components/CtaEditor";
import type { CardThemeOverrides } from "@/modules/card/components/CardThemeEditor";
import type { SectionContent } from "@/modules/card/components/SectionEditor";

const FALLBACK_PALETTE = { primary: "#4361ee", secondary: "#6b7280", accent: "#7c3aed", background: "#ffffff" };

export function useCardBuilderState() {
  const { data: card, isLoading: cardLoading } = useCard();
  const { data: profile } = useProfile();
  const { data: stylePack } = useStylePack(profile?.style_pack);
  const upsertCard = useUpsertCard();
  const { generate, isGenerating, content: aiContent } = useGenerateCardContent();
  const qc = useQueryClient();

  // ── State ──
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
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right" | "beside-name" | "beside-name-right">("top-right");
  const [logoSize, setLogoSize] = useState<"small" | "medium" | "large">("medium");
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [logoPadding, setLogoPadding] = useState(4);
  const [logoNameGap, setLogoNameGap] = useState(8);
  const [logoVerticalAlign, setLogoVerticalAlign] = useState<"top" | "center" | "bottom">("center");
  const [ctaConfig, setCtaConfig] = useState<CtaItem[]>(DEFAULT_CTA_CONFIG);
  const [ctaIconsOnly, setCtaIconsOnly] = useState(false);
  const [socialIconsOnly, setSocialIconsOnly] = useState(true);
  const [socialBtnColor, setSocialBtnColor] = useState<string>("");
  const [socialBtnStyle, setSocialBtnStyle] = useState<"auto" | "filled" | "outline">("auto");
  const [showSectionIcons, setShowSectionIcons] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const [themePreviewOverrides, setThemePreviewOverrides] = useState<CardThemeOverrides | null>(null);
  // Local pending theme fields — applied immediately to preview, synced to DB async
  const [pendingThemeFields, setPendingThemeFields] = useState<Record<string, any>>({});
  const [editName, setEditName] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState<string | null>(null);
  const [editJobTitle, setEditJobTitle] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [boldLastName, setBoldLastName] = useState(false);
  const [uppercaseName, setUppercaseName] = useState(false);
  const [nameLetterSpacing, setNameLetterSpacing] = useState(0);
  const [nameFontWeight, setNameFontWeight] = useState(700);
  const [firstNameFontWeight, setFirstNameFontWeight] = useState<number | null>(null);
  const [nameItalic, setNameItalic] = useState(false);
  const [nameFontSize, setNameFontSize] = useState<number | null>(null);
  const [subtitleFontSize, setSubtitleFontSize] = useState<number | null>(null);
  const identitySaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [identitySaveState, setIdentitySaveState] = useState<Record<string, "saving" | "saved" | null>>({});
  const [globalSaveState, setGlobalSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const globalSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const coverUrlRef = useRef<string | null>(null);

  const professionName = (profile as any)?.professions?.name ?? "Professional";
  const displayJobTitle = jobTitle || professionName;

  // ── Hydrate from DB ──
  useEffect(() => {
    if (card && !hydrated.current) {
      hydrated.current = true;
      const dbSections = card.sections_json as unknown as CardSection[] | null;
      if (dbSections && Array.isArray(dbSections) && dbSections.length > 0) setSections(dbSections);
      setPublished(card.status === "published");
      const t = card.theme_json as any;
      if (t?.cover_url) { setCoverUrl(t.cover_url); coverUrlRef.current = t.cover_url; }
      if (t?.avatar_bg_color) setAvatarBgColor(t.avatar_bg_color);
      if (typeof t?.avatar_rotation === "number") setAvatarRotation(t.avatar_rotation);
      if (typeof t?.cover_offset_y === "number") setCoverOffsetY(t.cover_offset_y);
      if (t?.logo_url) setLogoUrl(t.logo_url);
      if (typeof t?.logo_frosted_bg === "boolean") setLogoFrostedBg(t.logo_frosted_bg);
      if (typeof t?.logo_glow === "boolean") setLogoGlow(t.logo_glow);
      if (t?.logo_position) setLogoPosition(t.logo_position);
      if (t?.logo_size) setLogoSize(t.logo_size);
      if (typeof t?.logo_opacity === "number") setLogoOpacity(t.logo_opacity);
      if (typeof t?.logo_padding === "number") setLogoPadding(t.logo_padding);
      if (typeof t?.logo_name_gap === "number") setLogoNameGap(t.logo_name_gap);
      if (t?.logo_vertical_align) setLogoVerticalAlign(t.logo_vertical_align);
      if (t?.job_title) setJobTitle(t.job_title);
      if (typeof t?.bold_last_name === "boolean") setBoldLastName(t.bold_last_name);
      if (typeof t?.uppercase_name === "boolean") setUppercaseName(t.uppercase_name);
      if (typeof t?.name_letter_spacing === "number") setNameLetterSpacing(t.name_letter_spacing);
      if (typeof t?.name_font_weight === "number") setNameFontWeight(t.name_font_weight);
      if (typeof t?.first_name_font_weight === "number") setFirstNameFontWeight(t.first_name_font_weight);
      if (typeof t?.name_italic === "boolean") setNameItalic(t.name_italic);
      if (typeof t?.name_font_size === "number") setNameFontSize(t.name_font_size);
      if (typeof t?.subtitle_font_size === "number") setSubtitleFontSize(t.subtitle_font_size);
      if (typeof t?.section_icons === "boolean") setShowSectionIcons(t.section_icons);
      if (typeof t?.cta_icons_only === "boolean") setCtaIconsOnly(t.cta_icons_only);
      if (typeof t?.social_icons_only === "boolean") setSocialIconsOnly(t.social_icons_only);
      if (t?.social_btn_color) setSocialBtnColor(t.social_btn_color);
      if (t?.social_btn_style) setSocialBtnStyle(t.social_btn_style);
      if (t?.cta_config && Array.isArray(t.cta_config)) setCtaConfig(t.cta_config as CtaItem[]);
    }
  }, [card]);

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  // ── Save helpers ──
  const pendingThemeFieldsRef = useRef<Record<string, any>>({});
  // Keep ref in sync
  useEffect(() => { pendingThemeFieldsRef.current = pendingThemeFields; }, [pendingThemeFields]);

  const saveThemeField = useCallback(async (fields: Record<string, any>) => {
    // Apply locally FIRST for instant preview update
    setPendingThemeFields(prev => {
      const next = { ...prev, ...fields };
      pendingThemeFieldsRef.current = next;
      return next;
    });

    try {
      setGlobalSaveState("saving");
      const existing = (card?.theme_json as any) ?? {};
      const mergedTheme = {
        ...existing,
        ...pendingThemeFieldsRef.current,
        cover_url: coverUrlRef.current,
        ...fields,
      } as any;

      await upsertCard.mutateAsync({
        theme_json: mergedTheme,
      });

      qc.invalidateQueries({ queryKey: ["public-card"] });
      setGlobalSaveState("saved");
      clearTimeout(globalSaveTimer.current);
      globalSaveTimer.current = setTimeout(() => setGlobalSaveState("idle"), 2500);
    } catch {
      setGlobalSaveState("error");
      clearTimeout(globalSaveTimer.current);
      globalSaveTimer.current = setTimeout(() => setGlobalSaveState("idle"), 4000);
    }
  }, [card, upsertCard, qc]);

  const saveSections = useCallback(
    async (newSections: CardSection[], immediate = false) => {
      clearTimeout(saveTimer.current);
      const doSave = async () => {
        try {
          setGlobalSaveState("saving");
          await upsertCard.mutateAsync({
            sections_json: newSections as any,
            status: published ? "published" : "draft",
            theme_json: { ...(card?.theme_json as any ?? {}), ...pendingThemeFieldsRef.current, cover_url: coverUrlRef.current } as any,
          });
          setGlobalSaveState("saved");
          clearTimeout(globalSaveTimer.current);
          globalSaveTimer.current = setTimeout(() => setGlobalSaveState("idle"), 2500);
          toast.success("Card saved");
        } catch {
          setGlobalSaveState("error");
          clearTimeout(globalSaveTimer.current);
          globalSaveTimer.current = setTimeout(() => setGlobalSaveState("idle"), 4000);
          toast.error("Failed to save");
        }
      };
      if (immediate) await doSave();
      else saveTimer.current = setTimeout(doSave, 800);
    },
    [published, card, upsertCard],
  );

  // ── Section handlers ──
  const toggleSection = useCallback((id: string) => {
    setSections((prev) => {
      const next = prev.map((sec) => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec);
      saveSections(next);
      return next;
    });
  }, [saveSections]);

  const handleSectionContentSave = useCallback((sectionId: string, content: SectionContent) => {
    setSections((prev) => {
      const next = prev.map((sec) => sec.id === sectionId ? { ...sec, content } : sec);
      saveSections(next, true);
      return next;
    });
  }, [saveSections]);

  const handleCopyToSection = useCallback((sectionId: string, text: string) => {
    const clean = text.replace(/[#*_`~>\-]/g, "").replace(/\n{3,}/g, "\n\n").trim();
    setSections((prev) => {
      const next = prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const existing = (sec.content || {}) as SectionContent;
        let updated: SectionContent;
        switch (sectionId) {
          case "hero": {
            const lines = clean.split("\n").filter(Boolean);
            updated = { ...existing, tagline: lines[0] || clean, subtitle: lines.slice(1).join(" ") };
            break;
          }
          case "about": updated = { ...existing, text: clean }; break;
          case "contact": updated = { ...existing, heading: clean.slice(0, 60), description: clean }; break;
          case "booking": updated = { ...existing, bookingHeading: clean.slice(0, 60) }; break;
          case "services": {
            const items = clean.split("\n").filter(Boolean).map((l) => ({ name: l.slice(0, 80), description: "", price: "" }));
            updated = { ...existing, items: items.length > 0 ? items : existing.items };
            break;
          }
          case "testimonials":
            updated = { ...existing, testimonials: [...(existing.testimonials || []), { name: "Client", text: clean, role: "" }] };
            break;
          default: updated = existing;
        }
        return { ...sec, content: updated, enabled: true };
      });
      saveSections(next, true);
      return next;
    });
  }, [saveSections]);

  // ── Field handlers ──
  const handlePublishToggle = useCallback(async (val: boolean) => {
    setPublished(val);
    clearTimeout(saveTimer.current);
    try {
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: val ? "published" : "draft",
        theme_json: { ...(card?.theme_json as any ?? {}), ...pendingThemeFieldsRef.current, cover_url: coverUrl } as any,
      });
      toast.success(val ? "Card published!" : "Card unpublished");
    } catch { toast.error("Failed to update status"); }
  }, [sections, card, coverUrl, upsertCard]);

  const handleAvatarChange = useCallback((url: string) => {
    setAvatarUrl(url);
    qc.invalidateQueries({ queryKey: ["profile"] });
  }, [qc]);

  const handleCoverChange = useCallback(async (url: string) => {
    setCoverUrl(url);
    coverUrlRef.current = url;
    try {
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: { ...(card?.theme_json as any ?? {}), ...pendingThemeFieldsRef.current, cover_url: url } as any,
      });
    } catch { toast.error("Failed to save backdrop"); }
  }, [sections, published, card, upsertCard]);

  const makeThemeHandler = <T,>(field: string, setter: (v: T) => void) =>
    (val: T) => { setter(val); saveThemeField({ [field]: val }); };

  const handleAvatarBgColorChange = makeThemeHandler("avatar_bg_color", setAvatarBgColor);
  const handleAvatarRotationChange = makeThemeHandler("avatar_rotation", setAvatarRotation);
  const handleCoverOffsetYChange = makeThemeHandler("cover_offset_y", setCoverOffsetY);
  const handleLogoChange = makeThemeHandler("logo_url", setLogoUrl);
  const handleLogoFrostedBgChange = makeThemeHandler("logo_frosted_bg", setLogoFrostedBg);
  const handleLogoGlowChange = makeThemeHandler("logo_glow", setLogoGlow);
  const handleLogoOpacityChange = makeThemeHandler("logo_opacity", setLogoOpacity);
  const handleLogoPaddingChange = makeThemeHandler("logo_padding", setLogoPadding);
  const handleLogoNameGapChange = makeThemeHandler("logo_name_gap", setLogoNameGap);
  const handleLogoVerticalAlignChange = makeThemeHandler("logo_vertical_align", setLogoVerticalAlign);
  const handleLogoPositionChange = makeThemeHandler("logo_position", setLogoPosition);
  const handleLogoSizeChange = makeThemeHandler("logo_size", setLogoSize);
  const handleCtaConfigChange = useCallback((newConfig: CtaItem[]) => {
    setCtaConfig(newConfig);
    saveThemeField({ cta_config: newConfig });
  }, [saveThemeField]);

  const handleAIGenerate = useCallback(async () => {
    if (!profile) return;
    const result = await generate({
      profession: professionName,
      name: profile.name || "",
      company: profile.company || undefined,
    });
    if (result) toast.success("AI content generated! It will appear on your published card.");
  }, [profile, professionName, generate]);

  // ── Theme resolution ──
  // Merge DB theme_json with any pending local fields for instant preview
  const effectiveThemeJson = useMemo(() => {
    const base = (card?.theme_json as any) ?? {};
    return { ...base, ...pendingThemeFields };
  }, [card?.theme_json, pendingThemeFields]);

  // Clear pending fields once DB has caught up
  useEffect(() => {
    if (Object.keys(pendingThemeFields).length > 0 && card?.theme_json) {
      const dbJson = card.theme_json as any;
      const allSynced = Object.keys(pendingThemeFields).every(
        key => JSON.stringify(dbJson[key]) === JSON.stringify(pendingThemeFields[key])
      );
      if (allSynced) setPendingThemeFields({});
    }
  }, [card?.theme_json, pendingThemeFields]);

  const savedThemeOverrides: CardThemeOverrides = {
    palette: effectiveThemeJson.palette ?? undefined,
    fonts: effectiveThemeJson.fonts ?? undefined,
    tokens: effectiveThemeJson.tokens ?? undefined,
    gradientBg: effectiveThemeJson.gradientBg ?? undefined,
    bgPattern: effectiveThemeJson.bgPattern ?? undefined,
    metallicEffect: effectiveThemeJson.metallicEffect ?? undefined,
  };

  // When theme editor is open, show live preview overrides; otherwise show saved
  const currentThemeOverrides: CardThemeOverrides = themePreviewOverrides
    ? { ...savedThemeOverrides, ...themePreviewOverrides }
    : savedThemeOverrides;

  const previewTheme: ResolvedCardTheme = useMemo(() => {
    const tokens = (stylePack?.theme_tokens as Record<string, any>) ?? {};
    const palettes = (stylePack?.default_palettes as any[]) ?? [];
    const basePalette = palettes[0] ?? FALLBACK_PALETTE;

    // Use live preview overrides from theme editor when available, then pending fields
    const liveOverrides = themePreviewOverrides ?? {};
    const effectivePalette = (liveOverrides as any).palette ?? effectiveThemeJson.palette;
    const effectiveFonts = (liveOverrides as any).fonts ?? effectiveThemeJson.fonts;
    const effectiveTokens = (liveOverrides as any).tokens ?? effectiveThemeJson.tokens;

    const palette = effectivePalette ? { ...basePalette, ...effectivePalette } : basePalette;
    let merged = { ...tokens };
    if (effectiveFonts) merged = { ...merged, fontPrimary: effectiveFonts.primary, fontSecondary: effectiveFonts.secondary };
    if (effectiveTokens) {
      const t = effectiveTokens;
      if (t.button) merged = { ...merged, button: { ...(merged.button ?? {}), ...t.button } };
      if (t.header) merged = { ...merged, header: { ...(merged.header ?? {}), ...t.header } };
      if (t.section) merged = { ...merged, section: { ...(merged.section ?? {}), ...t.section } };
      if (t.spacingScale) merged = { ...merged, spacingScale: t.spacingScale };
      if (t.shadow) merged = { ...merged, shadow: { ...(merged.shadow ?? {}), ...t.shadow } };
      if (t.radius) merged = { ...merged, radius: { ...(merged.radius ?? {}), ...t.radius } };
    }
    return resolveCardTheme(merged, palette);
  }, [stylePack, effectiveThemeJson, themePreviewOverrides]);

  const handleThemePreview = useCallback((overrides: CardThemeOverrides) => {
    setThemePreviewOverrides(overrides);
  }, []);

  const handleThemeSave = useCallback(async (overrides: CardThemeOverrides) => {
    setThemePreviewOverrides(null);
    const themeFields = {
      palette: overrides.palette,
      fonts: overrides.fonts,
      tokens: overrides.tokens,
      gradientBg: overrides.gradientBg,
      bgPattern: overrides.bgPattern,
      metallicEffect: overrides.metallicEffect,
      heroBackgroundId: (overrides as any).heroBackgroundId,
    };

    setPendingThemeFields(prev => {
      const next = { ...prev, ...themeFields };
      pendingThemeFieldsRef.current = next;
      return next;
    });

    try {
      const existing = (card?.theme_json as any) ?? {};
      await upsertCard.mutateAsync({
        sections_json: sections as any,
        status: published ? "published" : "draft",
        theme_json: { ...existing, ...pendingThemeFieldsRef.current, cover_url: coverUrlRef.current, ...themeFields } as any,
      });
      toast.success("Theme updated!");
    } catch { toast.error("Failed to save theme"); }
  }, [card, sections, published, upsertCard]);

  const handleThemeEditorOpenChange = useCallback((open: boolean) => {
    if (!open && themePreviewOverrides) {
      void handleThemeSave(themePreviewOverrides);
    }
    setThemeEditorOpen(open);
    if (!open) setThemePreviewOverrides(null);
  }, [themePreviewOverrides, handleThemeSave]);

  const handleDragEnd = useCallback((active: string, over: string) => {
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active);
      const newIndex = prev.findIndex((s) => s.id === over);
      const { arrayMove } = require("@dnd-kit/sortable");
      const next = arrayMove(prev, oldIndex, newIndex);
      saveSections(next);
      return next;
    });
  }, [saveSections]);

  return {
    // Data
    card, profile, stylePack, cardLoading,
    // Sections
    sections, setSections, toggleSection, handleSectionContentSave, handleCopyToSection,
    editingSection, setEditingSection,
    // Publish
    published, handlePublishToggle,
    // Identity
    editName, setEditName, editCompany, setEditCompany, editJobTitle, setEditJobTitle,
    jobTitle, setJobTitle, professionName, displayJobTitle,
    boldLastName, setBoldLastName,
    uppercaseName, setUppercaseName,
    nameLetterSpacing, setNameLetterSpacing,
    nameFontWeight, setNameFontWeight,
    firstNameFontWeight, setFirstNameFontWeight,
    nameItalic, setNameItalic,
    nameFontSize, setNameFontSize,
    subtitleFontSize, setSubtitleFontSize,
    identitySaveTimers, identitySaveState, setIdentitySaveState,
    // Photos / Logo
    avatarUrl, coverUrl, avatarBgColor, avatarRotation, coverOffsetY,
    logoUrl, logoFrostedBg, logoGlow, logoPosition, logoSize, logoOpacity, logoPadding, logoNameGap, logoVerticalAlign,
    handleAvatarChange, handleCoverChange,
    handleAvatarBgColorChange, handleAvatarRotationChange, handleCoverOffsetYChange,
    handleLogoChange, handleLogoFrostedBgChange, handleLogoGlowChange,
    handleLogoOpacityChange, handleLogoPaddingChange, handleLogoPositionChange, handleLogoSizeChange, handleLogoNameGapChange, handleLogoVerticalAlignChange,
    // CTA & Social
    ctaConfig, ctaIconsOnly, setCtaIconsOnly,
    socialIconsOnly, setSocialIconsOnly, socialBtnColor, setSocialBtnColor,
    socialBtnStyle, setSocialBtnStyle,
    handleCtaConfigChange,
    // Section display
    showSectionIcons, setShowSectionIcons,
    // Theme
    themeEditorOpen, setThemeEditorOpen: handleThemeEditorOpenChange,
    currentThemeOverrides, previewTheme, handleThemeSave, handleThemePreview,
    // Save
    saveThemeField, saveSections, globalSaveState,
    // AI
    handleAIGenerate, isGenerating, aiContent,
    // Drag
    handleDragEnd,
    // Query client
    qc,
  };
}
