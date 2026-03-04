import React from "react";
import { type ResolvedCardTheme, getAvatarRadius } from "@/lib/cardTokens";

interface CardHeaderProps {
  theme: ResolvedCardTheme;
  name: string;
  profession?: string;
  company?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

/**
 * Renders one of 4 header layouts based on theme tokens:
 * cover | split | classic | hero
 */
export default function CardHeader({ theme, name, profession, company, avatarUrl, coverUrl }: CardHeaderProps) {
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

  const avatarEl = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      style={{
        width: 80,
        height: 80,
        borderRadius: avatarBorderRadius,
        objectFit: "cover",
        border: `3px solid ${palette.background}`,
      }}
    />
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

  switch (header.layout) {
    // ─── Cover: full-width cover image, avatar overlapping ─────
    case "cover":
      return (
        <div style={{ position: "relative" }}>
          <div
            style={{
              height: 160,
              borderRadius: `${radii.card} ${radii.card} 0 0`,
              background: coverUrl
                ? `url(${coverUrl}) center/cover`
                : `linear-gradient(135deg, ${palette.primary}30, ${palette.accent}20)`,
            }}
          />
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
        <div style={{ display: "flex", gap: 20, alignItems: "center", padding: 24 }}>
          {avatarEl}
          <div>
            <h1 style={{ ...titleStyle, fontSize: 22 }}>{name}</h1>
            {profession && <p style={subtitleStyle}>{profession}</p>}
            {company && <p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }}>{company}</p>}
          </div>
        </div>
      );

    // ─── Hero: large centered, big title ──────────────────────
    case "hero":
      return (
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
      );

    // ─── Classic: centered, compact ───────────────────────────
    case "classic":
    default:
      return (
        <div style={{ textAlign: "center", padding: "24px 24px 16px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            {avatarEl}
          </div>
          <h1 style={{ ...titleStyle, fontSize: 22 }}>{name}</h1>
          {profession && <p style={subtitleStyle}>{profession}</p>}
          {company && <p style={{ ...subtitleStyle, fontSize: 13, opacity: 0.7 }}>{company}</p>}
        </div>
      );
  }
}
