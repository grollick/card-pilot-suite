import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { type ResolvedCardTheme, getAvatarRadius } from "@/lib/cardTokens";
import type { HeroBackground } from "@/lib/heroBackgrounds";
import type { MetallicEffect } from "@/modules/card/components/CardThemeEditor";
import { METALLIC_GRADIENTS } from "@/modules/card/components/CardThemeEditor";

interface CardHeaderProps {
  theme: ResolvedCardTheme;
  name: string;
  boldLastName?: boolean;
  uppercaseName?: boolean;
  nameLetterSpacing?: number;
  nameFontWeight?: number;
  firstNameFontWeight?: number | null;
  nameItalic?: boolean;
  nameFontSize?: number | null;
  subtitleFontSize?: number | null;
  profession?: string;
  company?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  avatarBgColor?: string;
  avatarRotation?: number;
  avatarBorderWidth?: number;
  avatarSize?: number;
  avatarBannerText?: string;
  avatarBannerColor?: string;
  avatarBannerBg?: string;
  avatarBannerPosition?: "top" | "bottom";
  avatarBannerAnimation?: "none" | "pulse" | "bounce" | "shimmer";
  coverOffsetY?: number;
  logoUrl?: string | null;
  logoFrostedBg?: boolean;
  logoGlow?: boolean;
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "beside-name" | "beside-name-right";
  logoSize?: "small" | "medium" | "large";
  logoOpacity?: number;
  logoPadding?: number;
  logoNameGap?: number;
  logoVerticalAlign?: "top" | "center" | "bottom";
  metallicEffect?: MetallicEffect;
  /** Dynamic hero background (profession-based or user-selected) */
  heroBackground?: HeroBackground | null;
}

function renderName(name: string, bold?: boolean, uppercase?: boolean, firstNameWeight?: number | null) {
  const display = uppercase ? name.toUpperCase() : name;
  if (!display) return display;
  const parts = display.trim().split(/\s+/);
  if (parts.length <= 1) {
    if (firstNameWeight != null) return <span style={{ fontWeight: firstNameWeight }}>{display}</span>;
    if (bold) return <span style={{ fontWeight: 800 }}>{display}</span>;
    return display;
  }
  const last = parts.pop()!;
  const firstName = parts.join(" ");
  const firstStyle: React.CSSProperties | undefined = firstNameWeight != null ? { fontWeight: firstNameWeight } : undefined;
  const lastStyle: React.CSSProperties | undefined = bold ? { fontWeight: 800 } : undefined;
  return <>{firstStyle ? <span style={firstStyle}>{firstName}</span> : firstName} {lastStyle ? <span style={lastStyle}>{last}</span> : last}</>;
}

/**
 * Renders one of 4 header layouts based on theme tokens:
 * cover | split | classic | hero
 * Cover images include a parallax scroll effect.
 */
