import { CreditCard, Eye, Pencil, Smartphone, Tablet, Move, Star, Calendar, Send, Globe, Instagram, Facebook, Linkedin, Twitter, Youtube, Play, MapPin, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPatternSvg, type CardThemeOverrides, METALLIC_GRADIENTS, type MetallicType } from "./CardThemeEditor";
import { CTA_ICON_MAP } from "./CtaEditor";
import type { CtaItem } from "./CtaEditor";
import type { ResolvedCardTheme } from "@/lib/cardTokens";
import type { CardSection } from "@/hooks/useCard";
import CardSectionWrapper from "./CardSectionWrapper";
import CardHeader from "./CardHeader";
import type { MetallicEffect } from "./CardThemeEditor";

interface Props {
  profile: any;
  previewTheme: ResolvedCardTheme;
  currentThemeOverrides: CardThemeOverrides;
  sections: CardSection[];
  coverUrl: string | null;
  coverOffsetY: number;
  coverFlipX: boolean;
  coverHeight: number;
  avatarUrl: string | null;
  avatarBgColor: string;
  avatarRotation: number;
  logoUrl: string | null;
  logoFrostedBg: boolean;
  logoPosition: string;
  logoSize: string;
  logoOpacity: number;
  logoPadding: number;
  logoNameGap?: number;
  logoVerticalAlign?: "top" | "center" | "bottom";
  ctaConfig: CtaItem[];
  ctaIconsOnly: boolean;
  editName: string | null;
  editCompany: string | null;
  displayJobTitle: string;
  boldLastName?: boolean;
  uppercaseName?: boolean;
  nameLetterSpacing?: number;
  nameFontWeight?: number;
  firstNameFontWeight?: number | null;
  nameItalic?: boolean;
  nameFontSize?: number | null;
  subtitleFontSize?: number | null;
  subtitleItalic?: boolean;
  subtitleSpacing?: number | null;
  showCompany?: boolean;
  companyColor?: string | null;
  nameLineHeight?: number | null;
  nameTextStroke?: boolean;
  nameTextStrokeWidth?: number;
  onAvatarChange: (url: string) => void;
  setEditingSection: (id: string | null) => void;
  identityPosition?: { x: number; y: number } | null;
  onIdentityPositionChange?: (pos: { x: number; y: number } | null) => void;
  logoCustomPosition?: { x: number; y: number } | null;
  onLogoCustomPositionChange?: (pos: { x: number; y: number } | null) => void;
  /** When provided externally, hides the built-in device toggle toolbar */
  previewDevice?: "phone" | "tablet";
  hideToolbar?: boolean;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
};

