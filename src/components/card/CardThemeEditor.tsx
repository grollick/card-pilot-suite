import { useState, useEffect, useCallback } from "react";
import { Palette, Type, Check, RotateCcw, Layout, Square, Layers, Sparkles, Sun, Moon, Circle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ButtonShape, ButtonStyle, ButtonSize, HeaderLayout, SectionCardStyle, SectionDivider } from "@/lib/cardTokens";

export interface CardPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface CardFonts {
  primary: string;
  secondary: string;
}

export interface CardStyleTokens {
  button?: { shape?: ButtonShape; style?: ButtonStyle; size?: ButtonSize };
  header?: { layout?: HeaderLayout; avatarShape?: "circle" | "rounded" | "square" };
  section?: { cardStyle?: SectionCardStyle; divider?: SectionDivider; dividerWidth?: number; dividerColor?: string };
  spacingScale?: "compact" | "comfortable" | "airy";
  shadow?: { card?: string; button?: string };
  radius?: { card?: number; button?: number };
}

export interface CardGradientBg {
  enabled: boolean;
  color2: string;
  direction: "to bottom" | "to right" | "to bottom right" | "to top right";
}

export type BgPatternType = "none" | "dots" | "lines" | "grid" | "noise";

export interface CardBgPattern {
  type: BgPatternType;
  opacity: number;
  color?: string;
}

export interface CardThemeOverrides {
  palette?: CardPalette;
  fonts?: CardFonts;
  tokens?: CardStyleTokens;
  gradientBg?: CardGradientBg;
  bgPattern?: CardBgPattern;
}

const FONT_OPTIONS = [
  "Inter", "DM Sans", "DM Serif Display", "Playfair Display", "Poppins",
  "Montserrat", "Lora", "Space Grotesk", "Sora", "Outfit", "Raleway",
  "Crimson Pro", "Libre Baskerville", "Josefin Sans", "Bebas Neue",
];

/** Returns an inline SVG data URL for a given pattern type */
function getPatternSvg(type: BgPatternType, color: string): string {
  const hex = encodeURIComponent(color);
  switch (type) {
    case "dots":
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='${hex}'/%3E%3C/svg%3E")`;
    case "lines":
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='20' x2='20' y2='0' stroke='${hex}' stroke-width='0.5'/%3E%3C/svg%3E")`;
    case "grid":
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='${hex}' stroke-width='0.5'/%3E%3C/svg%3E")`;
    case "noise":
      return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;
    default:
      return "";
  }
}

/** Exported for use in PublicCard / CardBuilder */
export { getPatternSvg };

