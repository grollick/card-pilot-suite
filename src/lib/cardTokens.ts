/**
 * Maps style pack themeTokens JSON to concrete CSS values / class names
 * used by card rendering components.
 */

// ─── Radius ───────────────────────────────────────────────
export function radiusStyle(px: number): string {
  return `${px}px`;
}

export function getRadii(tokens: Record<string, any>) {
  const r = tokens?.radius || {};
  return {
    card: radiusStyle(r.card ?? 16),
    button: radiusStyle(r.button ?? 12),
    input: radiusStyle(r.input ?? 12),
  };
}

// ─── Shadows ──────────────────────────────────────────────
const SHADOW_MAP: Record<string, string> = {
  none: "none",
  subtle: "0 1px 3px 0 rgba(0,0,0,0.06)",
  soft: "0 4px 20px -4px rgba(0,0,0,0.12)",
  strong: "0 8px 30px -6px rgba(0,0,0,0.25)",
};

export function getShadow(level: string): string {
  return SHADOW_MAP[level] || SHADOW_MAP.soft;
}

export function getShadows(tokens: Record<string, any>) {
  const s = tokens?.shadow || {};
  return {
    card: getShadow(s.card ?? "soft"),
    button: getShadow(s.button ?? "soft"),
  };
}

// ─── Spacing ──────────────────────────────────────────────
const SPACING_MAP: Record<string, { section: number; inner: number }> = {
  compact: { section: 16, inner: 12 },
  comfortable: { section: 24, inner: 16 },
  airy: { section: 32, inner: 20 },
};

export function getSpacing(tokens: Record<string, any>) {
  return SPACING_MAP[tokens?.spacingScale ?? "comfortable"] || SPACING_MAP.comfortable;
}

// ─── Button ───────────────────────────────────────────────
export type ButtonShape = "rounded" | "pill";
export type ButtonStyle = "filled" | "outline" | "gradient";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export function getButtonTokens(tokens: Record<string, any>) {
  const b = tokens?.button || {};
  return {
    shape: (b.shape ?? "rounded") as ButtonShape,
    style: (b.style ?? "filled") as ButtonStyle,
    size: (b.size ?? "lg") as ButtonSize,
  };
}

const BUTTON_SIZE_MAP: Record<ButtonSize, { height: number; px: number; text: string }> = {
  sm: { height: 36, px: 16, text: "13px" },
  md: { height: 42, px: 20, text: "14px" },
  lg: { height: 48, px: 24, text: "15px" },
  xl: { height: 56, px: 28, text: "16px" },
};

