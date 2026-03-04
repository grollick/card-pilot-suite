import React from "react";
import { type ResolvedCardTheme, getButtonStyles } from "@/lib/cardTokens";

interface CardButtonProps {
  theme: ResolvedCardTheme;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Renders a button styled by the resolved theme tokens:
 * shape (pill / rounded), style (filled / outline / gradient), size.
 */
export default function CardButton({ theme, children, onClick, href, className = "", fullWidth }: CardButtonProps) {
  const btnTokens = { button: theme.button, radius: {}, shadow: {} };
  const style: React.CSSProperties = {
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
