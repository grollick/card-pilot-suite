import { Palette, Pencil, Camera, Globe, Layers, Sliders, LayoutTemplate, Sparkles, Loader2, MousePointerClick, Crown, Plus, Eye, Smartphone } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

import { motion } from "framer-motion";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const TEMPLATE_STYLE_PALETTES: Record<string, { primary: string; secondary: string; accent: string; background: string }> = {
  Modern: { primary: "#2563eb", secondary: "#0f172a", accent: "#14b8a6", background: "#f8fafc" },
  Elegant: { primary: "#9f1239", secondary: "#3f1d2e", accent: "#d4a017", background: "#fffaf3" },
  Bold: { primary: "#dc2626", secondary: "#111827", accent: "#f59e0b", background: "#fff7ed" },
  Minimal: { primary: "#374151", secondary: "#111827", accent: "#6b7280", background: "#f9fafb" },
};

export default function CardBuilder() {
  const s = useCardBuilderState();
  const { user } = useAuth();
  const { planKey } = usePlanLimits();
  const isPro = planKey !== "starter";
  const isMobile = useIsMobile();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [photoImportOpen, setPhotoImportOpen] = useState(false);
  const [rightTab, setRightTab] = useState("identity");
  const [previewDevice, setPreviewDevice] = useState<"phone" | "tablet">("phone");
  const [blockMarketOpen, setBlockMarketOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preview" | "sections" | "identity" | "theme">("preview");

  const handleAICardGenerated = (result: AICardResult) => {
    // Apply sections order
    const newSections = result.sections_order.map((id) => {
      const existing = s.sections.find((sec) => sec.id === id);
      const label = existing?.label || id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
      const content: Record<string, any> = existing?.content || {};

      // Populate section content from AI result
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
    // Keep disabled sections not in the AI order
    s.sections.forEach((sec) => {
      if (!newSections.find((ns) => ns.id === sec.id)) {
        newSections.push({ ...sec, enabled: false, content: sec.content || {} });
      }
    });
    s.setSections(newSections);
    s.saveSections(newSections, true);

    // Apply theme
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

  // Track installed marketplace blocks
  const installedBlockIds = s.sections
    .filter((sec) => !["hero","about","services","projects","quote_calculator","testimonials","gallery","contact","quote_request","booking","social"].includes(sec.id))
    .map((sec) => sec.id);

  const handleInstallBlock = (block: MarketplaceBlock) => {
    if (s.sections.find((sec) => sec.id === block.id)) {
      toast.info(`${block.name} is already on your card.`);
      return;
    }
    const newSection = {
      id: block.id,
      label: block.name,
      enabled: true,
      content: block.defaultContent,
    };
    const next = [...s.sections, newSection];
    s.setSections(next);
    s.saveSections(next, true);
    toast.success(`${block.name} added to your card!`);
    setBlockMarketOpen(false);
  };

  const handlePhotoImport = async (projects: ImportedProject[]) => {
    if (!user || projects.length === 0) return;
    try {
      const inserts = projects.map((p) => ({
        user_id: user.id,
        title: p.title,
        description: p.description || null,
        after_image_url: p.imageUrl,
        before_image_url: p.beforeImageUrl || null,
        is_public: true,
        services_used: p.category ? [p.category] : [],
      }));
      const { error } = await supabase.from("projects").insert(inserts);
      if (error) throw error;
      toast.success(`${projects.length} projects added to your gallery!`);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err.message || "Failed to save imported projects");
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = getTemplate(templateId);
    if (!template) return;

    const newSections = template.sections.map(ts => {
      const existing = s.sections.find(es => es.id === ts.id);
      return {
        id: ts.id,
        label: existing?.label || ts.id.charAt(0).toUpperCase() + ts.id.slice(1).replace(/_/g, " "),
        enabled: ts.enabled,
        content: existing?.content,
      };
    });

    s.sections.forEach(es => {
      if (!newSections.find(ns => ns.id === es.id)) {
        newSections.push({ ...es, enabled: false } as any);
      }
    });

    s.setSections(newSections);
    s.saveSections(newSections, true);

    const palette = TEMPLATE_STYLE_PALETTES[template.style];
    if (palette) {
      s.saveThemeField({ palette: { ...palette } });
    }
  };

  const editingSec = s.sections.find((sec) => sec.id === s.editingSection);

  // Shared avatar theme props
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

  if (s.cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading card…</div>
      </div>
    );
  }

  // ── Left panel: Component library ──
  const leftPanelContent = (
    <div className="space-y-4">
      {/* Templates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Templates</span>
        </div>
        <TemplateSelector
          selectedTemplateId={selectedTemplateId}
          onSelect={handleApplyTemplate}
          professionName={s.professionName}
          compact
        />
      </div>

      {/* Section library */}
      <BuilderSectionLibrary
        sections={s.sections}
        setSections={s.setSections}
        toggleSection={s.toggleSection}
        setEditingSection={s.setEditingSection}
        saveSections={s.saveSections}
      />

      {/* Block Marketplace trigger */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 border-dashed border-primary/30 text-primary hover:bg-primary/5"
        onClick={() => setBlockMarketOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Browse Block Marketplace
      </Button>

      {/* AI Tools */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Tools</span>
        </div>
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={() => setAiAssistantOpen(true)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate My Card with AI
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={s.handleAIGenerate} disabled={s.isGenerating}>
          {s.isGenerating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
          {s.isGenerating ? "Generating…" : "AI Write Copy Only"}
        </Button>
        {s.aiContent && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Tagline</p>
            <p className="text-xs">{s.aiContent.tagline}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-2 mb-1">Bio</p>
            <p className="text-xs">{s.aiContent.bio}</p>
          </div>
        )}
      </div>

      {/* CTA & Social config */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CTA Buttons</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground">Icons</span>
            <Switch checked={s.ctaIconsOnly} onCheckedChange={(v) => { s.setCtaIconsOnly(v); s.saveThemeField({ cta_icons_only: v }); }} className="scale-[0.65]" />
          </div>
        </div>
      </div>

      {/* Conversion Tips */}
      <ConversionTips sections={s.sections} />

      {/* Premium features hint */}
      {!isPro && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Unlock Pro Features</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Upgrade to unlock unlimited sections, animation effects, advanced layouts, AI design assistant, and more.
          </p>
          <Button variant="default" size="sm" className="w-full text-xs" onClick={() => window.location.href = "/app/pricing"}>
            Upgrade Plan
          </Button>
        </div>
      )}
    </div>
  );

  // ── Right panel: Design controls ──
  const rightPanelContent = (
    <Tabs value={rightTab} onValueChange={setRightTab} className="w-full">
      <TabsList className="w-full grid grid-cols-3 mb-3 h-9">
        <TabsTrigger value="identity" className="text-[11px] gap-1">
          <Pencil className="h-3 w-3" /> Identity
        </TabsTrigger>
        <TabsTrigger value="photos" className="text-[11px] gap-1">
          <Camera className="h-3 w-3" /> Media
        </TabsTrigger>
        <TabsTrigger value="theme" className="text-[11px] gap-1">
          <Palette className="h-3 w-3" /> Theme
        </TabsTrigger>
      </TabsList>

      <TabsContent value="identity" className="mt-0">
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
           nameLineHeight={s.nameLineHeight} setNameLineHeight={s.setNameLineHeight}
           saveThemeField={s.saveThemeField} qc={s.qc} hideWrapper
        />
      </TabsContent>

      <TabsContent value="photos" className="mt-0 space-y-3">
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
        <div className="pt-2 border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setPhotoImportOpen(true)}>
            <Globe className="h-3.5 w-3.5 mr-2" /> Import Photos from URL
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="theme" className="mt-0 space-y-4">
        {/* Open full theme editor */}
        <Button variant="default" className="w-full" onClick={() => s.setThemeEditorOpen(true)}>
          <Sliders className="h-4 w-4 mr-2" /> Open Theme Editor
        </Button>

        {/* Quick palette preview */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Palette</span>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Primary", color: s.previewTheme.palette.primary },
              { label: "Secondary", color: s.previewTheme.palette.secondary },
              { label: "Accent", color: s.previewTheme.palette.accent },
              { label: "Bg", color: s.previewTheme.palette.background },
            ].map((c) => (
              <div key={c.label} className="text-center">
                <div className="h-8 rounded-md border border-border" style={{ background: c.color }} />
                <span className="text-[9px] text-muted-foreground mt-0.5 block">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Typography</span>
          <div className="rounded-lg border border-border p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Heading</span>
              <span className="font-medium" style={{ fontFamily: s.previewTheme.fonts.primary }}>{s.previewTheme.fonts.primary}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Body</span>
              <span className="font-medium" style={{ fontFamily: s.previewTheme.fonts.secondary }}>{s.previewTheme.fonts.secondary}</span>
            </div>
          </div>
        </div>

        {/* Quick settings */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Settings</span>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Section icons</span>
              <Switch checked={s.showSectionIcons} onCheckedChange={(val) => { s.setShowSectionIcons(val); s.saveThemeField({ section_icons: val }); }} className="scale-75" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Social icons only</span>
              <Switch checked={s.socialIconsOnly} onCheckedChange={(v) => { s.setSocialIconsOnly(v); s.saveThemeField({ social_icons_only: v }); }} className="scale-75" />
            </div>
          </div>
        </div>

        {/* Social style */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Social Button Style</span>
          <div className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
            {(["auto", "filled", "outline"] as const).map((st) => (
              <button key={st} onClick={() => { s.setSocialBtnStyle(st); s.saveThemeField({ social_btn_style: st }); }}
                className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${s.socialBtnStyle === st ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >{st.charAt(0).toUpperCase() + st.slice(1)}</button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Button color</span>
            <div className="flex items-center gap-1.5">
              <input type="color" value={s.socialBtnColor || "#4361ee"}
                onChange={(e) => { s.setSocialBtnColor(e.target.value); s.saveThemeField({ social_btn_color: e.target.value }); }}
                className="h-6 w-6 rounded border border-border cursor-pointer bg-transparent p-0"
              />
              {s.socialBtnColor && (
                <button onClick={() => { s.setSocialBtnColor(""); s.saveThemeField({ social_btn_color: "" }); }}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Reset</button>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  // Mobile tab config

  // Mobile tab config
  const mobileTabs = [
    { id: "preview" as const, label: "Preview", icon: Smartphone },
    { id: "sections" as const, label: "Sections", icon: Layers },
    { id: "identity" as const, label: "Identity", icon: Pencil },
    { id: "theme" as const, label: "Theme", icon: Palette },
  ];

  return (
    <div className="flex flex-col -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8" style={{ height: "calc(100vh - 3.5rem)" }}>
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

      {/* ── Desktop: Three-panel layout ── */}
      <div className="hidden lg:flex flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel — Components */}
          <ResizablePanel defaultSize={20} minSize={16} maxSize={28}>
            <div className="h-full flex flex-col bg-card border-r border-border">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Components</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  {leftPanelContent}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel — Preview Canvas (no duplicate toolbar) */}
          <ResizablePanel defaultSize={46} minSize={30}>
            <div className="h-full flex flex-col" style={{
              background: "radial-gradient(circle, hsl(var(--muted)) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}>
              <ScrollArea className="flex-1">
                <div className="p-6 flex items-start justify-center min-h-full">
                  <div className="w-full max-w-md">
                    <CardBuilderPreview
                      profile={s.profile}
                      previewTheme={s.previewTheme}
                      currentThemeOverrides={s.currentThemeOverrides}
                      sections={s.sections}
                      coverUrl={s.coverUrl}
                      coverOffsetY={s.coverOffsetY}
                      avatarUrl={s.avatarUrl}
                      avatarBgColor={s.avatarBgColor}
                      avatarRotation={s.avatarRotation}
                      logoUrl={s.logoUrl}
                      logoFrostedBg={s.logoFrostedBg}
                      logoPosition={s.logoPosition}
                      logoSize={s.logoSize}
                      logoOpacity={s.logoOpacity}
                      logoPadding={s.logoPadding}
                      logoNameGap={s.logoNameGap}
                      logoVerticalAlign={s.logoVerticalAlign}
                      ctaConfig={s.ctaConfig}
                      ctaIconsOnly={s.ctaIconsOnly}
                      editName={s.editName}
                      editCompany={s.editCompany}
                      displayJobTitle={s.displayJobTitle}
                      boldLastName={s.boldLastName}
                      uppercaseName={s.uppercaseName}
                      nameLetterSpacing={s.nameLetterSpacing}
                      nameFontWeight={s.nameFontWeight}
                      firstNameFontWeight={s.firstNameFontWeight}
                      nameItalic={s.nameItalic}
                      nameFontSize={s.nameFontSize}
                      subtitleFontSize={s.subtitleFontSize}
                      nameLineHeight={s.nameLineHeight}
                      onAvatarChange={s.handleAvatarChange}
                      setEditingSection={s.setEditingSection}
                      identityPosition={s.identityPosition}
                      onIdentityPositionChange={s.handleIdentityPositionChange}
                      previewDevice={previewDevice}
                      hideToolbar
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel — Design */}
          <ResizablePanel defaultSize={34} minSize={22} maxSize={40}>
            <div className="h-full flex flex-col bg-card border-l border-border">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Design</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  {rightPanelContent}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── Mobile: Tab-based layout with bottom nav ── */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0">
        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {mobileTab === "preview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
              <CardBuilderPreview
                profile={s.profile} previewTheme={s.previewTheme}
                currentThemeOverrides={s.currentThemeOverrides} sections={s.sections}
                coverUrl={s.coverUrl} coverOffsetY={s.coverOffsetY}
                avatarUrl={s.avatarUrl} avatarBgColor={s.avatarBgColor} avatarRotation={s.avatarRotation}
                logoUrl={s.logoUrl} logoFrostedBg={s.logoFrostedBg} logoPosition={s.logoPosition}
                logoSize={s.logoSize} logoOpacity={s.logoOpacity} logoPadding={s.logoPadding}
                logoNameGap={s.logoNameGap} logoVerticalAlign={s.logoVerticalAlign}
                ctaConfig={s.ctaConfig} ctaIconsOnly={s.ctaIconsOnly}
                editName={s.editName} editCompany={s.editCompany} displayJobTitle={s.displayJobTitle}
                boldLastName={s.boldLastName} uppercaseName={s.uppercaseName}
                nameLetterSpacing={s.nameLetterSpacing} nameFontWeight={s.nameFontWeight}
                firstNameFontWeight={s.firstNameFontWeight} nameItalic={s.nameItalic}
                      nameFontSize={s.nameFontSize} subtitleFontSize={s.subtitleFontSize}
                      nameLineHeight={s.nameLineHeight}
                onAvatarChange={s.handleAvatarChange} setEditingSection={s.setEditingSection}
                identityPosition={s.identityPosition}
                onIdentityPositionChange={s.handleIdentityPositionChange}
              />
            </motion.div>
          )}

          {mobileTab === "sections" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 space-y-4">
              {/* Templates */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Templates</span>
                </div>
                <TemplateSelector selectedTemplateId={selectedTemplateId} onSelect={handleApplyTemplate} professionName={s.professionName} compact />
              </div>

              {/* Section list */}
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

              <Button
                variant="outline" size="sm"
                className="w-full gap-1.5 border-dashed border-primary/30 text-primary"
                onClick={() => setBlockMarketOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Browse Block Marketplace
              </Button>
            </motion.div>
          )}

          {mobileTab === "identity" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4">
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
                nameLineHeight={s.nameLineHeight} setNameLineHeight={s.setNameLineHeight}
                saveThemeField={s.saveThemeField} qc={s.qc} hideWrapper
              />
              <div className="mt-4 space-y-3">
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

          {mobileTab === "theme" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 space-y-4">
              <Button variant="default" className="w-full" onClick={() => s.setThemeEditorOpen(true)}>
                <Sliders className="h-4 w-4 mr-2" /> Open Theme Editor
              </Button>

              {/* Quick palette */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Palette</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "Primary", color: s.previewTheme.palette.primary },
                    { label: "Secondary", color: s.previewTheme.palette.secondary },
                    { label: "Accent", color: s.previewTheme.palette.accent },
                    { label: "Bg", color: s.previewTheme.palette.background },
                  ].map((c) => (
                    <div key={c.label} className="text-center">
                      <div className="h-10 rounded-lg border border-border shadow-sm" style={{ background: c.color }} />
                      <span className="text-[10px] text-muted-foreground mt-1 block">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Settings</span>
                <div className="space-y-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Section icons</span>
                    <Switch checked={s.showSectionIcons} onCheckedChange={(val) => { s.setShowSectionIcons(val); s.saveThemeField({ section_icons: val }); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Social icons only</span>
                    <Switch checked={s.socialIconsOnly} onCheckedChange={(v) => { s.setSocialIconsOnly(v); s.saveThemeField({ social_icons_only: v }); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">CTA icons only</span>
                    <Switch checked={s.ctaIconsOnly} onCheckedChange={(v) => { s.setCtaIconsOnly(v); s.saveThemeField({ cta_icons_only: v }); }} />
                  </div>
                </div>
              </div>

              {/* AI Tools */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Tools</span>
                <Button size="sm" className="w-full gap-1.5" onClick={() => setAiAssistantOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5" /> Generate My Card with AI
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom">
          <div className="grid grid-cols-4 h-14">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  mobileTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className={`h-5 w-5 transition-transform ${mobileTab === tab.id ? "scale-110" : ""}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section Editor Sheet */}
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

      {/* Theme Editor Sheet */}
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

      {/* AI Assistant */}
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
