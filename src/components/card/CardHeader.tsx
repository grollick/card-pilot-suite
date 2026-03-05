import React from "react";
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
  coverOffsetY?: number;
  logoUrl?: string | null;
  logoFrostedBg?: boolean;
}

/**
 * Renders one of 4 header layouts based on theme tokens:
 * cover | split | classic | hero
 */
export default function CardHeader({ theme, name, profession, company, avatarUrl, coverUrl, avatarBgColor = "transparent", avatarRotation = 0, coverOffsetY = 0, logoUrl, logoFrostedBg = true }: CardHeaderProps) {
  const { header, palette, radii, fonts } = theme;
  const avatarBorderRadius = getAvatarRadius(header.avatarShape);

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
    width: 80,
    height: 80,
    borderRadius: avatarBorderRadius,
    border: `3px solid ${palette.background}`,
    overflow: "hidden",
    backgroundColor: avatarBgColor === "transparent" ? undefined : avatarBgColor,
  };

  const avatarEl = avatarUrl ? (
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
  ) : (
    <div
      style={{
        width: 80,
        height: 80,
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
  );

  // Shared logo element
  const logoEl = logoUrl ? (
    <div style={{
      position: "absolute", top: 8, right: 8,
      height: 48, width: 48, borderRadius: 8,
      background: logoFrostedBg ? "rgba(255,255,255,0.85)" : "transparent",
      backdropFilter: logoFrostedBg ? "blur(4px)" : undefined,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: logoFrostedBg ? 4 : 0,
    }}>
      <img src={logoUrl} alt="logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
    </div>
  ) : null;

  // Shared cover/backdrop banner element for non-cover layouts
  const coverBanner = (coverUrl || logoUrl) ? (
    <div
      style={{
        height: 120,
        borderRadius: `${radii.card} ${radii.card} 0 0`,
        overflow: "hidden",
        position: "relative",
        background: coverUrl
          ? undefined
          : `linear-gradient(135deg, ${palette.primary}30, ${palette.accent}20)`,
      }}
    >
      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `center ${coverOffsetY}%`,
          }}
        />
      )}
      {logoEl}
    </div>
  ) : null;

  switch (header.layout) {
    // ─── Cover: full-width cover image, avatar overlapping ─────
    case "cover":
      return (
        <div style={{ position: "relative" }}>
          <div
            style={{
              height: 160,
              borderRadius: `${radii.card} ${radii.card} 0 0`,
              overflow: "hidden",
              position: "relative",
              background: coverUrl
                ? undefined
                : `linear-gradient(135deg, ${palette.primary}30, ${palette.accent}20)`,
            }}
          >
            {coverUrl && (
              <img
                src={coverUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `center ${coverOffsetY}%`,
                }}
              />
            )}
            {logoEl}
          </div>
          <div style={{ padding: "0 24px", marginTop: -40, display: "flex", flexDirection: "column" }}>
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
        <div>
          {coverBanner}
          <div style={{ display: "flex", gap: 20, alignItems: "center", padding: 24 }}>
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
        <div>
          {coverBanner}
          <div style={{ textAlign: "center", padding: "40px 24px 24px" }}>
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
        <div>
          {coverBanner}
          <div style={{ textAlign: "center", padding: "24px 24px 16px" }}>
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