export default function CardHeader({ theme, name, boldLastName, uppercaseName, nameLetterSpacing = 0, nameFontWeight = 700, firstNameFontWeight, nameItalic = false, nameFontSize, subtitleFontSize, profession, company, avatarUrl, coverUrl, avatarBgColor = "transparent", avatarRotation = 0, avatarBorderWidth = 3, avatarSize = 80, avatarBannerText, avatarBannerColor = "#FFFFFF", avatarBannerBg, avatarBannerPosition = "bottom", avatarBannerAnimation = "none", coverOffsetY = 0, logoUrl, logoFrostedBg = true, logoGlow = false, logoPosition = "top-right", logoSize = "medium", logoOpacity = 100, logoPadding = 4, logoNameGap = 8, logoVerticalAlign = "center", metallicEffect, heroBackground }: CardHeaderProps) {
  const { header, palette, radii, fonts } = theme;
  const avatarBorderRadius = getAvatarRadius(header.avatarShape);
  const coverRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: coverRef,
    offset: ["start start", "end start"],
  });

  // Parallax: image moves slower than scroll (0 → 40px shift)
  const coverY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  // Subtle scale for depth
  const coverScale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);

  const hasMetallicName = metallicEffect?.type && metallicEffect.type !== "none" && metallicEffect.applyToName;
  const metallicGrad = hasMetallicName ? METALLIC_GRADIENTS[metallicEffect!.type as Exclude<import("@/modules/card/components/CardThemeEditor").MetallicType, "none">] : undefined;

  const titleStyle: React.CSSProperties = {
    fontFamily: `'${fonts.primary}', sans-serif`,
    fontWeight: nameFontWeight ?? header.titleWeight,
    color: hasMetallicName ? "transparent" : palette.primary,
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: nameLetterSpacing ? `${nameLetterSpacing}px` : undefined,
    fontStyle: nameItalic ? "italic" : undefined,
    ...(hasMetallicName ? {
      background: metallicGrad,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    } : {}),
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: `'${fonts.secondary}', sans-serif`,
    color: palette.secondary,
    fontSize: subtitleFontSize ?? 14,
    margin: 0,
    marginTop: 4,
  };

  const hasBgColor = avatarBgColor && avatarBgColor !== "transparent";
  const avatarContainerStyle: React.CSSProperties = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarBorderRadius,
    border: `${avatarBorderWidth}px solid #FFFFFF`,
    overflow: "hidden",
    backgroundColor: hasBgColor ? avatarBgColor : undefined,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };
  const avatarImgFit = hasBgColor ? "contain" as const : "cover" as const;

  const floatAnimation = {
    y: [0, -6, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  };

  // Staggered entrance for hero elements
  const heroEntrance = (delay: number) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  const bannerAnimationStyle: React.CSSProperties = (() => {
    switch (avatarBannerAnimation) {
      case "pulse":
        return { animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" };
      case "bounce":
        return { animation: "bounce 1.5s infinite" };
      case "shimmer":
        return {
          backgroundSize: "200% 100%",
          animation: "shimmer 2s linear infinite",
        };
      default:
        return {};
    }
  })();

  const bannerEl = avatarBannerText ? (
    <>
      {avatarBannerAnimation === "shimmer" && (
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      )}
      <div
        style={{
          position: "absolute",
          ...(avatarBannerPosition === "top"
            ? { top: 0, transform: "translateX(-50%) translateY(-40%)" }
            : { bottom: 0, transform: "translateX(-50%) translateY(40%)" }),
          left: "50%",
          background: avatarBannerAnimation === "shimmer"
            ? `linear-gradient(90deg, ${avatarBannerBg || palette.primary}, ${palette.accent || avatarBannerBg || palette.primary}AA, ${avatarBannerBg || palette.primary})`
            : (avatarBannerBg || palette.primary),
          color: avatarBannerColor,
          fontSize: Math.max(9, avatarSize * 0.12),
          fontWeight: 700,
          fontFamily: `'${fonts.primary}', sans-serif`,
          padding: "2px 10px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          lineHeight: 1.4,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          zIndex: 2,
          letterSpacing: "0.02em",
          textTransform: "uppercase" as const,
          ...bannerAnimationStyle,
        }}
      >
        {avatarBannerText}
      </div>
    </>
  ) : null;

  const avatarEl = avatarUrl ? (
    <motion.div style={{ position: "relative" as const, width: avatarSize, height: avatarSize }} animate={floatAnimation}>
      <div style={avatarContainerStyle}>
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: avatarImgFit,
            transform: avatarRotation ? `rotate(${avatarRotation}deg)` : undefined,
          }}
        />
      </div>
      {bannerEl}
    </motion.div>
  ) : (
    <motion.div
      animate={floatAnimation}
      style={{ position: "relative" as const, width: avatarSize, height: avatarSize }}
    >
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarBorderRadius,
          background: `${palette.primary}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 700,
          color: palette.primary,
          fontFamily: `'${fonts.primary}', sans-serif`,
        }}
      >
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      {bannerEl}
    </motion.div>
  );

  // Logo size mapping
  const logoPx = logoSize === "small" ? 36 : logoSize === "large" ? 64 : 48;

  // Logo position mapping
  const logoPosStyle: Record<string, React.CSSProperties> = {
    "top-left": { top: 8, left: 8 },
    "top-right": { top: 8, right: 8 },
    "bottom-left": { bottom: 8, left: 8 },
    "bottom-right": { bottom: 8, right: 8 },
  };

  // Vertical alignment for inline logo
  const vAlignMap = { top: "flex-start", center: "center", bottom: "flex-end" } as const;
  const inlineAlignItems = vAlignMap[logoVerticalAlign] || "center";

  // Shared logo element (absolute positioned on cover)
  const isInlineLogo = logoPosition === "beside-name" || logoPosition === "beside-name-right";
  const logoEl = logoUrl && !isInlineLogo ? (
    <motion.div
      animate={logoGlow ? {
        boxShadow: [
          `0 0 12px ${palette.primary}40, 0 0 24px ${palette.primary}20`,
          `0 0 20px ${palette.primary}60, 0 0 40px ${palette.primary}30`,
          `0 0 12px ${palette.primary}40, 0 0 24px ${palette.primary}20`,
        ],
      } : undefined}
      transition={logoGlow ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const } : undefined}
      style={{
        position: "absolute",
        ...logoPosStyle[logoPosition],
        height: logoPx, width: logoPx, borderRadius: 8,
        background: logoFrostedBg ? "rgba(255,255,255,0.85)" : "transparent",
        backdropFilter: logoFrostedBg ? "blur(4px)" : undefined,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: logoPadding,
        zIndex: 2,
        opacity: logoOpacity / 100,
      }}
    >
      <img src={logoUrl} alt="logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
    </motion.div>
  ) : null;

  // Inline logo element (beside the name)
  const inlineLogoEl = logoUrl && isInlineLogo ? (
    <motion.div
      animate={logoGlow ? {
        boxShadow: [
          `0 0 12px ${palette.primary}40, 0 0 24px ${palette.primary}20`,
          `0 0 20px ${palette.primary}60, 0 0 40px ${palette.primary}30`,
          `0 0 12px ${palette.primary}40, 0 0 24px ${palette.primary}20`,
        ],
      } : undefined}
      transition={logoGlow ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const } : undefined}
      style={{
        height: logoPx, width: logoPx, borderRadius: 8,
        background: logoFrostedBg ? "rgba(255,255,255,0.85)" : "transparent",
        backdropFilter: logoFrostedBg ? "blur(4px)" : undefined,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: logoPadding,
        opacity: logoOpacity / 100,
        flexShrink: 0,
      }}
    >
      <img src={logoUrl} alt="logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
    </motion.div>
  ) : null;

  // Parallax cover image element — reused in cover layout and banner
  const parallaxCover = (height: number, borderRadiusTop: boolean) => (
    <div
      ref={coverRef}
      style={{
        height,
        borderRadius: borderRadiusTop ? `${radii.card} ${radii.card} 0 0` : undefined,
        overflow: "hidden",
        position: "relative",
        marginLeft: -8,
        marginRight: -8,
        marginTop: borderRadiusTop ? -8 : undefined,
        background: coverUrl
          ? undefined
          : `linear-gradient(135deg, ${palette.primary}30, ${palette.accent}20)`,
      }}
    >
      {coverUrl && (
        <motion.img
          src={coverUrl}
          alt=""
          style={{
            width: "100%",
            height: "120%",
            objectFit: "cover",
            objectPosition: `center ${coverOffsetY}%`,
            y: coverY,
            scale: coverScale,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      )}
      {logoEl}
    </div>
  );

  // Shared cover/backdrop banner element for non-cover layouts
  const coverBanner = (coverUrl || logoUrl) ? parallaxCover(120, true) : null;

  switch (header.layout) {
    // ─── Cover: full-width cover image, avatar overlapping ─────
    case "cover":
      return (
        <div style={{ position: "relative" }}>
          {parallaxCover(160, true)}
          <div style={{ padding: "0 24px", marginTop: -40, display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>
            {avatarEl}
            <motion.div style={{ display: "flex", alignItems: inlineAlignItems, gap: logoNameGap, marginTop: 12 }} {...heroEntrance(0.15)}>
              {logoPosition === "beside-name" && inlineLogoEl}
              <h1 style={{ ...titleStyle, fontSize: nameFontSize ?? 24 }}>{renderName(name, boldLastName, uppercaseName, firstNameFontWeight)}</h1>
              {logoPosition === "beside-name-right" && inlineLogoEl}
            </motion.div>
            {profession && <motion.p style={subtitleStyle} {...heroEntrance(0.25)}>{profession}</motion.p>}
            {company && <motion.p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }} {...heroEntrance(0.3)}>{company}</motion.p>}
          </div>
        </div>
      );

    // ─── Split: avatar left, text right ───────────────────────
    case "split":
      return (
        <div style={{ position: "relative" }}>
          {coverBanner}
          <div style={{
            display: "flex", gap: 20, alignItems: "center", padding: 24,
            ...(coverBanner ? { marginTop: -40, position: "relative", zIndex: 2 } : {}),
          }}>
            {avatarEl}
            <div>
              <motion.div style={{ display: "flex", alignItems: inlineAlignItems, gap: logoNameGap }} {...heroEntrance(0.15)}>
                {logoPosition === "beside-name" && inlineLogoEl}
                <h1 style={{ ...titleStyle, fontSize: nameFontSize ?? 22 }}>{renderName(name, boldLastName, uppercaseName, firstNameFontWeight)}</h1>
                {logoPosition === "beside-name-right" && inlineLogoEl}
              </motion.div>
              {profession && <motion.p style={subtitleStyle} {...heroEntrance(0.25)}>{profession}</motion.p>}
              {company && <motion.p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }} {...heroEntrance(0.3)}>{company}</motion.p>}
            </div>
          </div>
        </div>
      );

    // ─── Hero: large centered, big title ──────────────────────
    case "hero":
      return (
        <div style={{ position: "relative" }}>
          {coverBanner}
          <div style={{
            textAlign: "center",
            padding: "40px 24px 24px",
            ...(coverBanner ? { marginTop: -50, position: "relative", zIndex: 2 } : {}),
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              {React.cloneElement(avatarEl as React.ReactElement, {
                style: {
                  ...(avatarEl as React.ReactElement).props.style,
                  width: 100,
                  height: 100,
                },
              })}
            </div>
            <motion.div style={{ display: "flex", alignItems: inlineAlignItems, justifyContent: "center", gap: logoNameGap }} {...heroEntrance(0.15)}>
              {logoPosition === "beside-name" && inlineLogoEl}
              <h1 style={{ ...titleStyle, fontSize: nameFontSize ?? 28 }}>{renderName(name, boldLastName, uppercaseName, firstNameFontWeight)}</h1>
              {logoPosition === "beside-name-right" && inlineLogoEl}
            </motion.div>
            {profession && <motion.p style={{ ...subtitleStyle, fontSize: 16 }} {...heroEntrance(0.25)}>{profession}</motion.p>}
            {company && <motion.p style={{ ...subtitleStyle, fontSize: 14, opacity: 0.7 }} {...heroEntrance(0.3)}>{company}</motion.p>}
          </div>
        </div>
      );

    // ─── Classic: centered, compact ───────────────────────────
    case "classic":
    default:
      return (
        <div style={{ position: "relative" }}>
          {coverBanner}
          <div style={{
            textAlign: "center",
            padding: "24px 24px 16px",
            ...(coverBanner ? { marginTop: -40, position: "relative", zIndex: 2 } : {}),
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              {avatarEl}
            </div>
            <motion.div style={{ display: "flex", alignItems: inlineAlignItems, justifyContent: "center", gap: logoNameGap }} {...heroEntrance(0.15)}>
              {logoPosition === "beside-name" && inlineLogoEl}
              <h1 style={{ ...titleStyle, fontSize: nameFontSize ?? 22 }}>{renderName(name, boldLastName, uppercaseName, firstNameFontWeight)}</h1>
              {logoPosition === "beside-name-right" && inlineLogoEl}
            </motion.div>
            {profession && <motion.p style={subtitleStyle} {...heroEntrance(0.25)}>{profession}</motion.p>}
            {company && <motion.p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }} {...heroEntrance(0.3)}>{company}</motion.p>}
          </div>
        </div>
      );
  }
}
