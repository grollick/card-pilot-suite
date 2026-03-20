import CardTemplateChooser from "@/modules/card/components/CardTemplateChooser";
import {
  Palette, Pencil, Camera, Globe, Layers, Sliders, LayoutTemplate,
  Sparkles, Loader2, MousePointerClick, Crown, Plus, Eye, Smartphone,
  Type, PaintBucket, LayoutGrid, ChevronDown, Settings2,
} from "lucide-react";
import DesktopGuidanceNotice from "@/components/DesktopGuidanceNotice";
import BlockMarketplaceDialog from "@/modules/card/components/BlockMarketplaceDialog";
import { canAccessBlock, type MarketplaceBlock } from "@/lib/blockMarketplace";
import AIDesignAssistantDialog, { type AICardResult } from "@/modules/card/components/AIDesignAssistantDialog";
import ConversionTips from "@/modules/card/components/ConversionTips";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PhotoImportDialog, { type ImportedProject } from "@/modules/card/components/PhotoImportDialog";
import CardPhotoTools from "@/modules/card/components/CardPhotoTools";
import SectionEditor, { type SectionContent } from "@/modules/card/components/SectionEditor";
import CardAssistant from "@/modules/card/components/CardAssistant";
import CardThemeEditor from "@/modules/card/components/CardThemeEditor";
import CardBuilderHeader from "@/modules/card/components/CardBuilderHeader";
import CardBuilderIdentity from "@/modules/card/components/CardBuilderIdentity";
import CardBuilderSections from "@/modules/card/components/CardBuilderSections";
import CardBuilderPreview from "@/modules/card/components/CardBuilderPreview";
import BuilderSectionLibrary from "@/modules/card/components/BuilderSectionLibrary";
import TemplateSelector from "@/modules/card/components/TemplateSelector";
import { getTemplate } from "@/lib/cardTemplates";
import { useCardBuilderState } from "@/hooks/useCardBuilderState";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import CtaEditor from "@/modules/card/components/CtaEditor";

const TEMPLATE_STYLE_PALETTES: Record<string, { primary: string; secondary: string; accent: string; background: string }> = {
  Modern: { primary: "#2563eb", secondary: "#0f172a", accent: "#14b8a6", background: "#f8fafc" },
  Elegant: { primary: "#9f1239", secondary: "#3f1d2e", accent: "#d4a017", background: "#fffaf3" },
  Bold: { primary: "#dc2626", secondary: "#111827", accent: "#f59e0b", background: "#fff7ed" },
  Minimal: { primary: "#374151", secondary: "#111827", accent: "#6b7280", background: "#f9fafb" },
};

