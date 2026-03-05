import { useState, useEffect, useCallback } from "react";
import { Palette, Type, Check, RotateCcw, Layout, Square, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  section?: { cardStyle?: SectionCardStyle; divider?: SectionDivider };
  spacingScale?: "compact" | "comfortable" | "airy";
  shadow?: { card?: string; button?: string };
  radius?: { card?: number; button?: number };
}

export interface CardThemeOverrides {
  palette?: CardPalette;
  fonts?: CardFonts;
  tokens?: CardStyleTokens;
}

const FONT_OPTIONS = [
  "Inter", "DM Sans", "DM Serif Display", "Playfair Display", "Poppins",
  "Montserrat", "Lora", "Space Grotesk", "Sora", "Outfit", "Raleway",
  "Crimson Pro", "Libre Baskerville", "Josefin Sans", "Bebas Neue",
];

const PRESET_PALETTES: { name: string; palette: CardPalette }[] = [
  { name: "Ocean", palette: { primary: "#4361ee", secondary: "#6b7280", accent: "#7c3aed", background: "#ffffff" } },
  { name: "Forest", palette: { primary: "#059669", secondary: "#6b7280", accent: "#0d9488", background: "#ffffff" } },
  { name: "Sunset", palette: { primary: "#ea580c", secondary: "#78716c", accent: "#dc2626", background: "#fffbeb" } },
  { name: "Midnight", palette: { primary: "#818cf8", secondary: "#94a3b8", accent: "#c084fc", background: "#0f172a" } },
  { name: "Rose", palette: { primary: "#e11d48", secondary: "#71717a", accent: "#db2777", background: "#fff1f2" } },
  { name: "Slate", palette: { primary: "#475569", secondary: "#94a3b8", accent: "#334155", background: "#f8fafc" } },
  { name: "Gold", palette: { primary: "#b45309", secondary: "#78716c", accent: "#a16207", background: "#fffbeb" } },
  { name: "Neon", palette: { primary: "#06b6d4", secondary: "#94a3b8", accent: "#8b5cf6", background: "#020617" } },
];

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

  useEffect(() => {
    setPalette(currentOverrides.palette ?? defaultPalette);
    setFonts(currentOverrides.fonts ?? defaultFonts);
    setTokens(currentOverrides.tokens ?? {});
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
  }, [defaultPalette, defaultFonts]);

  const handleSave = useCallback(() => {
    onSave({ palette, fonts, tokens });
    onOpenChange(false);
  }, [palette, fonts, tokens, onSave, onOpenChange]);

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
              {/* Preset Palettes */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Presets</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_PALETTES.map((preset) => {
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
                {stylePackPalettes && stylePackPalettes.length > 1 && (
                  <>
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
                  </>
                )}
              </div>

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

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</Label>
                <div className="rounded-xl p-4 border border-border/50" style={{ background: palette.background }}>
                  <div className="h-3 w-20 rounded-full mb-2" style={{ background: palette.primary }} />
                  <div className="h-2 w-32 rounded-full mb-3" style={{ background: palette.secondary, opacity: 0.5 }} />
                  <div className="flex gap-2 mt-3">
                    <div className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ background: palette.primary, color: palette.background }}>Button</div>
                    <div className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`, color: "#fff" }}>Accent</div>
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