interface PaletteCategory {
  label: string;
  icon: React.ReactNode;
  palettes: { name: string; palette: CardPalette }[];
}

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    label: "Light",
    icon: <Sun className="h-3.5 w-3.5" />,
    palettes: [
      { name: "Ocean", palette: { primary: "#4361ee", secondary: "#6b7280", accent: "#7c3aed", background: "#ffffff" } },
      { name: "Sage", palette: { primary: "#4a7c6f", secondary: "#64748b", accent: "#2dd4bf", background: "#f8faf9" } },
      { name: "Clay", palette: { primary: "#c2775e", secondary: "#78716c", accent: "#e07a5f", background: "#fdf6f0" } },
      { name: "Lavender", palette: { primary: "#7c5cbf", secondary: "#6b7280", accent: "#a78bfa", background: "#faf8ff" } },
      { name: "Cobalt", palette: { primary: "#2563eb", secondary: "#64748b", accent: "#0ea5e9", background: "#f8fafc" } },
      { name: "Rose", palette: { primary: "#e11d48", secondary: "#71717a", accent: "#f43f5e", background: "#fff1f2" } },
      { name: "Olive", palette: { primary: "#65803c", secondary: "#6b7280", accent: "#84cc16", background: "#fafdf2" } },
      { name: "Copper", palette: { primary: "#b45309", secondary: "#78716c", accent: "#d97706", background: "#fffbeb" } },
    ],
  },
  {
    label: "Dark",
    icon: <Moon className="h-3.5 w-3.5" />,
    palettes: [
      { name: "Midnight", palette: { primary: "#818cf8", secondary: "#94a3b8", accent: "#c084fc", background: "#0f172a" } },
      { name: "Carbon", palette: { primary: "#f0f0f0", secondary: "#a1a1aa", accent: "#e4e4e7", background: "#18181b" } },
      { name: "Neon", palette: { primary: "#06b6d4", secondary: "#94a3b8", accent: "#8b5cf6", background: "#020617" } },
      { name: "Aurora", palette: { primary: "#34d399", secondary: "#94a3b8", accent: "#22d3ee", background: "#0c1222" } },
    ],
  },
  {
    label: "Neutral",
    icon: <Circle className="h-3.5 w-3.5" />,
    palettes: [
      { name: "Slate", palette: { primary: "#475569", secondary: "#94a3b8", accent: "#334155", background: "#f8fafc" } },
      { name: "Warm Gray", palette: { primary: "#57534e", secondary: "#a8a29e", accent: "#78716c", background: "#fafaf9" } },
      { name: "Ink", palette: { primary: "#1e293b", secondary: "#64748b", accent: "#475569", background: "#ffffff" } },
      { name: "Sand", palette: { primary: "#92702c", secondary: "#8b8680", accent: "#b8972e", background: "#faf7f2" } },
    ],
  },
  {
    label: "Social",
    icon: <Share2 className="h-3.5 w-3.5" />,
    palettes: [
      { name: "LinkedIn", palette: { primary: "#0a66c2", secondary: "#64748b", accent: "#0073b1", background: "#f3f6f8" } },
      { name: "YouTube", palette: { primary: "#ff0000", secondary: "#606060", accent: "#cc0000", background: "#ffffff" } },
      { name: "Facebook", palette: { primary: "#1877f2", secondary: "#65676b", accent: "#166fe5", background: "#f0f2f5" } },
      { name: "X", palette: { primary: "#000000", secondary: "#71767b", accent: "#1d9bf0", background: "#ffffff" } },
      { name: "TikTok", palette: { primary: "#000000", secondary: "#71767b", accent: "#fe2c55", background: "#ffffff" } },
      { name: "Instagram", palette: { primary: "#e1306c", secondary: "#8e8e8e", accent: "#833ab4", background: "#fafafa" } },
      { name: "Snapchat", palette: { primary: "#fffc00", secondary: "#333333", accent: "#000000", background: "#ffffff" } },
      { name: "WhatsApp", palette: { primary: "#25d366", secondary: "#667781", accent: "#128c7e", background: "#f0f2f5" } },
      { name: "Pinterest", palette: { primary: "#e60023", secondary: "#767676", accent: "#bd081c", background: "#ffffff" } },
      { name: "Twitch", palette: { primary: "#9146ff", secondary: "#53535f", accent: "#772ce8", background: "#f7f7f8" } },
      { name: "Spotify", palette: { primary: "#1db954", secondary: "#b3b3b3", accent: "#1ed760", background: "#121212" } },
      { name: "Discord", palette: { primary: "#5865f2", secondary: "#949ba4", accent: "#4752c4", background: "#f2f3f5" } },
      { name: "Telegram", palette: { primary: "#0088cc", secondary: "#708499", accent: "#179cde", background: "#f5f5f5" } },
    ],
  },
];

const PRESET_PALETTES = PALETTE_CATEGORIES.flatMap((c) => c.palettes);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOverrides: CardThemeOverrides;
  stylePackPalettes?: CardPalette[];
  stylePackFonts?: CardFonts;
  stylePackTokens?: Record<string, any>;
  onSave: (overrides: CardThemeOverrides) => void;
}