/* ── Collapsible section wrapper ── */
function PanelSection({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: typeof Layers; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-2.5 px-1 group">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">{title}</span>
        </div>
        <ChevronDown className={`h-3 w-3 text-muted-foreground/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function CardBuilder() {
  const s = useCardBuilderState();
  const { user } = useAuth();
  const { planKey } = usePlanLimits();
  const isPro = planKey !== "starter";
  const isMobile = useIsMobile();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateChooser, setShowTemplateChooser] = useState(false);
  const [photoImportOpen, setPhotoImportOpen] = useState(false);
  const [rightTab, setRightTab] = useState("content");
  const [previewDevice, setPreviewDevice] = useState<"phone" | "tablet">("phone");
  const [blockMarketOpen, setBlockMarketOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preview" | "sections" | "content" | "style">("preview");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── AI Card Generation ──
  const handleAICardGenerated = (result: AICardResult) => {
    const newSections = result.sections_order.map((id) => {
      const existing = s.sections.find((sec) => sec.id === id);
      const label = existing?.label || id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
      const content: Record<string, any> = existing?.content || {};
      if (id === "hero") content.tagline = result.hero.tagline;
      if (id === "about") content.text = result.about;
      if (id === "services") content.items = result.services;
      if (id === "testimonials") content.items = result.testimonials;
      if (id === "promo" || id === "offer_banner") {
        content.headline = result.promo.headline;
        content.body = result.promo.body;
        content.cta_text = result.promo.cta_text;
      }
      return { id, label, enabled: true, content };
    });
    s.sections.forEach((sec) => {
      if (!newSections.find((ns) => ns.id === sec.id)) {
        newSections.push({ ...sec, enabled: false, content: sec.content || {} });
      }
    });
    s.setSections(newSections);
    s.saveSections(newSections, true);
    s.saveThemeField({
      palette: {
        primary: result.theme.primary_color,
        secondary: result.theme.secondary_color,
        accent: result.theme.accent_color,
        background: result.theme.background_color,
      },
      ...(result.theme.font_primary && { fonts: { primary: result.theme.font_primary, secondary: result.theme.font_secondary || result.theme.font_primary } }),
      ...(result.theme.border_radius && { border_radius: result.theme.border_radius }),
    });
  };

  // ── Block marketplace ──
  const installedBlockIds = s.sections
    .filter((sec) => !["hero","about","services","projects","quote_calculator","testimonials","gallery","contact","quote_request","booking","social"].includes(sec.id))
    .map((sec) => sec.id);

  const handleInstallBlock = (block: MarketplaceBlock) => {
    if (s.sections.find((sec) => sec.id === block.id)) {
      toast.info(`${block.name} is already on your card.`);
      return;
    }
    const next = [...s.sections, { id: block.id, label: block.name, enabled: true, content: block.defaultContent }];
    s.setSections(next);
    s.saveSections(next, true);
    toast.success(`${block.name} added!`);
    setBlockMarketOpen(false);
  };

  const handlePhotoImport = async (projects: ImportedProject[]) => {
    if (!user || projects.length === 0) return;
    try {
      const inserts = projects.map((p) => ({
        user_id: user.id, title: p.title, description: p.description || null,
        after_image_url: p.imageUrl, before_image_url: p.beforeImageUrl || null,
        is_public: true, services_used: p.category ? [p.category] : [],
      }));
      const { error } = await supabase.from("projects").insert(inserts);
      if (error) throw error;
      toast.success(`${projects.length} projects imported!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to import");
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = getTemplate(templateId);
    if (!template) return;
    const newSections = template.sections.map(ts => {
      const existing = s.sections.find(es => es.id === ts.id);
      return { id: ts.id, label: existing?.label || ts.id.charAt(0).toUpperCase() + ts.id.slice(1).replace(/_/g, " "), enabled: ts.enabled, content: existing?.content };
    });
    s.sections.forEach(es => { if (!newSections.find(ns => ns.id === es.id)) newSections.push({ ...es, enabled: false } as any); });
    s.setSections(newSections);
    s.saveSections(newSections, true);
    const palette = TEMPLATE_STYLE_PALETTES[template.style];
    if (palette) s.saveThemeField({ palette: { ...palette } });
  };

  // ── Section duplicate / delete ──
  const handleDuplicateSection = (id: string) => {
    const original = s.sections.find((sec) => sec.id === id);
    if (!original) return;
    const newId = `${id}_copy_${Date.now()}`;
    const idx = s.sections.findIndex((sec) => sec.id === id);
    const next = [...s.sections];
    next.splice(idx + 1, 0, { ...original, id: newId, label: `${original.label} (Copy)` });
    s.setSections(next);
    s.saveSections(next, true);
    toast.success("Section duplicated");
  };

  const handleDeleteSection = (id: string) => {
    const next = s.sections.filter((sec) => sec.id !== id);
    s.setSections(next);
    s.saveSections(next, true);
    toast.success("Section removed");
  };

  const editingSec = s.sections.find((sec) => sec.id === s.editingSection);

  // Avatar theme props
  const avatarThemeProps = {
    avatarShape: s.previewTheme.header.avatarShape,
    onAvatarShapeChange: (shape: any) => {
      const existing = (s.card?.theme_json as any)?.tokens ?? {};
      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarShape: shape } } });
    },
    avatarBorderWidth: ((s.card?.theme_json as any)?.tokens?.header?.avatarBorderWidth) ?? 3,
    onAvatarBorderWidthChange: (val: number) => {
      const existing = (s.card?.theme_json as any)?.tokens ?? {};
      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBorderWidth: val } } });
    },
    avatarSize: ((s.card?.theme_json as any)?.tokens?.header?.avatarSize) ?? 80,
    onAvatarSizeChange: (val: number) => {
      const existing = (s.card?.theme_json as any)?.tokens ?? {};
      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarSize: val } } });
    },
    avatarBannerText: ((s.card?.theme_json as any)?.tokens?.header?.avatarBannerText) ?? "",
    onAvatarBannerTextChange: (val: string) => {
      const existing = (s.card?.theme_json as any)?.tokens ?? {};
      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerText: val } } });
    },
    avatarBannerBg: ((s.card?.theme_json as any)?.tokens?.header?.avatarBannerBg) ?? "",
    onAvatarBannerBgChange: (val: string) => {
      const existing = (s.card?.theme_json as any)?.tokens ?? {};
      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerBg: val } } });
    },
    avatarBannerPosition: ((s.card?.theme_json as any)?.tokens?.header?.avatarBannerPosition) ?? "bottom",
    onAvatarBannerPositionChange: (val: string) => {
      const existing = (s.card?.theme_json as any)?.tokens ?? {};
      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerPosition: val } } });
    },
    avatarBannerAnimation: ((s.card?.theme_json as any)?.tokens?.header?.avatarBannerAnimation) ?? "none",
    onAvatarBannerAnimationChange: (val: string) => {
      const existing = (s.card?.theme_json as any)?.tokens ?? {};
      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerAnimation: val } } });
    },
  };

  // Show template chooser for new cards (no existing card data)
  const isNewCard = !s.cardLoading && !s.card;

  if (s.cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading card…</span>
        </div>
      </div>
    );
  }

  if (isNewCard) {
    return (
      <CardTemplateChooser
        onSelect={(templateId) => {
          handleApplyTemplate(templateId);
        }}
        onSkip={() => {
          // Trigger card creation with defaults by saving
          s.saveSections(s.sections, true);
        }}
        professionName={s.professionName}
      />
    );
  }

  // ── Shared preview props ──
  const previewProps = {
    profile: s.profile, previewTheme: s.previewTheme,
    currentThemeOverrides: s.currentThemeOverrides, sections: s.sections,
    coverUrl: s.coverUrl, coverOffsetY: s.coverOffsetY,
    avatarUrl: s.avatarUrl, avatarBgColor: s.avatarBgColor, avatarRotation: s.avatarRotation,
    logoUrl: s.logoUrl, logoFrostedBg: s.logoFrostedBg, logoPosition: s.logoPosition,
    logoSize: s.logoSize, logoOpacity: s.logoOpacity, logoPadding: s.logoPadding,
    logoNameGap: s.logoNameGap, logoVerticalAlign: s.logoVerticalAlign,
    ctaConfig: s.ctaConfig, ctaIconsOnly: s.ctaIconsOnly,
    editName: s.editName, editCompany: s.editCompany, displayJobTitle: s.displayJobTitle,
    boldLastName: s.boldLastName, uppercaseName: s.uppercaseName,
    nameLetterSpacing: s.nameLetterSpacing, nameFontWeight: s.nameFontWeight,
    firstNameFontWeight: s.firstNameFontWeight, nameItalic: s.nameItalic,
    nameFontSize: s.nameFontSize, subtitleFontSize: s.subtitleFontSize,
    subtitleItalic: s.subtitleItalic, subtitleSpacing: s.subtitleSpacing,
    showCompany: s.showCompany, nameLineHeight: s.nameLineHeight,
    nameTextStroke: s.nameTextStroke, nameTextStrokeWidth: s.nameTextStrokeWidth,
    onAvatarChange: s.handleAvatarChange, setEditingSection: s.setEditingSection,
    identityPosition: s.identityPosition,
    onIdentityPositionChange: s.handleIdentityPositionChange,
    logoCustomPosition: s.logoCustomPosition,
    onLogoCustomPositionChange: s.handleLogoCustomPositionChange,
  };

  // ════════════════════════════════════════════════
  //  LEFT PANEL — Section Library (minimal)
  // ════════════════════════════════════════════════
  const leftPanel = (
    <div className="space-y-2">
      <PanelSection title="Templates" icon={LayoutTemplate} defaultOpen={false}>
        <TemplateSelector
          selectedTemplateId={selectedTemplateId}
          onSelect={handleApplyTemplate}
          professionName={s.professionName}
          compact
        />
      </PanelSection>

      <div className="h-px bg-border/20 my-2" />

      <BuilderSectionLibrary
        sections={s.sections}
        setSections={s.setSections}
        toggleSection={s.toggleSection}
        setEditingSection={s.setEditingSection}
        saveSections={s.saveSections}
        onDuplicate={handleDuplicateSection}
        onDelete={handleDeleteSection}
      />

      <Button
        variant="ghost"
        size="sm"
        className="w-full gap-1.5 text-[11px] text-muted-foreground/60 hover:text-primary border border-dashed border-border/30 hover:border-primary/30 h-9 mt-2 rounded-xl transition-all duration-200"
        onClick={() => setBlockMarketOpen(true)}
      >
        <Plus className="h-3 w-3" />
        Add Section
      </Button>

      <div className="h-px bg-border/20 my-2" />

      <PanelSection title="AI Tools" icon={Sparkles} defaultOpen={false}>
        <div className="space-y-2">
          <Button size="sm" className="w-full gap-1.5 h-9 text-[11px] rounded-lg" onClick={() => setAiAssistantOpen(true)}>
            <Sparkles className="h-3 w-3" /> AI Design Assistant
          </Button>
          <Button variant="outline" size="sm" className="w-full h-9 text-[11px] rounded-lg" onClick={s.handleAIGenerate} disabled={s.isGenerating}>
            {s.isGenerating ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
            {s.isGenerating ? "Writing…" : "AI Write Copy"}
          </Button>
        </div>
      </PanelSection>

      <ConversionTips sections={s.sections} />

      {!isPro && (
        <div className="rounded-xl border border-primary/8 bg-primary/[0.02] p-3 space-y-2 mt-3">
          <div className="flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">Unlock Pro</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Premium templates, animations, AI tools, and more.
          </p>
          <Button size="sm" className="w-full h-8 text-[10px] rounded-lg" onClick={() => window.location.href = "/app/pricing"}>
            Upgrade
          </Button>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════
  //  RIGHT PANEL — Content / Style / Layout tabs
  // ════════════════════════════════════════════════
  const rightPanel = (
    <Tabs value={rightTab} onValueChange={setRightTab} className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-10 mb-4 bg-muted/25 rounded-xl p-0.5 border border-border/20">
        <TabsTrigger value="content" className="text-[11px] gap-1.5 h-full rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
          <Pencil className="h-3 w-3" /> Content
        </TabsTrigger>
        <TabsTrigger value="style" className="text-[11px] gap-1.5 h-full rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
          <PaintBucket className="h-3 w-3" /> Style
        </TabsTrigger>
        <TabsTrigger value="layout" className="text-[11px] gap-1.5 h-full rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
          <LayoutGrid className="h-3 w-3" /> Layout
        </TabsTrigger>
      </TabsList>

      {/* ── Content Tab ── */}
      <TabsContent value="content" className="mt-0 space-y-3">
        <PanelSection title="Identity" icon={Type}>
          <CardBuilderIdentity
            profile={s.profile} editName={s.editName} setEditName={s.setEditName}
            editCompany={s.editCompany} setEditCompany={s.setEditCompany}
            editJobTitle={s.editJobTitle} setEditJobTitle={s.setEditJobTitle}
            jobTitle={s.jobTitle} setJobTitle={s.setJobTitle}
            boldLastName={s.boldLastName} setBoldLastName={s.setBoldLastName}
            uppercaseName={s.uppercaseName} setUppercaseName={s.setUppercaseName}
            professionName={s.professionName}
            identitySaveTimers={s.identitySaveTimers}
            identitySaveState={s.identitySaveState} setIdentitySaveState={s.setIdentitySaveState}
            nameLetterSpacing={s.nameLetterSpacing} setNameLetterSpacing={s.setNameLetterSpacing}
            nameFontWeight={s.nameFontWeight} setNameFontWeight={s.setNameFontWeight}
            firstNameFontWeight={s.firstNameFontWeight} setFirstNameFontWeight={s.setFirstNameFontWeight}
            nameItalic={s.nameItalic} setNameItalic={s.setNameItalic}
            nameFontSize={s.nameFontSize} setNameFontSize={s.setNameFontSize}
            subtitleFontSize={s.subtitleFontSize} setSubtitleFontSize={s.setSubtitleFontSize}
            subtitleItalic={s.subtitleItalic} setSubtitleItalic={s.setSubtitleItalic}
            subtitleSpacing={s.subtitleSpacing} setSubtitleSpacing={s.setSubtitleSpacing}
            showCompany={s.showCompany} setShowCompany={s.setShowCompany}
            nameLineHeight={s.nameLineHeight} setNameLineHeight={s.setNameLineHeight}
            nameTextStroke={s.nameTextStroke} setNameTextStroke={s.setNameTextStroke}
            nameTextStrokeWidth={s.nameTextStrokeWidth} setNameTextStrokeWidth={s.setNameTextStrokeWidth}
            saveThemeField={s.saveThemeField} qc={s.qc} hideWrapper
          />
        </PanelSection>

        {/* CTA Buttons */}
        <PanelSection title="CTA Buttons" icon={MousePointerClick}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Icons only</span>
              <Switch checked={s.ctaIconsOnly} onCheckedChange={(v) => { s.setCtaIconsOnly(v); s.saveThemeField({ cta_icons_only: v }); }} className="scale-[0.7]" />
            </div>
            <CtaEditor ctas={s.ctaConfig} onChange={s.handleCtaConfigChange} />
          </div>
        </PanelSection>

        {/* Media */}
        <PanelSection title="Photos & Media" icon={Camera}>
          <CardPhotoTools
            avatarUrl={s.avatarUrl} coverUrl={s.coverUrl} profession={s.professionName}
            onAvatarChange={s.handleAvatarChange} onCoverChange={s.handleCoverChange}
            avatarBgColor={s.avatarBgColor} avatarRotation={s.avatarRotation}
            onAvatarBgColorChange={s.handleAvatarBgColorChange}
            onAvatarRotationChange={s.handleAvatarRotationChange}
            coverOffsetY={s.coverOffsetY} onCoverOffsetYChange={s.handleCoverOffsetYChange}
            logoUrl={s.logoUrl} onLogoChange={s.handleLogoChange}
            logoFrostedBg={s.logoFrostedBg} onLogoFrostedBgChange={s.handleLogoFrostedBgChange}
            logoGlow={s.logoGlow} onLogoGlowChange={s.handleLogoGlowChange}
            logoPosition={s.logoPosition} onLogoPositionChange={s.handleLogoPositionChange}
            logoSize={s.logoSize} onLogoSizeChange={s.handleLogoSizeChange}
            logoOpacity={s.logoOpacity} onLogoOpacityChange={s.handleLogoOpacityChange}
            logoPadding={s.logoPadding} onLogoPaddingChange={s.handleLogoPaddingChange}
            logoNameGap={s.logoNameGap} onLogoNameGapChange={s.handleLogoNameGapChange}
            logoVerticalAlign={s.logoVerticalAlign} onLogoVerticalAlignChange={s.handleLogoVerticalAlignChange}
            {...avatarThemeProps}
          />
          <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-[11px]" onClick={() => setPhotoImportOpen(true)}>
            <Globe className="h-3 w-3 mr-1.5" /> Import from URL
          </Button>
        </PanelSection>
      </TabsContent>

      {/* ── Style Tab ── */}
      <TabsContent value="style" className="mt-0 space-y-3">
        <Button variant="outline" className="w-full h-9 text-[12px] gap-2 border-border/50 hover:border-primary/30" onClick={() => s.setThemeEditorOpen(true)}>
          <Sliders className="h-3.5 w-3.5" /> Open Full Theme Editor
        </Button>

        {/* Color Palette */}
        <PanelSection title="Colors" icon={Palette}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Primary", color: s.previewTheme.palette.primary },
              { label: "Secondary", color: s.previewTheme.palette.secondary },
              { label: "Accent", color: s.previewTheme.palette.accent },
              { label: "Background", color: s.previewTheme.palette.background },
            ].map((c) => (
              <div key={c.label} className="text-center group">
                <div
                  className="h-9 rounded-lg border border-border/40 shadow-sm transition-all duration-200 cursor-pointer group-hover:scale-105 group-hover:shadow-md"
                  style={{ background: c.color }}
                />
                <span className="text-[9px] text-muted-foreground/70 mt-1 block">{c.label}</span>
              </div>
            ))}
          </div>
        </PanelSection>

        {/* Typography */}
        <PanelSection title="Typography" icon={Type}>
          <div className="rounded-lg border border-border/40 p-3 space-y-2 bg-muted/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Heading</span>
              <span className="font-medium" style={{ fontFamily: s.previewTheme.fonts.primary }}>{s.previewTheme.fonts.primary}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Body</span>
              <span className="font-medium" style={{ fontFamily: s.previewTheme.fonts.secondary }}>{s.previewTheme.fonts.secondary}</span>
            </div>
          </div>
        </PanelSection>

        {/* Social Button Style */}
        <PanelSection title="Social Links" icon={Globe} defaultOpen={false}>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Icons only</span>
              <Switch checked={s.socialIconsOnly} onCheckedChange={(v) => { s.setSocialIconsOnly(v); s.saveThemeField({ social_icons_only: v }); }} className="scale-[0.7]" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Style</span>
              <div className="flex gap-0.5 rounded-lg border border-border/40 bg-muted/30 p-0.5">
                {(["auto", "filled", "outline"] as const).map((st) => (
                  <button key={st} onClick={() => { s.setSocialBtnStyle(st); s.saveThemeField({ social_btn_style: st }); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-150 ${s.socialBtnStyle === st ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >{st.charAt(0).toUpperCase() + st.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Color</span>
              <div className="flex items-center gap-2">
                <input type="color" value={s.socialBtnColor || "#4361ee"}
                  onChange={(e) => { s.setSocialBtnColor(e.target.value); s.saveThemeField({ social_btn_color: e.target.value }); }}
                  className="h-6 w-6 rounded-md border border-border/40 cursor-pointer bg-transparent p-0"
                />
                {s.socialBtnColor && (
                  <button onClick={() => { s.setSocialBtnColor(""); s.saveThemeField({ social_btn_color: "" }); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Reset</button>
                )}
              </div>
            </div>
          </div>
        </PanelSection>
      </TabsContent>

      {/* ── Layout Tab ── */}
      <TabsContent value="layout" className="mt-0 space-y-3">
        {/* Quick settings */}
        <PanelSection title="Display Settings" icon={Settings2}>
          <div className="space-y-2 rounded-lg border border-border/40 p-3 bg-muted/10">
            {[
              { label: "Section icons", checked: s.showSectionIcons, onChange: (val: boolean) => { s.setShowSectionIcons(val); s.saveThemeField({ section_icons: val }); } },
              { label: "Social icons only", checked: s.socialIconsOnly, onChange: (v: boolean) => { s.setSocialIconsOnly(v); s.saveThemeField({ social_icons_only: v }); } },
              { label: "CTA icons only", checked: s.ctaIconsOnly, onChange: (v: boolean) => { s.setCtaIconsOnly(v); s.saveThemeField({ cta_icons_only: v }); } },
              { label: "Scan to Save", checked: (s.card?.theme_json as any)?.scan_to_save === true, onChange: (v: boolean) => { s.saveThemeField({ scan_to_save: v }); } },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <Switch checked={item.checked} onCheckedChange={item.onChange} className="scale-[0.7]" />
              </div>
            ))}
          </div>
        </PanelSection>

        {/* Section order management */}
        <PanelSection title="Section Order" icon={Layers}>
          <CardBuilderSections
            sections={s.sections} setSections={s.setSections}
            toggleSection={s.toggleSection} setEditingSection={s.setEditingSection}
            showSectionIcons={s.showSectionIcons} setShowSectionIcons={s.setShowSectionIcons}
            saveThemeField={s.saveThemeField} saveSections={s.saveSections}
            isGenerating={s.isGenerating} aiContent={s.aiContent} onAIGenerate={s.handleAIGenerate}
            ctaConfig={s.ctaConfig} ctaIconsOnly={s.ctaIconsOnly} setCtaIconsOnly={s.setCtaIconsOnly}
            onCtaConfigChange={s.handleCtaConfigChange}
            socialIconsOnly={s.socialIconsOnly} setSocialIconsOnly={s.setSocialIconsOnly}
            socialBtnColor={s.socialBtnColor} setSocialBtnColor={s.setSocialBtnColor}
            socialBtnStyle={s.socialBtnStyle} setSocialBtnStyle={s.setSocialBtnStyle}
            hideWrapper
          />
        </PanelSection>
      </TabsContent>
    </Tabs>
  );

  // ── Mobile tab config ──
  const mobileTabs = [
    { id: "preview" as const, label: "Preview", icon: Smartphone },
    { id: "sections" as const, label: "Sections", icon: Layers },
    { id: "content" as const, label: "Content", icon: Pencil },
    { id: "style" as const, label: "Style", icon: Palette },
  ];

  return (
    <div className="flex flex-col -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8" style={{ height: "calc(100vh - 3.5rem)" }}>
      <DesktopGuidanceNotice toolKey="card-builder" />

      {/* ── Top Bar ── */}
      <CardBuilderHeader
        globalSaveState={s.globalSaveState}
        published={s.published}
        onPublishToggle={s.handlePublishToggle}
        handle={s.profile?.handle}
        name={s.profile?.name}
        previewDevice={previewDevice}
        onPreviewDeviceChange={setPreviewDevice}
      />

      {/* ══════════════════════════════════════════════════ */}
      {/*  DESKTOP — Three-panel layout                     */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel — Section Library */}
          <ResizablePanel defaultSize={17} minSize={14} maxSize={22}>
            <div className="h-full flex flex-col bg-background border-r border-border/30">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 shrink-0">
                <Layers className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-[11px] font-semibold tracking-wide text-foreground/80">Components</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-2">
                  {leftPanel}
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border/20 hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/40" />

          {/* Center Panel — Preview Canvas */}
          <ResizablePanel defaultSize={50} minSize={34}>
            <div className="h-full flex flex-col bg-muted/30" style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border) / 0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}>
              <div className="flex-1 overflow-y-auto">
                <div className="p-8 flex items-start justify-center min-h-full">
                  <div className="w-full max-w-md">
                    <CardBuilderPreview {...previewProps} previewDevice={previewDevice} hideToolbar />
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border/20 hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/40" />

          {/* Right Panel — Design Controls */}
          <ResizablePanel defaultSize={33} minSize={24} maxSize={42}>
            <div className="h-full flex flex-col bg-background border-l border-border/30">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 shrink-0">
                <Settings2 className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-[11px] font-semibold tracking-wide text-foreground/80">Inspector</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-3">
                  {rightPanel}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/*  MOBILE — Tab-based layout                        */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {mobileTab === "preview" && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                <CardBuilderPreview {...previewProps} />
              </motion.div>
            )}

            {mobileTab === "sections" && (
              <motion.div key="sections" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
                <TemplateSelector selectedTemplateId={selectedTemplateId} onSelect={handleApplyTemplate} professionName={s.professionName} compact />
                <CardBuilderSections
                  sections={s.sections} setSections={s.setSections}
                  toggleSection={s.toggleSection} setEditingSection={s.setEditingSection}
                  showSectionIcons={s.showSectionIcons} setShowSectionIcons={s.setShowSectionIcons}
                  saveThemeField={s.saveThemeField} saveSections={s.saveSections}
                  isGenerating={s.isGenerating} aiContent={s.aiContent} onAIGenerate={s.handleAIGenerate}
                  ctaConfig={s.ctaConfig} ctaIconsOnly={s.ctaIconsOnly} setCtaIconsOnly={s.setCtaIconsOnly}
                  onCtaConfigChange={s.handleCtaConfigChange}
                  socialIconsOnly={s.socialIconsOnly} setSocialIconsOnly={s.setSocialIconsOnly}
                  socialBtnColor={s.socialBtnColor} setSocialBtnColor={s.setSocialBtnColor}
                  socialBtnStyle={s.socialBtnStyle} setSocialBtnStyle={s.setSocialBtnStyle}
                  hideWrapper
                />
                <Button variant="ghost" size="sm" className="w-full gap-1.5 border border-dashed border-border/50 text-muted-foreground" onClick={() => setBlockMarketOpen(true)}>
                  <Plus className="h-3 w-3" /> Add Section
                </Button>
              </motion.div>
            )}

            {mobileTab === "content" && (
              <motion.div key="content" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4">
                <CardBuilderIdentity
                  profile={s.profile} editName={s.editName} setEditName={s.setEditName}
                  editCompany={s.editCompany} setEditCompany={s.setEditCompany}
                  editJobTitle={s.editJobTitle} setEditJobTitle={s.setEditJobTitle}
                  jobTitle={s.jobTitle} setJobTitle={s.setJobTitle}
                  boldLastName={s.boldLastName} setBoldLastName={s.setBoldLastName}
                  uppercaseName={s.uppercaseName} setUppercaseName={s.setUppercaseName}
                  professionName={s.professionName}
                  identitySaveTimers={s.identitySaveTimers}
                  identitySaveState={s.identitySaveState} setIdentitySaveState={s.setIdentitySaveState}
                  nameLetterSpacing={s.nameLetterSpacing} setNameLetterSpacing={s.setNameLetterSpacing}
                  nameFontWeight={s.nameFontWeight} setNameFontWeight={s.setNameFontWeight}
                  firstNameFontWeight={s.firstNameFontWeight} setFirstNameFontWeight={s.setFirstNameFontWeight}
                  nameItalic={s.nameItalic} setNameItalic={s.setNameItalic}
                  nameFontSize={s.nameFontSize} setNameFontSize={s.setNameFontSize}
                  subtitleFontSize={s.subtitleFontSize} setSubtitleFontSize={s.setSubtitleFontSize}
                  subtitleItalic={s.subtitleItalic} setSubtitleItalic={s.setSubtitleItalic}
                  subtitleSpacing={s.subtitleSpacing} setSubtitleSpacing={s.setSubtitleSpacing}
                  showCompany={s.showCompany} setShowCompany={s.setShowCompany}
                  nameLineHeight={s.nameLineHeight} setNameLineHeight={s.setNameLineHeight}
                  nameTextStroke={s.nameTextStroke} setNameTextStroke={s.setNameTextStroke}
                  nameTextStrokeWidth={s.nameTextStrokeWidth} setNameTextStrokeWidth={s.setNameTextStrokeWidth}
                  saveThemeField={s.saveThemeField} qc={s.qc} hideWrapper
                />
                <div className="mt-4">
                  <CardPhotoTools
                    avatarUrl={s.avatarUrl} coverUrl={s.coverUrl} profession={s.professionName}
                    onAvatarChange={s.handleAvatarChange} onCoverChange={s.handleCoverChange}
                    avatarBgColor={s.avatarBgColor} avatarRotation={s.avatarRotation}
                    onAvatarBgColorChange={s.handleAvatarBgColorChange}
                    onAvatarRotationChange={s.handleAvatarRotationChange}
                    coverOffsetY={s.coverOffsetY} onCoverOffsetYChange={s.handleCoverOffsetYChange}
                    logoUrl={s.logoUrl} onLogoChange={s.handleLogoChange}
                    logoFrostedBg={s.logoFrostedBg} onLogoFrostedBgChange={s.handleLogoFrostedBgChange}
                    logoGlow={s.logoGlow} onLogoGlowChange={s.handleLogoGlowChange}
                    logoPosition={s.logoPosition} onLogoPositionChange={s.handleLogoPositionChange}
                    logoSize={s.logoSize} onLogoSizeChange={s.handleLogoSizeChange}
                    logoOpacity={s.logoOpacity} onLogoOpacityChange={s.handleLogoOpacityChange}
                    logoPadding={s.logoPadding} onLogoPaddingChange={s.handleLogoPaddingChange}
                    logoNameGap={s.logoNameGap} onLogoNameGapChange={s.handleLogoNameGapChange}
                    logoVerticalAlign={s.logoVerticalAlign} onLogoVerticalAlignChange={s.handleLogoVerticalAlignChange}
                    {...avatarThemeProps}
                  />
                </div>
              </motion.div>
            )}

            {mobileTab === "style" && (
              <motion.div key="style" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
                <Button variant="outline" className="w-full gap-2" onClick={() => s.setThemeEditorOpen(true)}>
                  <Sliders className="h-4 w-4" /> Theme Editor
                </Button>
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Palette</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Primary", color: s.previewTheme.palette.primary },
                      { label: "Secondary", color: s.previewTheme.palette.secondary },
                      { label: "Accent", color: s.previewTheme.palette.accent },
                      { label: "Bg", color: s.previewTheme.palette.background },
                    ].map((c) => (
                      <div key={c.label} className="text-center">
                        <div className="h-10 rounded-lg border border-border/40 shadow-sm" style={{ background: c.color }} />
                        <span className="text-[10px] text-muted-foreground mt-1 block">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5 rounded-lg border border-border/40 p-3 bg-muted/10">
                  {[
                    { label: "Section icons", checked: s.showSectionIcons, onChange: (val: boolean) => { s.setShowSectionIcons(val); s.saveThemeField({ section_icons: val }); } },
                    { label: "CTA icons only", checked: s.ctaIconsOnly, onChange: (v: boolean) => { s.setCtaIconsOnly(v); s.saveThemeField({ cta_icons_only: v }); } },
                    { label: "Social icons only", checked: s.socialIconsOnly, onChange: (v: boolean) => { s.setSocialIconsOnly(v); s.saveThemeField({ social_icons_only: v }); } },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <Switch checked={item.checked} onCheckedChange={item.onChange} />
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full gap-1.5" onClick={() => setAiAssistantOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5" /> AI Design Assistant
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom tab bar */}
        <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm safe-area-bottom">
          <div className="grid grid-cols-4 h-13">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-150 ${
                  mobileTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className={`h-4.5 w-4.5 transition-transform duration-150 ${mobileTab === tab.id ? "scale-110" : ""}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      {editingSec && (
        <SectionEditor
          sectionId={editingSec.id}
          sectionLabel={editingSec.label}
          content={(editingSec.content || {}) as SectionContent}
          open={!!s.editingSection}
          onOpenChange={(open) => { if (!open) s.setEditingSection(null); }}
          onSave={(content) => s.handleSectionContentSave(editingSec.id, content)}
          profession={(s.profile as any)?.professions?.name ?? ""}
          userName={s.profile?.name ?? ""}
          company={s.profile?.company ?? ""}
        />
      )}

      <CardThemeEditor
        open={s.themeEditorOpen}
        onOpenChange={s.setThemeEditorOpen}
        currentOverrides={s.currentThemeOverrides}
        stylePackPalettes={(s.stylePack?.default_palettes as any[]) ?? undefined}
        stylePackFonts={
          s.stylePack?.theme_tokens
            ? { primary: (s.stylePack.theme_tokens as any).fontPrimary ?? "Inter", secondary: (s.stylePack.theme_tokens as any).fontSecondary ?? "Inter" }
            : undefined
        }
        stylePackTokens={(s.stylePack?.theme_tokens as Record<string, any>) ?? undefined}
        onSave={s.handleThemeSave}
        onPreview={s.handleThemePreview}
      />

      <CardAssistant
        context={{
          name: s.profile?.name || "",
          profession: s.professionName,
          company: s.profile?.company || undefined,
          sections: s.sections.filter((sec) => sec.enabled).map((sec) => sec.label).join(", "),
          hasAvatar: !!s.avatarUrl,
          hasBackdrop: !!s.coverUrl,
          cardStatus: s.published ? "published" : "draft",
        }}
        sectionTargets={s.sections.map((sec) => ({ id: sec.id, label: sec.label, enabled: sec.enabled }))}
        onCopyToSection={s.handleCopyToSection}
      />

      <PhotoImportDialog
        open={photoImportOpen}
        onOpenChange={setPhotoImportOpen}
        profession={s.professionName}
        onImportComplete={handlePhotoImport}
      />

      <BlockMarketplaceDialog
        open={blockMarketOpen}
        onOpenChange={setBlockMarketOpen}
        installedBlockIds={installedBlockIds}
        onInstallBlock={handleInstallBlock}
        userPlan={planKey}
      />

      <AIDesignAssistantDialog
        open={aiAssistantOpen}
        onOpenChange={setAiAssistantOpen}
        onCardGenerated={handleAICardGenerated}
        userName={s.profile?.name || undefined}
        userCompany={s.profile?.company || undefined}
        userProfession={s.professionName}
        isPro={isPro}
      />
    </div>
  );
}
