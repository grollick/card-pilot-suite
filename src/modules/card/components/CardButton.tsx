import React from "react";
import { motion } from "framer-motion";
import { type ResolvedCardTheme, getButtonStyles } from "@/lib/cardTokens";
import type { MetallicEffect } from "@/modules/card/components/CardThemeEditor";
import { METALLIC_GRADIENTS } from "@/modules/card/components/CardThemeEditor";

interface CardButtonProps {
  theme: ResolvedCardTheme;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  fullWidth?: boolean;
  metallicEffect?: MetallicEffect;
}

/**
 * Renders a button styled by the resolved theme tokens with
 * scale, tap feedback, and color transition animations.
 */
export default function CardButton({ theme, children, onClick, href, className = "", fullWidth, metallicEffect }: CardButtonProps) {
  const btnTokens = { button: theme.button, radius: {}, shadow: {} };
  const baseStyle: React.CSSProperties = {
    ...getButtonStyles(btnTokens, theme.palette),
    borderRadius: theme.button.shape === "pill" ? "9999px" : theme.radii.button,
    boxShadow: theme.shadows.button,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textDecoration: "none",
    fontFamily: `'${theme.fonts.buttonFont || theme.fonts.secondary}', sans-serif`,
    fontSize: theme.fonts.buttonFontSize ?? undefined,
    fontWeight: theme.fonts.buttonFontWeight ?? undefined,
    cursor: "pointer",
    ...(fullWidth ? { width: "100%" } : {}),
  };

  const hasMetallic = metallicEffect?.type && metallicEffect.type !== "none" && metallicEffect.applyToButtons;
  if (hasMetallic) {
    const grad = METALLIC_GRADIENTS[metallicEffect!.type as Exclude<import("@/modules/card/components/CardThemeEditor").MetallicType, "none">];
    baseStyle.background = grad;
    baseStyle.color = "#1a1a1a";
    baseStyle.border = "none";
    baseStyle.boxShadow = `${theme.shadows.button}, inset 0 1px 0 rgba(255,255,255,0.3)`;
  }

  const motionProps = {
    style: baseStyle,
    className,
    whileHover: { scale: 1.03, boxShadow: `${theme.shadows.button}, 0 6px 20px -4px ${theme.palette.primary}40` },
    whileTap: { scale: 0.97 },
    transition: { type: "spring" as const, stiffness: 400, damping: 20 },
  };

  if (href) {
    return (
      <motion.a href={href} {...motionProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button onClick={onClick} {...motionProps}>
      {children}
    </motion.button>
  );
}
