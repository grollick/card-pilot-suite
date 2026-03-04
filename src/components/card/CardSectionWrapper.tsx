import React from "react";
import {
  type ResolvedCardTheme,
  getSectionStyles,
} from "@/lib/cardTokens";

interface CardSectionWrapperProps {
  theme: ResolvedCardTheme;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps each card section with the correct cardStyle
 * (solid / frosted / elevated / soft / glow) derived from tokens.
 * Renders a hairline divider at the bottom if the token calls for it.
 */
export default function CardSectionWrapper({ theme, children, className = "" }: CardSectionWrapperProps) {
  const style = getSectionStyles(theme.section.cardStyle, theme.palette, {
    radius: { card: parseInt(theme.radii.card), button: 0, input: 0 },
    shadow: {},
    spacingScale: undefined,
    ...({ section: theme.section } as any),
  });

  // Re-derive from full tokens is cleaner — the component receives the resolved theme,
  // so we compute the styles from the primitives directly.
  const sectionStyle: React.CSSProperties = {
    borderRadius: theme.radii.card,
    padding: theme.spacing.inner,
    transition: "all 0.2s ease",
    ...cardStyleMap(theme),
  };

  return (
    <div style={sectionStyle} className={className}>
      {children}
      {theme.section.divider === "hairline" && (
        <div
          style={{
            height: 1,
            background: `${theme.palette.secondary}20`,
            marginTop: theme.spacing.inner,
          }}
        />
      )}
    </div>
  );
}

function cardStyleMap(theme: ResolvedCardTheme): React.CSSProperties {
  const { palette, shadows } = theme;

  switch (theme.section.cardStyle) {
    case "solid":
      return { background: palette.background, boxShadow: shadows.card };
    case "frosted":
      return {
        background: `${palette.background}CC`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${palette.secondary}22`,
        boxShadow: shadows.card,
      };
    case "elevated":
      return {
        background: palette.background,
        boxShadow: `0 8px 32px -8px ${palette.primary}20`,
      };
    case "soft":
      return {
        background: `${palette.primary}08`,
        border: `1px solid ${palette.primary}12`,
      };
    case "glow":
      return {
        background: `${palette.background}E6`,
        boxShadow: `0 0 24px ${palette.primary}30, ${shadows.card}`,
        border: `1px solid ${palette.primary}20`,
      };
    default:
      return { background: palette.background };
  }
}
