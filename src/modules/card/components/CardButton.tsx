import React from "react";
import { type ResolvedCardTheme, getButtonStyles } from "@/lib/cardTokens";
import type { MetallicEffect } from "@/components/card/CardThemeEditor";
import { METALLIC_GRADIENTS } from "@/components/card/CardThemeEditor";

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
 * Renders a button styled by the resolved theme tokens:
 * shape (pill / rounded), style (filled / outline / gradient), size.
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
    fontFamily: `'${theme.fonts.secondary}', sans-serif`,
    ...(fullWidth ? { width: "100%" } : {}),
  };

  const hasMetallic = metallicEffect?.type && metallicEffect.type !== "none" && metallicEffect.applyToButtons;
  if (hasMetallic) {
    const grad = METALLIC_GRADIENTS[metallicEffect!.type as Exclude<import("@/components/card/CardThemeEditor").MetallicType, "none">];
    baseStyle.background = grad;
    baseStyle.color = "#1a1a1a";
    baseStyle.border = "none";
    baseStyle.boxShadow = `${theme.shadows.button}, inset 0 1px 0 rgba(255,255,255,0.3)`;
  }

  const style = baseStyle;

  if (href) {
    return (
      <a href={href} style={style} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} style={style} className={className}>
      {children}
    </button>
  );
}
