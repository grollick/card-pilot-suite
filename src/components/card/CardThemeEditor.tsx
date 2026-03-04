import { useState, useEffect, useCallback } from "react";
import { Palette, Type, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

export interface CardThemeOverrides {
  palette?: CardPalette;
  fonts?: CardFonts;
}

const FONT_OPTIONS = [
  "Inter",
  "DM Sans",
  "DM Serif Display",
  "Playfair Display",
  "Poppins",
  "Montserrat",
  "Lora",
  "Space Grotesk",
  "Sora",
  "Outfit",
  "Raleway",
  "Crimson Pro",
  "Libre Baskerville",
  "Josefin Sans",
  "Bebas Neue",
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
  onSave: (overrides: CardThemeOverrides) => void;
}

export default function CardThemeEditor({
  open,
  onOpenChange,
  currentOverrides,
  stylePackPalettes,
  stylePackFonts,
  onSave,
}: Props) {
  const defaultPalette = stylePackPalettes?.[0] ?? PRESET_PALETTES[0].palette;
  const defaultFonts = stylePackFonts ?? { primary: "Inter", secondary: "Inter" };

  const [palette, setPalette] = useState<CardPalette>(
    currentOverrides.palette ?? defaultPalette
  );
  const [fonts, setFonts] = useState<CardFonts>(
    currentOverrides.fonts ?? defaultFonts
  );

  useEffect(() => {
    setPalette(currentOverrides.palette ?? defaultPalette);
    setFonts(currentOverrides.fonts ?? defaultFonts);
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
  }, [defaultPalette, defaultFonts]);

  const handleSave = useCallback(() => {
    onSave({ palette, fonts });
    onOpenChange(false);
  }, [palette, fonts, onSave, onOpenChange]);

  const isDefaultPalette =
    palette.primary === defaultPalette.primary &&
    palette.secondary === defaultPalette.secondary &&
    palette.accent === defaultPalette.accent &&
    palette.background === defaultPalette.background;

  const COLOR_FIELDS: { key: keyof CardPalette; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "secondary", label: "Text" },
    { key: "background", label: "Background" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme & Colors
          </SheetTitle>
          <SheetDescription>
            Customize your card's colors and typography
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* ── Preset Palettes ── */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preset Palettes
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_PALETTES.map((preset) => {
                const isActive =
                  preset.palette.primary === palette.primary &&
                  preset.palette.accent === palette.accent;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handlePreset(preset.palette)}
                    className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex gap-0.5">
                      <div
                        className="h-5 w-5 rounded-full border border-border/30"
                        style={{ background: preset.palette.primary }}
                      />
                      <div
                        className="h-5 w-5 rounded-full border border-border/30"
                        style={{ background: preset.palette.accent }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {preset.name}
                    </span>
                    {isActive && (
                      <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Style pack palettes */}
            {stylePackPalettes && stylePackPalettes.length > 1 && (
              <>
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  From Your Style Pack
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {stylePackPalettes.map((sp, i) => (
                    <button
                      key={i}
                      onClick={() => handlePreset(sp)}
                      className="flex gap-0.5 p-1.5 rounded-lg border border-border/50 hover:border-primary/40 transition-all"
                    >
                      <div className="h-4 w-4 rounded-full" style={{ background: sp.primary }} />
                      <div className="h-4 w-4 rounded-full" style={{ background: sp.accent }} />
                      <div className="h-4 w-4 rounded-full" style={{ background: sp.background }} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Custom Colors ── */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custom Colors
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={palette[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                      />
                    </div>
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

          {/* ── Preview ── */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview
            </Label>
            <div
              className="rounded-xl p-4 border border-border/50"
              style={{ background: palette.background }}
            >
              <div
                className="h-3 w-20 rounded-full mb-2"
                style={{ background: palette.primary }}
              />
              <div
                className="h-2 w-32 rounded-full mb-3"
                style={{ background: palette.secondary, opacity: 0.5 }}
              />
              <p
                style={{
                  fontFamily: `'${fonts.primary}', sans-serif`,
                  fontWeight: 700,
                  fontSize: 16,
                  color: palette.primary,
                  margin: 0,
                }}
              >
                Heading Font
              </p>
              <p
                style={{
                  fontFamily: `'${fonts.secondary}', sans-serif`,
                  fontSize: 13,
                  color: palette.secondary,
                  margin: "4px 0 0",
                }}
              >
                Body text preview in your chosen font
              </p>
              <div className="flex gap-2 mt-3">
                <div
                  className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold"
                  style={{ background: palette.primary, color: palette.background }}
                >
                  Button
                </div>
                <div
                  className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                    color: "#fff",
                  }}
                >
                  Accent
                </div>
              </div>
            </div>
          </div>

          {/* ── Fonts ── */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              Typography
            </Label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Heading Font</Label>
                <Select value={fonts.primary} onValueChange={(v) => setFonts((f) => ({ ...f, primary: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: `'${font}', sans-serif` }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isDefaultPalette}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" className="flex-1" onClick={handleSave}>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Apply Theme
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