function ThemedSectionPreview({ section, theme, metallicEffect, index }: {
  section: CardSection; theme: ResolvedCardTheme; metallicEffect?: MetallicEffect; index: number;
}) {
  const c = section.content;
  const { palette, fonts, radii } = theme;

  switch (section.id) {
    case "hero":
      if (!c?.tagline) return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <p style={{ fontSize: 13, fontWeight: 600, color: palette.primary, textAlign: "center", margin: 0, fontFamily: `'${fonts.primary}', sans-serif` }}>
            Hero Section
          </p>
        </CardSectionWrapper>
      );
      return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: palette.primary, margin: 0, fontFamily: `'${fonts.primary}', sans-serif` }}>{c.tagline}</p>
            {c.subtitle && <p style={{ fontSize: 12, color: `${palette.secondary}99`, margin: "4px 0 0" }}>{c.subtitle}</p>}
          </div>
        </CardSectionWrapper>
      );

    case "about":
      return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${fonts.primary}', sans-serif` }}>About</p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: palette.secondary, margin: 0 }}>
            {c?.text || "Passionate professional dedicated to delivering exceptional results."}
          </p>
        </CardSectionWrapper>
      );

    case "video_intro": {
      const videoUrl = c?.videoUrl;
      if (!videoUrl) return null;
      return (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${fonts.primary}', sans-serif` }}>
            {c?.videoHeading || "Watch"}
          </p>
          <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
            <div style={{ borderRadius: radii.button, overflow: "hidden", aspectRatio: "16/9", background: `${palette.secondary}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play style={{ width: 24, height: 24, color: palette.primary, opacity: 0.5 }} />
            </div>
            {c?.videoCaption && (
              <p style={{ fontSize: 11, color: `${palette.secondary}99`, margin: "6px 0 0", textAlign: "center" }}>{c.videoCaption}</p>
            )}
          </CardSectionWrapper>
        </div>
      );
    }

    case "services": {
      const items = c?.items as { name: string; description?: string; price?: string }[] | undefined;
      return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${fonts.primary}', sans-serif` }}>Services</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items?.length ? items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: radii.button, background: `${palette.primary}06` }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: palette.primary }}>{item.name || "Untitled"}</span>
                  {item.description && <p style={{ fontSize: 11, color: `${palette.secondary}80`, margin: "2px 0 0" }}>{item.description}</p>}
                </div>
                {item.price && <span style={{ fontSize: 12, color: palette.secondary, fontWeight: 500 }}>{item.price}</span>}
              </div>
            )) : (
              <p style={{ fontSize: 12, color: `${palette.secondary}60`, textAlign: "center" }}>Add your services</p>
            )}
          </div>
        </CardSectionWrapper>
      );
    }

    case "testimonials": {
      const testimonials = c?.testimonials as { name: string; text: string; role?: string }[] | undefined;
      return (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${fonts.primary}', sans-serif` }}>Testimonials</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {testimonials?.length ? testimonials.map((t, i) => (
              <CardSectionWrapper key={i} theme={theme} index={index + i} metallicEffect={metallicEffect}>
                <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} style={{ width: 12, height: 12, fill: "#f59e0b", color: "#f59e0b" }} />
                  ))}
                </div>
                <p style={{ fontSize: 12, fontStyle: "italic", color: palette.secondary, margin: 0, lineHeight: 1.6 }}>"{t.text}"</p>
                <p style={{ fontSize: 11, color: `${palette.secondary}99`, margin: "6px 0 0" }}>— {t.name}{t.role ? `, ${t.role}` : ""}</p>
              </CardSectionWrapper>
            )) : (
              <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
                <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} style={{ width: 12, height: 12, fill: "#f59e0b", color: "#f59e0b" }} />
                  ))}
                </div>
                <p style={{ fontSize: 12, fontStyle: "italic", color: palette.secondary, margin: 0, lineHeight: 1.6 }}>"Absolutely amazing experience. Highly recommend!"</p>
                <p style={{ fontSize: 11, color: `${palette.secondary}99`, margin: "6px 0 0" }}>— Happy Client</p>
              </CardSectionWrapper>
            )}
          </div>
        </div>
      );
    }

    case "gallery": {
      const images = c?.images as { url: string; caption?: string }[] | undefined;
      return (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${fonts.primary}', sans-serif` }}>Gallery</p>
          {images?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, borderRadius: radii.button, overflow: "hidden" }}>
              {images.slice(0, 6).map((img, i) => (
                <img key={i} src={img.url} alt={img.caption || ""} style={{ width: "100%", height: 60, objectFit: "cover" }} />
              ))}
            </div>
          ) : (
            <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
              <p style={{ fontSize: 12, color: `${palette.secondary}60`, textAlign: "center" }}>Add gallery images</p>
            </CardSectionWrapper>
          )}
        </div>
      );
    }

    case "social": {
      const links = c?.links as { platform: string; url: string }[] | undefined;
      return (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${fonts.primary}', sans-serif` }}>Connect</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {(links?.length ? links : [{ platform: "instagram" }, { platform: "facebook" }, { platform: "linkedin" }]).map((l: any, i: number) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: radii.button,
                border: `1px solid ${palette.primary}20`, background: `${palette.primary}08`,
                display: "flex", alignItems: "center", justifyContent: "center", color: palette.primary,
              }}>
                {SOCIAL_ICONS[l.platform?.toLowerCase()] || <Globe style={{ width: 16, height: 16 }} />}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "contact":
      return (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${fonts.primary}', sans-serif` }}>
            {c?.heading || "Get in Touch"}
          </p>
          {c?.description && <p style={{ fontSize: 12, color: palette.secondary, margin: "0 0 8px", lineHeight: 1.5 }}>{c.description}</p>}
          <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Your name *", "Phone number", "Email", "Message"].map((ph, i) => (
                <div key={i} style={{
                  padding: "8px 12px", borderRadius: radii.button,
                  border: `1px solid ${palette.secondary}30`, fontSize: 12,
                  color: `${palette.secondary}50`, fontFamily: `'${fonts.secondary}', sans-serif`,
                }}>{ph}</div>
              ))}
              <div style={{
                padding: "10px", borderRadius: radii.button,
                background: palette.primary, color: palette.background,
                textAlign: "center", fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Send style={{ width: 14, height: 14 }} /> Send Message
              </div>
            </div>
          </CardSectionWrapper>
        </div>
      );

    case "booking":
      return (
        <div style={{
          padding: "10px 16px", borderRadius: theme.button.shape === "pill" ? "9999px" : radii.button,
          background: palette.primary, color: palette.background,
          textAlign: "center", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Calendar style={{ width: 14, height: 14 }} />
          {c?.bookingHeading || "Book an Appointment"}
        </div>
      );

    case "quote_request":
      return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Quote Request</p>
          <p style={{ fontSize: 12, color: `${palette.secondary}60`, textAlign: "center" }}>Clients can request a custom quote</p>
        </CardSectionWrapper>
      );

    case "quote_calculator":
      return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>
            {c?.heading || "Instant Quote"}
          </p>
          <p style={{ fontSize: 12, color: `${palette.secondary}60`, textAlign: "center" }}>Interactive pricing calculator</p>
        </CardSectionWrapper>
      );

    case "projects":
      return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <p style={{ fontSize: 11, fontWeight: 600, color: palette.primary, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>
            {c?.heading || "Our Work"}
          </p>
          <p style={{ fontSize: 12, color: `${palette.secondary}60`, textAlign: "center" }}>Before & After transformations</p>
        </CardSectionWrapper>
      );

    default:
      return (
        <CardSectionWrapper theme={theme} index={index} metallicEffect={metallicEffect}>
          <p style={{ fontSize: 12, color: `${palette.secondary}60`, textAlign: "center" }}>{section.label} Section</p>
        </CardSectionWrapper>
      );
  }
}

