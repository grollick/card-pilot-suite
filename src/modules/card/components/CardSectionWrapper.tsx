import React from "react";
import { motion } from "framer-motion";
import {
  type ResolvedCardTheme,
  getSectionStyles,
} from "@/lib/cardTokens";
import type { MetallicEffect } from "@/modules/card/components/CardThemeEditor";
import { METALLIC_GRADIENTS } from "@/modules/card/components/CardThemeEditor";

interface CardSectionWrapperProps {
  theme: ResolvedCardTheme;
  children: React.ReactNode;
  className?: string;
  /** Zero-based index used for stagger delay */
  index?: number;
  metallicEffect?: MetallicEffect;
}

/**
 * Wraps each card section with the correct cardStyle
 * (solid / frosted / elevated / soft / glow) derived from tokens.
 * Animates in with a lifted tile + glow effect on scroll.
 */
export default function CardSectionWrapper({ theme, children, className = "", index = 0, metallicEffect }: CardSectionWrapperProps) {
  const hasMetallic = metallicEffect?.type && metallicEffect.type !== "none" && metallicEffect.applyToSections;

  const sectionStyle: React.CSSProperties = {
    borderRadius: theme.radii.card,
    padding: theme.spacing.inner,
    ...cardStyleMap(theme),
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  const staggerDelay = index * 0.1;

  return (
    <motion.div
      style={sectionStyle}
      className={className}
      initial={{ opacity: 0, y: 24, boxShadow: "0 0 0 transparent" }}
      whileInView={{
        opacity: 1,
        y: 0,
        boxShadow: `0 8px 32px -8px ${theme.palette.primary}25, 0 0 20px ${theme.palette.primary}10`,
      }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: staggerDelay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -2,
        boxShadow: `0 12px 40px -8px ${theme.palette.primary}35, 0 0 28px ${theme.palette.primary}15`,
        transition: { duration: 0.2 },
      }}
    >
      {hasMetallic && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: METALLIC_GRADIENTS[metallicEffect!.type as Exclude<import("@/modules/card/components/CardThemeEditor").MetallicType, "none">],
            opacity: (metallicEffect!.intensity / 100) * 0.12,
            pointerEvents: "none",
            borderRadius: theme.radii.card,
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
      {theme.section.divider === "hairline" && (
        <div
          style={{
            height: 1,
            width: `${theme.section.dividerWidth ?? 100}%`,
            margin: `${theme.spacing.inner}px auto 0`,
            background: theme.section.dividerColor || `${theme.palette.secondary}20`,
            position: "relative",
            zIndex: 1,
          }}
        />
      )}
    </motion.div>
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
    case "glass":
      return {
        background: `${palette.background}1A`,
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        border: `1px solid ${palette.primary}18`,
        boxShadow: `0 8px 32px -8px rgba(0,0,0,0.12), inset 0 1px 0 ${palette.background}30`,
      };
    default:
      return { background: palette.background };
  }
}
