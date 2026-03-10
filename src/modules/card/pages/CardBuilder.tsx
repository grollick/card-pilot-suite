import { Palette, Pencil, Camera, LayoutList, LayoutTemplate, Globe } from "lucide-react";
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

export default function CardBuilder() {
  const s = useCardBuilderState();
  const { user } = useAuth();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [photoImportOpen, setPhotoImportOpen] = useState(false);

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
    // Apply template sections to card builder
    const newSections = template.sections.map(ts => {
      const existing = s.sections.find(es => es.id === ts.id);
      return {
        id: ts.id,
        label: existing?.label || ts.id.charAt(0).toUpperCase() + ts.id.slice(1).replace(/_/g, " "),
        enabled: ts.enabled,
        content: existing?.content,
      };
    });
    // Add any existing sections not in the template
    s.sections.forEach(es => {
      if (!newSections.find(ns => ns.id === es.id)) {
        newSections.push({ ...es, enabled: false } as any);
      }
    });
    s.setSections(newSections);
    s.saveSections(newSections, true);
  };

  const editingSec = s.sections.find((sec) => sec.id === s.editingSection);

  if (s.cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading card…</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <CardBuilderHeader
        globalSaveState={s.globalSaveState}
        published={s.published}
        onPublishToggle={s.handlePublishToggle}
        handle={s.profile?.handle}
        name={s.profile?.name}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-3">

          {/* ── Desktop: collapsible accordion panels ── */}
          <div className="hidden lg:block">
            <Accordion type="multiple" defaultValue={["identity", "photos", "sections"]} className="space-y-2">
              <AccordionItem value="template" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <LayoutTemplate className="h-4 w-4 text-primary" />
                    Template
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
                  <TemplateSelector
                    selectedTemplateId={selectedTemplateId}
                    onSelect={handleApplyTemplate}
                    professionName={s.professionName}
                    compact
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="identity" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Pencil className="h-4 w-4 text-primary" />
                    Identity
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="photos" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Camera className="h-4 w-4 text-primary" />
                    Photo & Backdrop
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                    avatarShape={s.previewTheme.header.avatarShape}
                    onAvatarShapeChange={(shape) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarShape: shape } } });
                    }}
                    avatarBorderWidth={((s.card?.theme_json as any)?.tokens?.header?.avatarBorderWidth) ?? 3}
                    onAvatarBorderWidthChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBorderWidth: val } } });
                    }}
                    avatarSize={((s.card?.theme_json as any)?.tokens?.header?.avatarSize) ?? 80}
                    onAvatarSizeChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarSize: val } } });
                    }}
                    avatarBannerText={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerText) ?? ""}
                    onAvatarBannerTextChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerText: val } } });
                    }}
                    avatarBannerBg={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerBg) ?? ""}
                    onAvatarBannerBgChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerBg: val } } });
                    }}
                    avatarBannerPosition={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerPosition) ?? "bottom"}
                    onAvatarBannerPositionChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerPosition: val } } });
                    }}
                    avatarBannerAnimation={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerAnimation) ?? "none"}
                    onAvatarBannerAnimationChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerAnimation: val } } });
                    }}
                  />
                  {/* AI Photo Import */}
                  <div className="pt-3 mt-3 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setPhotoImportOpen(true)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Import Photos from URL
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="theme" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Palette className="h-4 w-4 text-primary" />
                    Theme
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
                    <LayoutList className="h-4 w-4 text-primary" />
                    Sections & Content
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Conversion Tips */}
            <ConversionTips sections={s.sections} />
          </div>

          {/* ── Mobile: collapsible accordion panels ── */}
          <div className="lg:hidden">
            <Accordion type="multiple" defaultValue={["identity"]} className="space-y-2">
              <AccordionItem value="identity" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Pencil className="h-4 w-4 text-primary" />
                    Identity
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="photos" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Camera className="h-4 w-4 text-primary" />
                    Photo & Backdrop
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                    avatarShape={s.previewTheme.header.avatarShape}
                    onAvatarShapeChange={(shape) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarShape: shape } } });
                    }}
                    avatarBorderWidth={((s.card?.theme_json as any)?.tokens?.header?.avatarBorderWidth) ?? 3}
                    onAvatarBorderWidthChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBorderWidth: val } } });
                    }}
                    avatarSize={((s.card?.theme_json as any)?.tokens?.header?.avatarSize) ?? 80}
                    onAvatarSizeChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarSize: val } } });
                    }}
                    avatarBannerText={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerText) ?? ""}
                    onAvatarBannerTextChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerText: val } } });
                    }}
                    avatarBannerBg={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerBg) ?? ""}
                    onAvatarBannerBgChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerBg: val } } });
                    }}
                    avatarBannerPosition={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerPosition) ?? "bottom"}
                    onAvatarBannerPositionChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerPosition: val } } });
                    }}
                    avatarBannerAnimation={((s.card?.theme_json as any)?.tokens?.header?.avatarBannerAnimation) ?? "none"}
                    onAvatarBannerAnimationChange={(val) => {
                      const existing = (s.card?.theme_json as any)?.tokens ?? {};
                      s.saveThemeField({ tokens: { ...existing, header: { ...(existing.header ?? {}), avatarBannerAnimation: val } } });
                    }}
                  />
                  {/* AI Photo Import (mobile) */}
                  <div className="pt-3 mt-3 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setPhotoImportOpen(true)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Import Photos from URL
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="theme" className="rounded-xl border border-border bg-card px-4 overflow-hidden">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Palette className="h-4 w-4 text-primary" />
                    Theme
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
                    <LayoutList className="h-4 w-4 text-primary" />
                    Sections & Content
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </motion.div>

        {/* Right panel — Live preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-3 lg:sticky lg:top-20 lg:self-start"
        >
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
        </motion.div>
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
