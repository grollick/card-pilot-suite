import { Palette, Pencil, Camera, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import CardPhotoTools from "@/components/card/CardPhotoTools";
import SectionEditor, { type SectionContent } from "@/components/card/SectionEditor";
import CardAssistant from "@/components/card/CardAssistant";
import CardThemeEditor from "@/components/card/CardThemeEditor";
import CardBuilderHeader from "@/components/card/CardBuilderHeader";
import CardBuilderIdentity from "@/components/card/CardBuilderIdentity";
import CardBuilderSections from "@/components/card/CardBuilderSections";
import CardBuilderPreview from "@/components/card/CardBuilderPreview";
import { useCardBuilderState } from "@/hooks/useCardBuilderState";

export default function CardBuilder() {
  const s = useCardBuilderState();

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

          {/* ── Desktop: always-visible panels ── */}
          <div className="hidden lg:block space-y-3">
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
              saveThemeField={s.saveThemeField}
              qc={s.qc}
            />

            <div className="rounded-xl border border-border bg-card p-4">
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
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <Button variant="outline" className="w-full" onClick={() => s.setThemeEditorOpen(true)}>
                <Palette className="h-4 w-4 mr-2" /> Customize Theme
              </Button>
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
            />
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
            ctaConfig={s.ctaConfig}
            ctaIconsOnly={s.ctaIconsOnly}
            editName={s.editName}
            editCompany={s.editCompany}
            displayJobTitle={s.displayJobTitle}
            boldLastName={s.boldLastName}
            uppercaseName={s.uppercaseName}
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
    </div>
  );
}