export function getButtonStyles(
  tokens: Record<string, any>,
  palette: { primary: string; accent: string; background: string; secondary: string }
) {
  const btn = getButtonTokens(tokens);
  const radii = getRadii(tokens);
  const shadows = getShadows(tokens);
  const size = BUTTON_SIZE_MAP[btn.size] || BUTTON_SIZE_MAP.lg;

  const base: React.CSSProperties = {
    borderRadius: btn.shape === "pill" ? "9999px" : radii.button,
    height: size.height,
    paddingLeft: size.px,
    paddingRight: size.px,
    fontSize: size.text,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
    boxShadow: shadows.button,
  };

  switch (btn.style) {
    case "filled":
      return { ...base, background: palette.primary, color: palette.background };
    case "outline":
      return { ...base, background: "transparent", color: palette.primary, border: `2px solid ${palette.primary}` };
    case "gradient":
      return { ...base, background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`, color: "#FFFFFF" };
    default:
      return { ...base, background: palette.primary, color: palette.background };
  }
}

// ─── Header ───────────────────────────────────────────────
export type HeaderLayout = "cover" | "split" | "classic" | "hero";

export function getHeaderTokens(tokens: Record<string, any>) {
  const h = tokens?.header || {};
  return {
    layout: (h.layout ?? "classic") as HeaderLayout,
    avatarShape: (h.avatarShape ?? "circle") as "circle" | "rounded" | "square",
    titleWeight: (h.titleWeight ?? 700) as number,
  };
}

export function getAvatarRadius(shape: "circle" | "rounded" | "square"): string {
  switch (shape) {
    case "circle": return "9999px";
    case "rounded": return "16px";
    case "square": return "4px";
  }
}

// ─── Section ──────────────────────────────────────────────
export type SectionCardStyle = "solid" | "frosted" | "elevated" | "soft" | "glow" | "glass";
export type SectionDivider = "none" | "hairline";

export function getSectionTokens(tokens: Record<string, any>) {
  const s = tokens?.section || {};
  return {
    cardStyle: (s.cardStyle ?? "solid") as SectionCardStyle,
    divider: (s.divider ?? "none") as SectionDivider,
    dividerWidth: (s.dividerWidth ?? 100) as number,
    dividerColor: (s.dividerColor ?? "") as string,
  };
}

export function getSectionStyles(
  cardStyle: SectionCardStyle,
  palette: { primary: string; accent: string; background: string; secondary: string },
  tokens: Record<string, any>
): React.CSSProperties {
  const radii = getRadii(tokens);
  const shadows = getShadows(tokens);

  const base: React.CSSProperties = {
    borderRadius: radii.card,
    padding: getSpacing(tokens).inner,
    transition: "all 0.2s ease",
  };

  switch (cardStyle) {
    case "solid":
      return { ...base, background: palette.background, boxShadow: shadows.card };
    case "frosted":
      return {
        ...base,
        background: `${palette.background}CC`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${palette.secondary}22`,
        boxShadow: shadows.card,
      };
    case "elevated":
      return {
        ...base,
        background: palette.background,
        boxShadow: `0 8px 32px -8px ${palette.primary}20`,
      };
    case "soft":
      return {
        ...base,
        background: `${palette.primary}08`,
        border: `1px solid ${palette.primary}12`,
      };
    case "glow":
      return {
        ...base,
        background: `${palette.background}E6`,
        boxShadow: `0 0 24px ${palette.primary}30, ${shadows.card}`,
        border: `1px solid ${palette.primary}20`,
      };
    case "glass":
      return {
        ...base,
        background: `${palette.background}1A`,
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        border: `1px solid ${palette.primary}18`,
        boxShadow: `0 8px 32px -8px rgba(0,0,0,0.12), inset 0 1px 0 ${palette.background}30`,
      };
    default:
      return base;
  }
}

// ─── Fonts ────────────────────────────────────────────────
export function getFonts(tokens: Record<string, any>) {
  return {
    primary: tokens?.fontPrimary || "Inter",
    secondary: tokens?.fontSecondary || "Inter",
  };
}

/**
 * Returns a Google Fonts URL to load required fonts.
 * Includes per-element font overrides from CardFonts.
 */
export function getGoogleFontsUrl(tokens: Record<string, any>, fonts?: Record<string, any>): string | null {
  const baseFonts = getFonts(tokens);
  const needed = new Set<string>();
  if (baseFonts.primary !== "Inter") needed.add(baseFonts.primary);
  if (baseFonts.secondary !== "Inter") needed.add(baseFonts.secondary);
  // Include per-element font overrides
  if (fonts) {
    const overrideKeys = ["nameFont", "taglineFont", "sectionHeadingFont", "buttonFont"];
    for (const key of overrideKeys) {
      const val = fonts[key];
      if (val && val !== "Inter") needed.add(val);
    }
  }
  if (needed.size === 0) return null;
  const families = [...needed].map(f => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ─── Full resolved config ─────────────────────────────────
export interface ResolvedCardTheme {
  radii: ReturnType<typeof getRadii>;
  shadows: ReturnType<typeof getShadows>;
  spacing: ReturnType<typeof getSpacing>;
  button: ReturnType<typeof getButtonTokens>;
  header: ReturnType<typeof getHeaderTokens>;
  section: ReturnType<typeof getSectionTokens>;
  fonts: ReturnType<typeof getFonts>;
  palette: { primary: string; secondary: string; accent: string; background: string };
}

export function resolveCardTheme(
  tokens: Record<string, any>,
  palette: { primary: string; secondary: string; accent: string; background: string }
): ResolvedCardTheme {
  return {
    radii: getRadii(tokens),
    shadows: getShadows(tokens),
    spacing: getSpacing(tokens),
    button: getButtonTokens(tokens),
    header: getHeaderTokens(tokens),
    section: getSectionTokens(tokens),
    fonts: getFonts(tokens),
    palette,
  };
}
