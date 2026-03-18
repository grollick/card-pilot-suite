import PageHelpBanner from "@/components/PageHelpBanner";
import { Palette, Pencil, Camera, LayoutList, LayoutTemplate, Globe, Layers, Sliders } from "lucide-react";
import ConversionTips from "@/modules/card/components/ConversionTips";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PhotoImportDialog, { type ImportedProject } from "@/modules/card/components/PhotoImportDialog";
import { motion } from "framer-motion";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import CardPhotoTools from "@/modules/card/components/CardPhotoTools";
import SectionEditor, { type SectionContent } from "@/modules/card/components/SectionEditor";
import CardAssistant from "@/modules/card/components/CardAssistant";
import CardThemeEditor from "@/modules/card/components/CardThemeEditor";
import CardBuilderHeader from "@/modules/card/components/CardBuilderHeader";
import CardBuilderIdentity from "@/modules/card/components/CardBuilderIdentity";
import CardBuilderSections from "@/modules/card/components/CardBuilderSections";
import CardBuilderPreview from "@/modules/card/components/CardBuilderPreview";
import TemplateSelector from "@/modules/card/components/TemplateSelector";
import { getTemplate } from "@/lib/cardTemplates";
import { useCardBuilderState } from "@/hooks/useCardBuilderState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CardBuilder() {
  const s = useCardBuilderState();
  const { user } = useAuth();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [photoImportOpen, setPhotoImportOpen] = useState(false);
  const [rightTab, setRightTab] = useState("identity");

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
  };

  const editingSec = s.sections.find((sec) => sec.id === s.editingSection);

  // Shared avatar props for photo tools
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

  // ── Left panel content: Section library ──
  const leftPanel = (
    <div className="space-y-3 p-1">
      {/* Templates */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Templates</h3>
        </div>
        <TemplateSelector
          selectedTemplateId={selectedTemplateId}
          onSelect={handleApplyTemplate}
          professionName={s.professionName}
          compact
        />
      </div>

      {/* Sections & Drag/Drop */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Sections</h3>
        </div>
        <CardBuilderSections
          sections={s.sections}
          setSections={s.setSections}
          toggleSection={s.toggleSection}
          setEditingSection={s.setEditingSection}
          showSectionIcons={s.showSectionIcons}
          setShowSectionIcons={s.setShowSectionIcons}
          saveThemeField={s.saveThemeField}
          saveSections={s.saveSections}
          isGenerating={s.isGenerating}
          aiContent={s.aiContent}
          onAIGenerate={s.handleAIGenerate}
          ctaConfig={s.ctaConfig}
          ctaIconsOnly={s.ctaIconsOnly}
          setCtaIconsOnly={s.setCtaIconsOnly}
          onCtaConfigChange={s.handleCtaConfigChange}
          socialIconsOnly={s.socialIconsOnly}
          setSocialIconsOnly={s.setSocialIconsOnly}
          socialBtnColor={s.socialBtnColor}
          setSocialBtnColor={s.setSocialBtnColor}
          socialBtnStyle={s.socialBtnStyle}
          setSocialBtnStyle={s.setSocialBtnStyle}
          hideWrapper
        />
      </div>

      {/* Conversion Tips */}
      <ConversionTips sections={s.sections} />
    </div>
  );

  // ── Right panel content: Design controls ──
  const rightPanel = (
    <div className="p-1">
      <Tabs value={rightTab} onValueChange={setRightTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-3">
          <TabsTrigger value="identity" className="text-xs gap-1.5">
            <Pencil className="h-3 w-3" /> Identity
          </TabsTrigger>
          <TabsTrigger value="photos" className="text-xs gap-1.5">
            <Camera className="h-3 w-3" /> Media
          </TabsTrigger>
          <TabsTrigger value="theme" className="text-xs gap-1.5">
            <Palette className="h-3 w-3" /> Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-0 space-y-3">
          <CardBuilderIdentity
            profile={s.profile}
            editName={s.editName}
            setEditName={s.setEditName}
            editCompany={s.editCompany}
            setEditCompany={s.setEditCompany}
            editJobTitle={s.editJobTitle}
            setEditJobTitle={s.setEditJobTitle}
            jobTitle={s.jobTitle}
            setJobTitle={s.setJobTitle}
            boldLastName={s.boldLastName}
            setBoldLastName={s.setBoldLastName}
            uppercaseName={s.uppercaseName}
            setUppercaseName={s.setUppercaseName}
            professionName={s.professionName}
            identitySaveTimers={s.identitySaveTimers}
            identitySaveState={s.identitySaveState}
            setIdentitySaveState={s.setIdentitySaveState}
            nameLetterSpacing={s.nameLetterSpacing}
            setNameLetterSpacing={s.setNameLetterSpacing}
            nameFontWeight={s.nameFontWeight}
            setNameFontWeight={s.setNameFontWeight}
            firstNameFontWeight={s.firstNameFontWeight}
            setFirstNameFontWeight={s.setFirstNameFontWeight}
            nameItalic={s.nameItalic}
            setNameItalic={s.setNameItalic}
            nameFontSize={s.nameFontSize}
            setNameFontSize={s.setNameFontSize}
            subtitleFontSize={s.subtitleFontSize}
            setSubtitleFontSize={s.setSubtitleFontSize}
            saveThemeField={s.saveThemeField}
            qc={s.qc}
            hideWrapper
          />
        </TabsContent>

        <TabsContent value="photos" className="mt-0 space-y-3">
          <CardPhotoTools
            avatarUrl={s.avatarUrl}
            coverUrl={s.coverUrl}
            profession={s.professionName}
            onAvatarChange={s.handleAvatarChange}
            onCoverChange={s.handleCoverChange}
            avatarBgColor={s.avatarBgColor}
            avatarRotation={s.avatarRotation}
            onAvatarBgColorChange={s.handleAvatarBgColorChange}
            onAvatarRotationChange={s.handleAvatarRotationChange}
            coverOffsetY={s.coverOffsetY}
            onCoverOffsetYChange={s.handleCoverOffsetYChange}
            logoUrl={s.logoUrl}
            onLogoChange={s.handleLogoChange}
            logoFrostedBg={s.logoFrostedBg}
            onLogoFrostedBgChange={s.handleLogoFrostedBgChange}
            logoGlow={s.logoGlow}
            onLogoGlowChange={s.handleLogoGlowChange}
            logoPosition={s.logoPosition}
            onLogoPositionChange={s.handleLogoPositionChange}
            logoSize={s.logoSize}
            onLogoSizeChange={s.handleLogoSizeChange}
            logoOpacity={s.logoOpacity}
            onLogoOpacityChange={s.handleLogoOpacityChange}
            logoPadding={s.logoPadding}
            onLogoPaddingChange={s.handleLogoPaddingChange}
            logoNameGap={s.logoNameGap}
            onLogoNameGapChange={s.handleLogoNameGapChange}
            logoVerticalAlign={s.logoVerticalAlign}
            onLogoVerticalAlignChange={s.handleLogoVerticalAlignChange}
            {...avatarThemeProps}
          />
          <div className="pt-3 mt-1 border-t border-border/50">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setPhotoImportOpen(true)}>
              <Globe className="h-4 w-4 mr-2" /> Import Photos from URL
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="theme" className="mt-0 space-y-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-xs text-muted-foreground">Customize colors, fonts, button styles, spacing, backgrounds, and more.</p>
            <Button variant="default" className="w-full" onClick={() => s.setThemeEditorOpen(true)}>
              <Sliders className="h-4 w-4 mr-2" /> Open Theme Editor
            </Button>
          </div>
          {/* Quick color preview */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Palette</p>
            <div className="flex gap-1.5">
              {[
                { label: "Primary", color: s.previewTheme.palette.primary },
                { label: "Secondary", color: s.previewTheme.palette.secondary },
                { label: "Accent", color: s.previewTheme.palette.accent },
                { label: "Background", color: s.previewTheme.palette.background },
              ].map((c) => (
                <div key={c.label} className="flex-1 text-center">
                  <div className="h-8 rounded-md border border-border mb-1" style={{ background: c.color }} />
                  <span className="text-[9px] text-muted-foreground">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Typography</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Heading</span>
              <span className="font-medium" style={{ fontFamily: s.previewTheme.fonts.primary }}>{s.previewTheme.fonts.primary}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Body</span>
              <span className="font-medium" style={{ fontFamily: s.previewTheme.fonts.secondary }}>{s.previewTheme.fonts.secondary}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-3 -mx-4 md:-mx-6 lg:-mx-8">
      <div className="px-4 md:px-6 lg:px-8">
        <PageHelpBanner
          storageKey="card_builder"
          tooltip="Customize your card to capture more leads. Add a photo, compelling headline, and clear call-to-action."
          videoTitle="How to create a high-converting card"
          videoDuration="3 min"
        />
        <CardBuilderHeader
          globalSaveState={s.globalSaveState}
          published={s.published}
          onPublishToggle={s.handlePublishToggle}
          handle={s.profile?.handle}
          name={s.profile?.name}
        />
      </div>

      {/* ── Desktop: Three-panel resizable layout ── */}
      <div className="hidden lg:block" style={{ height: "calc(100vh - 10rem)" }}>
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border border-border bg-card/50">
          {/* Left Panel — Section Library */}
          <ResizablePanel defaultSize={22} minSize={18} maxSize={30} className="bg-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <LayoutList className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Components</h2>
            </div>
            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="p-3">
                {leftPanel}
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel — Live Preview */}
          <ResizablePanel defaultSize={44} minSize={30}>
            <div className="h-full flex flex-col bg-muted/20">
              <div className="px-4 py-3 border-b border-border flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 flex items-start justify-center">
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
                    onAvatarChange={s.handleAvatarChange}
                    setEditingSection={s.setEditingSection}
                  />
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel — Design Controls */}
          <ResizablePanel defaultSize={34} minSize={22} maxSize={40} className="bg-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Sliders className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Design</h2>
            </div>
            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="p-3">
                {rightPanel}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── Mobile: stacked accordion layout ── */}
      <div className="lg:hidden px-4 md:px-6">
        <div className="grid grid-cols-1 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Accordion type="multiple" defaultValue={["identity"]} className="space-y-2">
              <AccordionItem value="template" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <LayoutTemplate className="h-4 w-4 text-primary" /> Template
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
                  <TemplateSelector selectedTemplateId={selectedTemplateId} onSelect={handleApplyTemplate} professionName={s.professionName} compact />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="identity" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Pencil className="h-4 w-4 text-primary" /> Identity
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                    saveThemeField={s.saveThemeField} qc={s.qc} hideWrapper
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="photos" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Camera className="h-4 w-4 text-primary" /> Photo & Backdrop
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                  <div className="pt-3 mt-3 border-t border-border/50">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setPhotoImportOpen(true)}>
                      <Globe className="h-4 w-4 mr-2" /> Import Photos from URL
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="theme" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Palette className="h-4 w-4 text-primary" /> Theme
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
                  <Button variant="outline" className="w-full" onClick={() => s.setThemeEditorOpen(true)}>
                    <Palette className="h-4 w-4 mr-2" /> Customize Theme
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sections" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <LayoutList className="h-4 w-4 text-primary" /> Sections & Content
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>

          {/* Mobile preview */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
              onAvatarChange={s.handleAvatarChange} setEditingSection={s.setEditingSection}
            />
          </motion.div>
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
    </div>
  );
}