export default function CardThemeEditor({
  open,
  onOpenChange,
  currentOverrides,
  stylePackPalettes,
  stylePackFonts,
  stylePackTokens,
  onSave,
}: Props) {
  const defaultPalette = stylePackPalettes?.[0] ?? PRESET_PALETTES[0].palette;
  const defaultFonts = stylePackFonts ?? { primary: "Inter", secondary: "Inter" };

  const [palette, setPalette] = useState<CardPalette>(currentOverrides.palette ?? defaultPalette);
  const [fonts, setFonts] = useState<CardFonts>(currentOverrides.fonts ?? defaultFonts);
  const [tokens, setTokens] = useState<CardStyleTokens>(currentOverrides.tokens ?? {});
  const [gradientBg, setGradientBg] = useState<CardGradientBg>(currentOverrides.gradientBg ?? { enabled: false, color2: "#e0e7ff", direction: "to bottom right" });
  const [bgPattern, setBgPattern] = useState<CardBgPattern>(currentOverrides.bgPattern ?? { type: "none", opacity: 0.08 });

  useEffect(() => {
    setPalette(currentOverrides.palette ?? defaultPalette);
    setFonts(currentOverrides.fonts ?? defaultFonts);
    setTokens(currentOverrides.tokens ?? {});
    setGradientBg(currentOverrides.gradientBg ?? { enabled: false, color2: "#e0e7ff", direction: "to bottom right" });
    setBgPattern(currentOverrides.bgPattern ?? { type: "none", opacity: 0.08 });
  }, [open]);

  const handleColorChange = useCallback((key: keyof CardPalette, value: string) => {
    setPalette((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePreset = useCallback((preset: CardPalette) => {
    setPalette(preset);
  }, []);

  const handleReset = useCallback(() => {
    setPalette(defaultPalette);
    setFonts(defaultFonts);
    setTokens({});
    setGradientBg({ enabled: false, color2: "#e0e7ff", direction: "to bottom right" });
    setBgPattern({ type: "none", opacity: 0.08 });
  }, [defaultPalette, defaultFonts]);

  const handleSave = useCallback(() => {
    onSave({
      palette, fonts, tokens,
      gradientBg: gradientBg.enabled ? gradientBg : undefined,
      bgPattern: bgPattern.type !== "none" ? bgPattern : undefined,
    });
    onOpenChange(false);
  }, [palette, fonts, tokens, gradientBg, bgPattern, onSave, onOpenChange]);

  const updateToken = useCallback(<K extends keyof CardStyleTokens>(key: K, value: CardStyleTokens[K]) => {
    setTokens((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateNestedToken = useCallback((group: "button" | "header" | "section" | "shadow" | "radius", field: string, value: any) => {
    setTokens((prev) => ({
      ...prev,
      [group]: { ...(prev[group] as any ?? {}), [field]: value },
    }));
  }, []);

  const resolvedButton = {
    shape: tokens.button?.shape ?? (stylePackTokens?.button?.shape ?? "rounded"),
    style: tokens.button?.style ?? (stylePackTokens?.button?.style ?? "filled"),
    size: tokens.button?.size ?? (stylePackTokens?.button?.size ?? "lg"),
  };
  const resolvedHeader = {
    layout: tokens.header?.layout ?? (stylePackTokens?.header?.layout ?? "classic"),
    avatarShape: tokens.header?.avatarShape ?? (stylePackTokens?.header?.avatarShape ?? "circle"),
  };
  const resolvedSection = {
    cardStyle: tokens.section?.cardStyle ?? (stylePackTokens?.section?.cardStyle ?? "solid"),
    divider: tokens.section?.divider ?? (stylePackTokens?.section?.divider ?? "none"),
    dividerWidth: tokens.section?.dividerWidth ?? (stylePackTokens?.section?.dividerWidth ?? 100),
    dividerColor: tokens.section?.dividerColor ?? (stylePackTokens?.section?.dividerColor ?? ""),
  };
  const resolvedSpacing = tokens.spacingScale ?? (stylePackTokens?.spacingScale ?? "comfortable");
  const resolvedShadowCard = tokens.shadow?.card ?? (stylePackTokens?.shadow?.card ?? "soft");
  const resolvedShadowButton = tokens.shadow?.button ?? (stylePackTokens?.shadow?.button ?? "soft");
  const resolvedRadiusCard = tokens.radius?.card ?? (stylePackTokens?.radius?.card ?? 16);
  const resolvedRadiusButton = tokens.radius?.button ?? (stylePackTokens?.radius?.button ?? 12);

  const COLOR_FIELDS: { key: keyof CardPalette; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "secondary", label: "Text" },
    { key: "background", label: "Background" },
  ];

  const OptionGrid = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${
            value === opt.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme & Styling
          </SheetTitle>
          <SheetDescription>
            Customize colors, typography, and card styling
          </SheetDescription>
        </SheetHeader>

        <Accordion type="multiple" defaultValue={["colors", "card-style"]} className="mt-6">
          {/* ── Colors ── */}
          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Colors
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* Preset Palettes by Category */}
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Presets</Label>
                <Accordion type="multiple" defaultValue={["Light"]} className="space-y-0">
                  {PALETTE_CATEGORIES.map((category) => {
                    const hasActive = category.palettes.some(
                      (p) => p.palette.primary === palette.primary && p.palette.accent === palette.accent
                    );
                    return (
                      <AccordionItem key={category.label} value={category.label} className="border-b-0">
                        <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                          <span className={`flex items-center gap-1.5 ${hasActive ? "text-primary" : "text-muted-foreground"}`}>
                            {category.icon}
                            {category.label}
                            <span className="text-[10px] text-muted-foreground/60 font-normal">({category.palettes.length})</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2 pt-0">
                          <div className="grid grid-cols-4 gap-2">
                            {category.palettes.map((preset) => {
                              const isActive = preset.palette.primary === palette.primary && preset.palette.accent === palette.accent;
                              return (
                                <button
                                  key={preset.name}
                                  onClick={() => handlePreset(preset.palette)}
                                  className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                                    isActive ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/50 hover:border-border hover:bg-muted/30"
                                  }`}
                                >
                                  <div className="flex gap-0.5">
                                    <div className="h-5 w-5 rounded-full border border-border/30" style={{ background: preset.palette.primary }} />
                                    <div className="h-5 w-5 rounded-full border border-border/30" style={{ background: preset.palette.accent }} />
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground">{preset.name}</span>
                                  {isActive && <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
              {stylePackPalettes && stylePackPalettes.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From Your Style Pack</Label>
                  <div className="flex gap-2 flex-wrap">
                    {stylePackPalettes.map((sp, i) => (
                      <button key={i} onClick={() => handlePreset(sp)} className="flex gap-0.5 p-1.5 rounded-lg border border-border/50 hover:border-primary/40 transition-all">
                        <div className="h-4 w-4 rounded-full" style={{ background: sp.primary }} />
                        <div className="h-4 w-4 rounded-full" style={{ background: sp.accent }} />
                        <div className="h-4 w-4 rounded-full" style={{ background: sp.background }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Colors */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Custom Colors</Label>
                <div className="grid grid-cols-2 gap-3">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={palette[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                        />
                        <Input
                          value={palette[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="h-9 text-xs font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient Background */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gradient Background</Label>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Enable gradient</span>
                  <Switch checked={gradientBg.enabled} onCheckedChange={(v) => setGradientBg(prev => ({ ...prev, enabled: v }))} />
                </div>
                {gradientBg.enabled && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Second Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={gradientBg.color2}
                          onChange={(e) => setGradientBg(prev => ({ ...prev, color2: e.target.value }))}
                          className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                        />
                        <Input
                          value={gradientBg.color2}
                          onChange={(e) => setGradientBg(prev => ({ ...prev, color2: e.target.value }))}
                          className="h-9 text-xs font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Direction</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          { value: "to bottom", label: "↓" },
                          { value: "to right", label: "→" },
                          { value: "to bottom right", label: "↘" },
                          { value: "to top right", label: "↗" },
                        ] as const).map((dir) => (
                          <button
                            key={dir.value}
                            onClick={() => setGradientBg(prev => ({ ...prev, direction: dir.value }))}
                            className={`px-2 py-1.5 rounded-md text-sm font-medium border transition-all ${
                              gradientBg.direction === dir.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                            }`}
                          >
                            {dir.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Background Pattern */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pattern Overlay</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {([
                    { value: "none", label: "None" },
                    { value: "dots", label: "Dots" },
                    { value: "lines", label: "Lines" },
                    { value: "grid", label: "Grid" },
                    { value: "noise", label: "Noise" },
                  ] as const).map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setBgPattern(prev => ({ ...prev, type: p.value }))}
                      className={`px-1.5 py-1.5 rounded-md text-[10px] font-medium border transition-all ${
                        bgPattern.type === p.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {bgPattern.type !== "none" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Pattern Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgPattern.color || palette.secondary}
                          onChange={(e) => setBgPattern(prev => ({ ...prev, color: e.target.value }))}
                          className="w-8 h-8 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
                        />
                        <Input
                          value={bgPattern.color || palette.secondary}
                          onChange={(e) => setBgPattern(prev => ({ ...prev, color: e.target.value }))}
                          className="h-8 text-xs font-mono flex-1"
                        />
                        {bgPattern.color && (
                          <button
                            onClick={() => setBgPattern(prev => ({ ...prev, color: undefined }))}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Opacity</Label>
                      <Slider
                        value={[bgPattern.opacity * 100]}
                        onValueChange={([v]) => setBgPattern(prev => ({ ...prev, opacity: v / 100 }))}
                        min={2}
                        max={25}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-[10px] text-muted-foreground">{Math.round(bgPattern.opacity * 100)}%</span>
                    </div>
                  </>
                )}
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</Label>
                <div
                  className="rounded-xl p-4 border border-border/50 relative overflow-hidden"
                  style={{
                    background: gradientBg.enabled
                      ? `linear-gradient(${gradientBg.direction}, ${palette.background}, ${gradientBg.color2})`
                      : palette.background,
                  }}
                >
                  {bgPattern.type !== "none" && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        opacity: bgPattern.opacity,
                        backgroundImage: getPatternSvg(bgPattern.type, bgPattern.color || palette.secondary),
                        backgroundSize: bgPattern.type === "noise" ? "200px 200px" : "20px 20px",
                      }}
                    />
                  )}
                  <div className="relative z-[1]">
                    <div className="h-3 w-20 rounded-full mb-2" style={{ background: palette.primary }} />
                    <div className="h-2 w-32 rounded-full mb-3" style={{ background: palette.secondary, opacity: 0.5 }} />
                    <div className="flex gap-2 mt-3">
                      <div className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ background: palette.primary, color: palette.background }}>Button</div>
                      <div className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`, color: "#fff" }}>Accent</div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Card Styling ── */}
          <AccordionItem value="card-style">
            <AccordionTrigger className="text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Card Styling
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-5 pt-2">
              {/* Button Style */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Button Style</Label>
                <OptionGrid
                  options={[
                    { value: "filled", label: "Filled" },
                    { value: "outline", label: "Outline" },
                    { value: "gradient", label: "Gradient" },
                  ]}
                  value={resolvedButton.style}
                  onChange={(v) => updateNestedToken("button", "style", v)}
                />
              </div>

              {/* Button Shape */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Button Shape</Label>
                <OptionGrid
                  options={[
                    { value: "rounded", label: "Rounded" },
                    { value: "pill", label: "Pill" },
                  ]}
                  value={resolvedButton.shape}
                  onChange={(v) => updateNestedToken("button", "shape", v)}
                />
              </div>

              {/* Button Size */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Button Size</Label>
                <OptionGrid
                  options={[
                    { value: "sm", label: "Small" },
                    { value: "md", label: "Medium" },
                    { value: "lg", label: "Large" },
                  ]}
                  value={resolvedButton.size}
                  onChange={(v) => updateNestedToken("button", "size", v)}
                />
              </div>

              {/* Section Card Style */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Section Style</Label>
                <OptionGrid
                  options={[
                    { value: "solid", label: "Solid" },
                    { value: "frosted", label: "Frosted" },
                    { value: "elevated", label: "Elevated" },
                  ]}
                  value={resolvedSection.cardStyle}
                  onChange={(v) => updateNestedToken("section", "cardStyle", v)}
                />
                <OptionGrid
                  options={[
                    { value: "soft", label: "Soft" },
                    { value: "glow", label: "Glow" },
                  ]}
                  value={resolvedSection.cardStyle}
                  onChange={(v) => updateNestedToken("section", "cardStyle", v)}
                />
              </div>

              {/* Section Divider */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Section Divider</Label>
                <OptionGrid
                  options={[
                    { value: "none", label: "None" },
                    { value: "hairline", label: "Hairline" },
                  ]}
                  value={resolvedSection.divider}
                  onChange={(v) => updateNestedToken("section", "divider", v)}
                />
              </div>

              {/* Divider Width */}
              {resolvedSection.divider === "hairline" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Divider Length</Label>
                    <span className="text-xs text-muted-foreground">{resolvedSection.dividerWidth}%</span>
                  </div>
                  <Slider
                    min={20}
                    max={100}
                    step={5}
                    value={[resolvedSection.dividerWidth]}
                    onValueChange={([v]) => updateNestedToken("section", "dividerWidth", v)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Divider Color */}
              {resolvedSection.divider === "hairline" && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Divider Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={resolvedSection.dividerColor || palette.secondary}
                      onChange={(e) => updateNestedToken("section", "dividerColor", e.target.value)}
                      className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    />
                    <Input
                      value={resolvedSection.dividerColor || "auto"}
                      onChange={(e) => updateNestedToken("section", "dividerColor", e.target.value)}
                      placeholder="auto"
                      className="h-9 text-xs font-mono uppercase"
                      maxLength={7}
                    />
                    {resolvedSection.dividerColor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2 text-xs"
                        onClick={() => updateNestedToken("section", "dividerColor", "")}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Header Layout */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Header Layout</Label>
                <OptionGrid
                  options={[
                    { value: "classic", label: "Classic" },
                    { value: "cover", label: "Cover" },
                    { value: "hero", label: "Hero" },
                  ]}
                  value={resolvedHeader.layout}
                  onChange={(v) => updateNestedToken("header", "layout", v)}
                />
              </div>

              {/* Avatar Shape */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avatar Shape</Label>
                <OptionGrid
                  options={[
                    { value: "circle", label: "Circle" },
                    { value: "rounded", label: "Rounded" },
                    { value: "square", label: "Square" },
                  ]}
                  value={resolvedHeader.avatarShape}
                  onChange={(v) => updateNestedToken("header", "avatarShape", v)}
                />
              </div>

              {/* Spacing */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spacing</Label>
                <OptionGrid
                  options={[
                    { value: "compact", label: "Compact" },
                    { value: "comfortable", label: "Comfort" },
                    { value: "airy", label: "Airy" },
                  ]}
                  value={resolvedSpacing}
                  onChange={(v) => updateToken("spacingScale", v as any)}
                />
              </div>

              {/* Shadow */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Card Shadow</Label>
                <OptionGrid
                  options={[
                    { value: "none", label: "None" },
                    { value: "subtle", label: "Subtle" },
                    { value: "soft", label: "Soft" },
                  ]}
                  value={resolvedShadowCard}
                  onChange={(v) => updateNestedToken("shadow", "card", v)}
                />
              </div>

              {/* Radius */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Corner Radius — {resolvedRadiusCard}px
                </Label>
                <Slider
                  value={[resolvedRadiusCard]}
                  onValueChange={([v]) => updateNestedToken("radius", "card", v)}
                  min={0}
                  max={32}
                  step={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Typography ── */}
          <AccordionItem value="typography">
            <AccordionTrigger className="text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Type className="h-4 w-4" /> Typography
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Heading Font</Label>
                <Select value={fonts.primary} onValueChange={(v) => setFonts((f) => ({ ...f, primary: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: `'${font}', sans-serif` }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Body Font</Label>
                <Select value={fonts.secondary} onValueChange={(v) => setFonts((f) => ({ ...f, secondary: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: `'${font}', sans-serif` }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-4 mt-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button size="sm" className="flex-1" onClick={handleSave}>
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Apply Theme
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
