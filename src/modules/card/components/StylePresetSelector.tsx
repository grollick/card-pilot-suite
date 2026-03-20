import { Check, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { CardPalette, CardFonts, CardStyleTokens } from "./CardThemeEditor";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
  palette: CardPalette;
  fonts: CardFonts;
  tokens: CardStyleTokens;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean lines, balanced spacing",
    isPro: false,
    palette: { primary: "#2563eb", secondary: "#64748b", accent: "#0ea5e9", background: "#f8fafc" },
    fonts: { primary: "Inter", secondary: "Inter" },
    tokens: {
      button: { shape: "rounded", style: "filled", size: "md" },
      header: { layout: "classic", avatarShape: "circle" },
      section: { cardStyle: "solid", divider: "hairline" },
      spacingScale: "comfortable",
      shadow: { card: "soft", button: "subtle" },
      radius: { card: 16, button: 12 },
    },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Strong contrasts, punchy type",
    isPro: false,
    palette: { primary: "#dc2626", secondary: "#111827", accent: "#f59e0b", background: "#fff7ed" },
    fonts: { primary: "Bebas Neue", secondary: "DM Sans" },
    tokens: {
      button: { shape: "rounded", style: "filled", size: "lg" },
      header: { layout: "cover", avatarShape: "square" },
      section: { cardStyle: "elevated", divider: "none" },
      spacingScale: "compact",
      shadow: { card: "strong", button: "soft" },
      radius: { card: 8, button: 4 },
    },
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant serifs, refined feel",
    isPro: true,
    palette: { primary: "#9f1239", secondary: "#3f1d2e", accent: "#d4a017", background: "#fffaf3" },
    fonts: { primary: "Playfair Display", secondary: "Crimson Pro" },
    tokens: {
      button: { shape: "pill", style: "outline", size: "md" },
      header: { layout: "classic", avatarShape: "circle" },
      section: { cardStyle: "glass", divider: "hairline" },
      spacingScale: "airy",
      shadow: { card: "soft", button: "none" },
      radius: { card: 20, button: 24 },
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Stripped back, content first",
    isPro: true,
    palette: { primary: "#374151", secondary: "#6b7280", accent: "#9ca3af", background: "#ffffff" },
    fonts: { primary: "Space Grotesk", secondary: "Inter" },
    tokens: {
      button: { shape: "rounded", style: "outline", size: "sm" },
      header: { layout: "classic", avatarShape: "rounded" },
      section: { cardStyle: "solid", divider: "none" },
      spacingScale: "airy",
      shadow: { card: "none", button: "none" },
      radius: { card: 12, button: 8 },
    },
  },
];

interface Props {
  activePresetId: string | null;
  isPro: boolean;
  onSelect: (preset: StylePreset) => void;
  onUpgrade?: () => void;
}

export default function StylePresetSelector({ activePresetId, isPro, onSelect, onUpgrade }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {STYLE_PRESETS.map((preset) => {
        const isActive = activePresetId === preset.id;
        const locked = preset.isPro && !isPro;

        return (
          <motion.button
            key={preset.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (locked) {
                onUpgrade?.();
                return;
              }
              onSelect(preset);
            }}
            className={`relative rounded-xl border p-3 text-left transition-all duration-200 group ${
              isActive
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : locked
                ? "border-border/30 bg-muted/10 opacity-70 hover:opacity-90"
                : "border-border/40 bg-background hover:border-primary/30 hover:shadow-sm"
            }`}
          >
            {/* Color preview strip */}
            <div className="flex gap-0.5 mb-2.5 rounded-lg overflow-hidden h-5">
              {[preset.palette.primary, preset.palette.secondary, preset.palette.accent, preset.palette.background].map((color, i) => (
                <div
                  key={i}
                  className="flex-1 first:rounded-l-md last:rounded-r-md"
                  style={{ background: color, border: color === "#ffffff" || color === "#f8fafc" || color === "#fffaf3" || color === "#fff7ed" ? "1px solid hsl(var(--border) / 0.3)" : "none" }}
                />
              ))}
            </div>

            {/* Name + description */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[12px] font-semibold text-foreground">{preset.name}</span>
              {isActive && <Check className="h-3 w-3 text-primary" />}
              {locked && <Crown className="h-3 w-3 text-amber-500" />}
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">{preset.description}</p>

            {/* Font preview */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[11px] text-muted-foreground/60" style={{ fontFamily: preset.fonts.primary }}>
                Aa
              </span>
              <span className="text-[9px] text-muted-foreground/40" style={{ fontFamily: preset.fonts.secondary }}>
                Body text
              </span>
            </div>

            {/* Locked overlay */}
            {locked && (
              <div className="absolute inset-0 rounded-xl bg-background/20 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Upgrade to Pro
                </span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