export default function CardBuilderPreview({
  profile, previewTheme, currentThemeOverrides, sections,
  coverUrl, coverOffsetY, coverFlipX, coverHeight, avatarUrl, avatarBgColor, avatarRotation,
  logoUrl, logoFrostedBg, logoPosition, logoSize, logoOpacity, logoPadding, logoNameGap = 8, logoVerticalAlign = "center",
  ctaConfig, ctaIconsOnly, editName, editCompany, displayJobTitle,
  boldLastName, uppercaseName, nameLetterSpacing, nameFontWeight, firstNameFontWeight, nameItalic, nameFontSize, subtitleFontSize, subtitleItalic, subtitleSpacing, showCompany = true, companyColor, nameLineHeight, nameTextStroke, nameTextStrokeWidth, onAvatarChange, setEditingSection,
  identityPosition, onIdentityPositionChange,
  logoCustomPosition, onLogoCustomPositionChange,
  previewDevice: externalDevice, hideToolbar,
}: Props) {
  const [internalDevice, setInternalDevice] = useState<"phone" | "tablet">("phone");
  const previewDevice = externalDevice ?? internalDevice;
  const setPreviewDevice = setInternalDevice;

  // Read live duty status reactively from the canonical query
  const qc = useQueryClient();
  const { data: dutyData } = useQuery({
    queryKey: ["estimate-duty-status"],
    enabled: false, // Don't fetch — just subscribe to existing cache
  });
  const liveIsOnDuty = (dutyData as any)?.is_on_duty ?? false;
  const [repositionMode, setRepositionMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const isLogoDragging = useRef(false);
  const logoDragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    const pos = identityPosition ?? { x: 0, y: 0 };
    dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [identityPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newX = dragStart.current.posX + dx;
    const newY = dragStart.current.posY + dy;
    onIdentityPositionChange?.({ x: newX, y: newY });
  }, [onIdentityPositionChange]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleResetPosition = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onIdentityPositionChange?.(null);
  }, [onIdentityPositionChange]);

  // Logo drag handlers — store as percentage of cover container
  const handleLogoPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isLogoDragging.current = true;
    const pos = logoCustomPosition ?? { x: 0, y: 0 };
    logoDragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [logoCustomPosition]);

  const handleLogoPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isLogoDragging.current || !coverRef.current) return;
    const rect = coverRef.current.getBoundingClientRect();
    const dx = e.clientX - logoDragStart.current.x;
    const dy = e.clientY - logoDragStart.current.y;
    // Convert pixel delta to percentage of container
    const dxPct = (dx / rect.width) * 100;
    const dyPct = (dy / rect.height) * 100;
    onLogoCustomPositionChange?.({
      x: Math.max(-10, Math.min(90, logoDragStart.current.posX + dxPct)),
      y: Math.max(-10, Math.min(90, logoDragStart.current.posY + dyPct)),
    });
  }, [onLogoCustomPositionChange]);

  const handleLogoPointerUp = useCallback(() => {
    isLogoDragging.current = false;
  }, []);

  const handleResetLogoPosition = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLogoCustomPositionChange?.(null);
  }, [onLogoCustomPositionChange]);

  const logoPx = logoSize === "small" ? 36 : logoSize === "xl" ? 80 : logoSize === "xxl" ? 100 : logoSize === "large" ? 64 : 48;
  const posMap: Record<string, string> = {
    "top-left": "top-2 left-2", "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2", "bottom-right": "bottom-2 right-2",
  };

  return (
    <>
      {/* Toolbar — hidden when parent controls device */}
      {!hideToolbar && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
            {(["phone", "tablet"] as const).map((d) => (
              <button key={d} onClick={() => setPreviewDevice(d)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  previewDevice === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d === "phone" ? <Smartphone className="h-3.5 w-3.5" /> : <Tablet className="h-3.5 w-3.5" />}
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          {profile?.handle && (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
                <Eye className="h-4 w-4" /> Preview as Visitor
              </a>
            </Button>
          )}
        </div>
      )}
      {(onIdentityPositionChange || onLogoCustomPositionChange) && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 mt-2">
          <Switch checked={repositionMode} onCheckedChange={setRepositionMode} id="reposition-toggle" />
          <label htmlFor="reposition-toggle" className="text-xs text-muted-foreground font-medium cursor-pointer select-none flex items-center gap-1.5">
            <Move className="h-3 w-3" />Drag to reposition avatar & logo
          </label>
        </div>
      )}

      {/* Device Frame */}
      <div className="flex items-start justify-center py-4 transition-all duration-300">
        <div className={`relative mx-auto transition-all duration-300 ${previewDevice === "phone" ? "w-[300px]" : "w-[500px]"}`}>
          {previewDevice === "phone" && <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[120px] h-[26px] bg-foreground/90 rounded-b-2xl" />}
          {previewDevice === "tablet" && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-[8px] h-[8px] bg-foreground/40 rounded-full" />}
          <div className={`border-[6px] border-foreground/90 bg-foreground/90 shadow-xl overflow-hidden transition-all duration-300 ${
            previewDevice === "phone" ? "rounded-[2.5rem]" : "rounded-[1.5rem]"
          }`}>
            <div className={`overflow-hidden bg-background relative pb-6 transition-all duration-300 ${
              previewDevice === "phone" ? "rounded-[2rem]" : "rounded-[1rem]"
            }`}>
              <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 h-[4px] rounded-full bg-foreground/30 ${
                previewDevice === "phone" ? "w-[100px]" : "w-[140px]"
              }`} />
              <div className="lg:max-h-[calc(100vh-10rem)] overflow-y-auto scroll-smooth snap-y snap-proximity">
                <div className="relative theme-transition" style={{
                  background: currentThemeOverrides.gradientBg?.enabled
                    ? `linear-gradient(${currentThemeOverrides.gradientBg.direction}, ${previewTheme.palette.background}, ${currentThemeOverrides.gradientBg.color2})`
                    : previewTheme.palette.background,
                }}>
                  {currentThemeOverrides.bgPattern?.type && currentThemeOverrides.bgPattern.type !== "none" && (
                    <div
                      className={`absolute inset-0 pointer-events-none ${(currentThemeOverrides.bgPattern as any).coverage === "gaps" ? "z-[0]" : "z-[1]"}`}
                      style={{
                        opacity: currentThemeOverrides.bgPattern.opacity,
                        backgroundImage: getPatternSvg(currentThemeOverrides.bgPattern.type, currentThemeOverrides.bgPattern.color || previewTheme.palette.secondary),
                        backgroundSize: currentThemeOverrides.bgPattern.type === "noise" ? "200px 200px" : `${currentThemeOverrides.bgPattern.scale ?? 20}px ${currentThemeOverrides.bgPattern.scale ?? 20}px`,
                      }}
                    />
                  )}

                  {/* Top Section — shadowed tile matching other sections */}
                  <div className="px-5 pt-5 relative z-[2]">
                  <CardSectionWrapper theme={previewTheme} index={0} metallicEffect={currentThemeOverrides.metallicEffect} className="overflow-hidden">
                    <div style={{ margin: `-${previewTheme.spacing.inner}px`, marginBottom: 0 }}>
                      <CardHeader
                        theme={previewTheme}
                        name={(editName ?? profile?.name) || "Your Name"}
                        boldLastName={boldLastName}
                        uppercaseName={uppercaseName}
                        nameLetterSpacing={nameLetterSpacing}
                        nameFontWeight={nameFontWeight}
                        firstNameFontWeight={firstNameFontWeight}
                        nameItalic={nameItalic}
                        nameFontSize={nameFontSize}
                        nameLineHeight={nameLineHeight}
                        nameTextStroke={nameTextStroke}
                        nameTextStrokeWidth={nameTextStrokeWidth}
                        subtitleFontSize={subtitleFontSize}
                        subtitleItalic={subtitleItalic}
                        subtitleSpacing={subtitleSpacing}
                        showCompany={showCompany}
                        companyColor={companyColor}
                        profession={displayJobTitle}
                        company={(editCompany ?? profile?.company) ?? undefined}
                        avatarUrl={avatarUrl}
                        coverUrl={coverUrl}
                        avatarBgColor={avatarBgColor}
                        avatarRotation={avatarRotation}
                        avatarBorderWidth={previewTheme.header.avatarBorderWidth ?? 3}
                        avatarSize={previewTheme.header.avatarSize ?? 80}
                        coverOffsetY={coverOffsetY}
                        coverFlipX={coverFlipX}
                        coverHeight={coverHeight}
                        logoUrl={logoUrl}
                        logoFrostedBg={logoFrostedBg}
                        logoPosition={logoPosition as any}
                        logoSize={logoSize as any}
                        logoOpacity={logoOpacity}
                        logoPadding={logoPadding}
                        logoNameGap={logoNameGap}
                        logoVerticalAlign={logoVerticalAlign}
                        logoCustomPosition={logoCustomPosition}
                        metallicEffect={currentThemeOverrides.metallicEffect}
                        verificationLevel={profile?.verification_level as any}
                        isAvailable={liveIsOnDuty}
                      />
                    </div>

                    {/* Location tag */}
                    {profile?.city && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: `${previewTheme.palette.secondary}90`, fontSize: 12, marginTop: 8, padding: "0 4px" }}>
                        <MapPin style={{ width: 12, height: 12 }} />
                        {profile.city}
                      </div>
                    )}

                      {/* CTA Buttons — matching template example style */}
                      {(() => {
                        const enabledCtas = ctaConfig.filter(c => c.enabled);

                        if (ctaIconsOnly) {
                          return (
                            <div className="flex items-center justify-center gap-2.5 mt-3 px-1 pb-2">
                              {enabledCtas.map(c => (
                                <button key={c.id} className="h-9 w-9 rounded-full flex items-center justify-center transition-colors"
                                  style={{
                                    background: c.isPrimary ? previewTheme.palette.primary : "transparent",
                                    color: c.isPrimary ? previewTheme.palette.background : previewTheme.palette.primary,
                                    border: c.isPrimary ? "none" : `1.5px solid ${previewTheme.palette.primary}40`,
                                  }} title={c.label}
                                >{CTA_ICON_MAP[c.id]}</button>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div className="flex gap-1.5 mt-3 px-1 pb-2">
                            {enabledCtas.map(c => (
                              <button key={c.id} className="flex-1 text-[11px] font-bold py-2 rounded-lg transition-colors"
                                style={{
                                  background: c.isPrimary ? previewTheme.palette.primary : `${previewTheme.palette.primary}10`,
                                  color: c.isPrimary ? previewTheme.palette.background : previewTheme.palette.primary,
                                }}>
                                {c.label}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                  </CardSectionWrapper>
                  </div>

                  <div className="px-5 pb-5 relative z-[2]">
                    {/* Section Previews — themed to match public card */}
                    {sections.filter((s) => s.enabled).map((section, idx) => (
                      <div key={section.id}
                        className="mt-4 cursor-pointer group relative"
                        onClick={() => setEditingSection(section.id)}
                      >
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-primary/90 text-primary-foreground rounded-full p-1 shadow-md">
                            <Pencil className="h-3 w-3" />
                          </div>
                        </div>
                        <ThemedSectionPreview
                          section={section}
                          theme={previewTheme}
                          metallicEffect={currentThemeOverrides.metallicEffect}
                          index={idx}
                        />
                      </div>
                    ))}

                    {/* Scan to Save preview */}
                    {(currentThemeOverrides as any).scanToSave !== false && (() => {
                      // Check if scan_to_save is enabled via the theme overrides passed from the card
                      const themeJson = (profile as any)?.__card_theme_json;
                      const scanEnabled = themeJson?.scan_to_save === true;
                      if (!scanEnabled) return null;
                      return (
                        <div className="mt-4">
                          <CardSectionWrapper theme={previewTheme} index={sections.filter(s => s.enabled).length} metallicEffect={currentThemeOverrides.metallicEffect}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: previewTheme.palette.primary, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1, fontFamily: `'${previewTheme.fonts.primary}', sans-serif` }}>
                              Scan Your Card
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0" }}>
                              <div style={{
                                width: 80, height: 80, borderRadius: 8,
                                border: `2px solid ${previewTheme.palette.primary}30`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: `${previewTheme.palette.primary}08`,
                              }}>
                                <QrCode style={{ width: 40, height: 40, color: previewTheme.palette.primary }} />
                              </div>
                              <p style={{ fontSize: 11, color: `${previewTheme.palette.secondary}80`, textAlign: "center" }}>
                                Scan to save contact info
                              </p>
                            </div>
                          </CardSectionWrapper>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
