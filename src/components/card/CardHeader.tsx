import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { type ResolvedCardTheme, getAvatarRadius } from "@/lib/cardTokens";

interface CardHeaderProps {
  theme: ResolvedCardTheme;
  name: string;
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
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  logoSize?: "small" | "medium" | "large";
  logoOpacity?: number;
}

/**
 * Renders one of 4 header layouts based on theme tokens:
 * cover | split | classic | hero
 * Cover images include a parallax scroll effect.
 */
export default function CardHeader({ theme, name, profession, company, avatarUrl, coverUrl, avatarBgColor = "transparent", avatarRotation = 0, avatarBorderWidth = 3, avatarSize = 80, avatarBannerText, avatarBannerColor = "#FFFFFF", avatarBannerBg, avatarBannerPosition = "bottom", avatarBannerAnimation = "none", coverOffsetY = 0, logoUrl, logoFrostedBg = true, logoGlow = false, logoPosition = "top-right", logoSize = "medium", logoOpacity = 100 }: CardHeaderProps) {
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

  const titleStyle: React.CSSProperties = {
    fontFamily: `'${fonts.primary}', sans-serif`,
    fontWeight: header.titleWeight,
    color: palette.primary,
    margin: 0,
    lineHeight: 1.2,
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: `'${fonts.secondary}', sans-serif`,
    color: palette.secondary,
    fontSize: 14,
    margin: 0,
    marginTop: 4,
  };

  const avatarContainerStyle: React.CSSProperties = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarBorderRadius,
    border: `${avatarBorderWidth}px solid #FFFFFF`,
    overflow: "hidden",
    backgroundColor: avatarBgColor === "transparent" ? undefined : avatarBgColor,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };

  const floatAnimation = {
    y: [0, -6, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  };

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
            objectFit: "cover",
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

  // Shared logo element
  const logoEl = logoUrl ? (
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
        padding: logoFrostedBg ? 4 : 0,
        zIndex: 2,
        opacity: logoOpacity / 100,
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
            <h1 style={{ ...titleStyle, fontSize: 24, marginTop: 12 }}>{name}</h1>
            {profession && <p style={subtitleStyle}>{profession}</p>}
            {company && <p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }}>{company}</p>}
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
              <h1 style={{ ...titleStyle, fontSize: 22 }}>{name}</h1>
              {profession && <p style={subtitleStyle}>{profession}</p>}
              {company && <p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }}>{company}</p>}
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
            <h1 style={{ ...titleStyle, fontSize: 28 }}>{name}</h1>
            {profession && <p style={{ ...subtitleStyle, fontSize: 16 }}>{profession}</p>}
            {company && <p style={{ ...subtitleStyle, fontSize: 14, opacity: 0.7 }}>{company}</p>}
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
            <h1 style={{ ...titleStyle, fontSize: 22 }}>{name}</h1>
            {profession && <p style={subtitleStyle}>{profession}</p>}
            {company && <p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }}>{company}</p>}
          </div>
        </div>
      );
  }
}
