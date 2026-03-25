import { useState, useEffect, useCallback, useRef } from "react";
import { Palette, Type, Check, RotateCcw, Layers, Sun, Moon, Circle, Share2, Save, Trash2, Plus, Undo2, Redo2, Sparkles, Image, Briefcase } from "lucide-react";
import { HERO_BACKGROUNDS, getHeroBackgroundsByCategory, type HeroBackground } from "@/lib/heroBackgrounds";
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
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ButtonShape, ButtonStyle, ButtonSize, HeaderLayout, SectionCardStyle, SectionDivider } from "@/lib/cardTokens";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CardPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface CardFonts {
  primary: string;
  secondary: string;
  /** Per-element overrides */
  nameFont?: string;
  taglineFont?: string;
  sectionHeadingFont?: string;
  buttonFont?: string;
  /** Sizes */
  nameFontSize?: number;
  taglineFontSize?: number;
  sectionHeadingFontSize?: number;
  bodyFontSize?: number;
  buttonFontSize?: number;
  /** Weights */
  nameFontWeight?: number;
  taglineFontWeight?: number;
  sectionHeadingFontWeight?: number;
  bodyFontWeight?: number;
  buttonFontWeight?: number;
  /** Letter spacing */
  nameLetterSpacing?: number;
  taglineLetterSpacing?: number;
  /** Line height */
  bodyLineHeight?: number;
  /** Transform */
  nameTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  sectionHeadingTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
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
export type BgPatternCoverage = "full" | "gaps";

export interface CardBgPattern {
  type: BgPatternType;
  opacity: number;
  color?: string;
  scale?: number;
  coverage?: BgPatternCoverage;
}

export type MetallicType = "none" | "gold" | "silver" | "rose-gold" | "bronze" | "platinum";

export interface MetallicEffect {
  type: MetallicType;
  intensity: number; // 0-100
  applyToName: boolean;
  applyToButtons: boolean;
  applyToSections: boolean;
}

export const METALLIC_GRADIENTS: Record<Exclude<MetallicType, "none">, string> = {
  gold: "linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)",
  silver: "linear-gradient(135deg, #C0C0C0 0%, #F5F5F5 25%, #A8A8A8 50%, #E8E8E8 75%, #909090 100%)",
  "rose-gold": "linear-gradient(135deg, #B76E79 0%, #EECDA3 30%, #B76E79 60%, #F0D5C9 100%)",
  bronze: "linear-gradient(135deg, #CD7F32 0%, #E6BE8A 30%, #8C5E2A 60%, #D4A76A 100%)",
  platinum: "linear-gradient(135deg, #E5E4E2 0%, #FFFFFF 30%, #C0C0C0 60%, #E5E4E2 100%)",
};

export const METALLIC_TEXT_COLORS: Record<Exclude<MetallicType, "none">, string> = {
  gold: "#BF953F",
  silver: "#A8A8A8",
  "rose-gold": "#B76E79",
  bronze: "#CD7F32",
  platinum: "#C0C0C0",
};

export interface CardThemeOverrides {
  palette?: CardPalette;
  fonts?: CardFonts;
  tokens?: CardStyleTokens;
  gradientBg?: CardGradientBg;
  bgPattern?: CardBgPattern;
  metallicEffect?: MetallicEffect;
  heroBackgroundId?: string;
  cardLayout?: "classic" | "modern";
}

const FONT_OPTIONS = [
  "Inter", "DM Sans", "DM Serif Display", "Playfair Display", "Poppins",
  "Montserrat", "Lora", "Space Grotesk", "Sora", "Outfit", "Raleway",
  "Crimson Pro", "Libre Baskerville", "Josefin Sans", "Bebas Neue",
  "Roboto", "Open Sans", "Lato", "Oswald", "Merriweather", "Nunito",
  "Rubik", "Work Sans", "Barlow", "Karla", "Manrope", "Bitter",
  "Cormorant Garamond", "Abril Fatface", "Righteous", "Pacifico",
  "Caveat", "Archivo", "Plus Jakarta Sans", "Bricolage Grotesque",
  "Instrument Serif", "Lexend", "Figtree", "Geist",
];

const FONT_CATEGORIES: { label: string; fonts: string[] }[] = [
  { label: "Sans Serif", fonts: ["Inter", "DM Sans", "Poppins", "Montserrat", "Outfit", "Raleway", "Space Grotesk", "Sora", "Josefin Sans", "Roboto", "Open Sans", "Lato", "Nunito", "Rubik", "Work Sans", "Barlow", "Karla", "Manrope", "Archivo", "Plus Jakarta Sans", "Bricolage Grotesque", "Lexend", "Figtree", "Geist"] },
  { label: "Serif", fonts: ["DM Serif Display", "Playfair Display", "Lora", "Crimson Pro", "Libre Baskerville", "Merriweather", "Bitter", "Cormorant Garamond", "Instrument Serif"] },
  { label: "Display", fonts: ["Bebas Neue", "Oswald", "Abril Fatface", "Righteous"] },
  { label: "Handwritten", fonts: ["Pacifico", "Caveat"] },
];

const FONT_WEIGHT_OPTIONS = [
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semi Bold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extra Bold", value: 800 },
  { label: "Black", value: 900 },
];

const TEXT_TRANSFORM_OPTIONS = [
  { label: "None", value: "none" },
  { label: "UPPERCASE", value: "uppercase" },
  { label: "lowercase", value: "lowercase" },
  { label: "Capitalize", value: "capitalize" },
];

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

export { getPatternSvg };

// ── Palette Data ──────────────────────────────────────────

interface PaletteCategory {
  label: string;
  icon: React.ReactNode;
  palettes: { name: string; palette: CardPalette }[];
}

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    label: "Light",
    icon: <Sun className="h-3 w-3" />,
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
    icon: <Moon className="h-3 w-3" />,
    palettes: [
      { name: "Midnight", palette: { primary: "#818cf8", secondary: "#94a3b8", accent: "#c084fc", background: "#0f172a" } },
      { name: "Carbon", palette: { primary: "#f0f0f0", secondary: "#a1a1aa", accent: "#e4e4e7", background: "#18181b" } },
      { name: "Neon", palette: { primary: "#06b6d4", secondary: "#94a3b8", accent: "#8b5cf6", background: "#020617" } },
      { name: "Aurora", palette: { primary: "#34d399", secondary: "#94a3b8", accent: "#22d3ee", background: "#0c1222" } },
    ],
  },
  {
    label: "Neutral",
    icon: <Circle className="h-3 w-3" />,
    palettes: [
      { name: "Slate", palette: { primary: "#475569", secondary: "#94a3b8", accent: "#334155", background: "#f8fafc" } },
      { name: "Warm Gray", palette: { primary: "#57534e", secondary: "#a8a29e", accent: "#78716c", background: "#fafaf9" } },
      { name: "Ink", palette: { primary: "#1e293b", secondary: "#64748b", accent: "#475569", background: "#ffffff" } },
      { name: "Sand", palette: { primary: "#92702c", secondary: "#8b8680", accent: "#b8972e", background: "#faf7f2" } },
    ],
  },
  {
    label: "Social",
    icon: <Share2 className="h-3 w-3" />,
    palettes: [
      { name: "LinkedIn", palette: { primary: "#0a66c2", secondary: "#64748b", accent: "#0073b1", background: "#f3f6f8" } },
      { name: "YouTube", palette: { primary: "#ff0000", secondary: "#606060", accent: "#cc0000", background: "#ffffff" } },
      { name: "Facebook", palette: { primary: "#1877f2", secondary: "#65676b", accent: "#166fe5", background: "#f0f2f5" } },
      { name: "X", palette: { primary: "#000000", secondary: "#71767b", accent: "#1d9bf0", background: "#ffffff" } },
      { name: "TikTok", palette: { primary: "#000000", secondary: "#71767b", accent: "#fe2c55", background: "#ffffff" } },
      { name: "Instagram", palette: { primary: "#e1306c", secondary: "#8e8e8e", accent: "#833ab4", background: "#fafafa" } },
      { name: "WhatsApp", palette: { primary: "#25d366", secondary: "#667781", accent: "#128c7e", background: "#f0f2f5" } },
      { name: "Spotify", palette: { primary: "#1db954", secondary: "#b3b3b3", accent: "#1ed760", background: "#121212" } },
      { name: "Discord", palette: { primary: "#5865f2", secondary: "#949ba4", accent: "#4752c4", background: "#f2f3f5" } },
    ],
  },
  {
    label: "Metallic",
    icon: <Sparkles className="h-3 w-3" />,
    palettes: [
      { name: "Gold", palette: { primary: "#BF953F", secondary: "#6b5c3e", accent: "#D4AF37", background: "#1a1608" } },
      { name: "Silver", palette: { primary: "#A8A8A8", secondary: "#6b6b6b", accent: "#C0C0C0", background: "#0f0f0f" } },
      { name: "Rose Gold", palette: { primary: "#B76E79", secondary: "#7a5c60", accent: "#EECDA3", background: "#1a0f10" } },
      { name: "Bronze", palette: { primary: "#CD7F32", secondary: "#7a6040", accent: "#E6BE8A", background: "#1a1208" } },
      { name: "Platinum", palette: { primary: "#E5E4E2", secondary: "#8a8a8a", accent: "#C0C0C0", background: "#121214" } },
      { name: "Gold Light", palette: { primary: "#9A7B2F", secondary: "#6b5c3e", accent: "#C9A94F", background: "#FFFDF5" } },
      { name: "Silver Light", palette: { primary: "#6b6b6b", secondary: "#999999", accent: "#888888", background: "#F8F8FA" } },
      { name: "Rose Light", palette: { primary: "#B76E79", secondary: "#9a7a7f", accent: "#D4A0A7", background: "#FFF5F5" } },
    ],
  },
  {
    label: "Industry",
    icon: <Briefcase className="h-3 w-3" />,
    palettes: [
      { name: "Contractor", palette: { primary: "#ea6d1f", secondary: "#78716c", accent: "#f59e0b", background: "#fffbf5" } },
      { name: "Barber", palette: { primary: "#7c3aed", secondary: "#6b7280", accent: "#a855f7", background: "#faf5ff" } },
      { name: "Realtor", palette: { primary: "#16a34a", secondary: "#64748b", accent: "#22c55e", background: "#f0fdf4" } },
      { name: "Photographer", palette: { primary: "#e11d64", secondary: "#71717a", accent: "#f43f7e", background: "#fff1f5" } },
      { name: "Landscaper", palette: { primary: "#15803d", secondary: "#6b7280", accent: "#4ade80", background: "#f0fdf4" } },
      { name: "Trainer", palette: { primary: "#0284c7", secondary: "#64748b", accent: "#38bdf8", background: "#f0f9ff" } },
      { name: "Electrician", palette: { primary: "#eab308", secondary: "#525252", accent: "#facc15", background: "#fefce8" } },
      { name: "Plumber", palette: { primary: "#2563eb", secondary: "#6b7280", accent: "#60a5fa", background: "#eff6ff" } },
      { name: "Chef", palette: { primary: "#dc2626", secondary: "#78716c", accent: "#f87171", background: "#fef2f2" } },
      { name: "Auto", palette: { primary: "#1e293b", secondary: "#64748b", accent: "#ef4444", background: "#f8fafc" } },
      { name: "Cleaner", palette: { primary: "#0891b2", secondary: "#64748b", accent: "#22d3ee", background: "#ecfeff" } },
      { name: "Lawyer", palette: { primary: "#1e3a5f", secondary: "#64748b", accent: "#8b5e3c", background: "#f8f6f4" } },
    ],
  },
];

const PRESET_PALETTES = PALETTE_CATEGORIES.flatMap((c) => c.palettes);

// ── Subcomponents ─────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</Label>;
}

function OptionGrid({ options, value, onChange, cols = 3 }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
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
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded-md border border-border cursor-pointer bg-transparent p-0.5 shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-[11px] font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOverrides: CardThemeOverrides;
  stylePackPalettes?: CardPalette[];
  stylePackFonts?: CardFonts;
  stylePackTokens?: Record<string, any>;
  onSave: (overrides: CardThemeOverrides) => void;
  onPreview?: (overrides: CardThemeOverrides) => void;
}

export default function CardThemeEditor({
  open, onOpenChange, currentOverrides,
  stylePackPalettes, stylePackFonts, stylePackTokens, onSave, onPreview,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const defaultPalette = stylePackPalettes?.[0] ?? PRESET_PALETTES[0].palette;
  const defaultFonts = stylePackFonts ?? { primary: "Inter", secondary: "Inter" };

  const [palette, _setPalette] = useState<CardPalette>(currentOverrides.palette ?? defaultPalette);
  const [fonts, _setFonts] = useState<CardFonts>(currentOverrides.fonts ?? defaultFonts);
  const [tokens, _setTokens] = useState<CardStyleTokens>(currentOverrides.tokens ?? {});
  const [gradientBg, _setGradientBg] = useState<CardGradientBg>(currentOverrides.gradientBg ?? { enabled: false, color2: "#e0e7ff", direction: "to bottom right" });
  const [bgPattern, _setBgPattern] = useState<CardBgPattern>(currentOverrides.bgPattern ?? { type: "none", opacity: 0.08 });
  const DEFAULT_METALLIC: MetallicEffect = { type: "none", intensity: 80, applyToName: true, applyToButtons: true, applyToSections: true };
  const [metallicEffect, _setMetallicEffect] = useState<MetallicEffect>(currentOverrides.metallicEffect ?? DEFAULT_METALLIC);
  const [heroBackgroundId, _setHeroBackgroundId] = useState<string>(currentOverrides.heroBackgroundId ?? "");
  const [cardLayout, _setCardLayout] = useState<"classic" | "modern">(currentOverrides.cardLayout ?? "classic");

  // ── Undo / Redo history ──
  interface ThemeSnapshot { palette: CardPalette; fonts: CardFonts; tokens: CardStyleTokens; gradientBg: CardGradientBg; bgPattern: CardBgPattern; metallicEffect: MetallicEffect; heroBackgroundId: string }
  const historyRef = useRef<ThemeSnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const [historyLen, setHistoryLen] = useState(0);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const skipHistoryRef = useRef(false);

  const getSnapshot = useCallback((): ThemeSnapshot => ({ palette, fonts, tokens, gradientBg, bgPattern, metallicEffect, heroBackgroundId }), [palette, fonts, tokens, gradientBg, bgPattern, metallicEffect, heroBackgroundId]);

  const pushHistory = useCallback((snap: ThemeSnapshot) => {
    if (skipHistoryRef.current) return;
    const idx = historyIndexRef.current;
    // Trim any future states after current position
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(snap);
    // Cap at 50 entries
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    setHistoryLen(historyRef.current.length);
    setHistoryIdx(historyIndexRef.current);
  }, []);

  const applySnapshot = useCallback((snap: ThemeSnapshot) => {
    skipHistoryRef.current = true;
    _setPalette(snap.palette);
    _setFonts(snap.fonts);
    _setTokens(snap.tokens);
    _setGradientBg(snap.gradientBg);
    _setBgPattern(snap.bgPattern);
    _setMetallicEffect(snap.metallicEffect);
    _setHeroBackgroundId(snap.heroBackgroundId);
    // Allow next tick to re-enable history
    requestAnimationFrame(() => { skipHistoryRef.current = false; });
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    setHistoryIdx(historyIndexRef.current);
    applySnapshot(historyRef.current[historyIndexRef.current]);
  }, [applySnapshot]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    setHistoryIdx(historyIndexRef.current);
    applySnapshot(historyRef.current[historyIndexRef.current]);
  }, [applySnapshot]);

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < historyLen - 1;

  // Push history on state changes (debounced to avoid flooding on slider drags)
  const historyTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!open || skipHistoryRef.current) return;
    clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(() => {
      pushHistory(getSnapshot());
    }, 300);
    return () => clearTimeout(historyTimer.current);
  }, [palette, fonts, tokens, gradientBg, bgPattern, metallicEffect, heroBackgroundId, open, pushHistory, getSnapshot]);

  // Wrapped setters that go through normal state (history is pushed via effect)
  const setPalette = _setPalette;
  const setFonts = _setFonts;
  const setTokens = _setTokens;
  const setGradientBg = _setGradientBg;
  const setBgPattern = _setBgPattern;
  const setMetallicEffect = _setMetallicEffect;
  const setHeroBackgroundId = _setHeroBackgroundId;
  const setCardLayout = _setCardLayout;

  // Custom palettes
  const [customPalettes, setCustomPalettes] = useState<{ id: string; name: string; palette: CardPalette }[]>([]);
  const [savingPalette, setSavingPalette] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const fetchCustomPalettes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("custom_palettes")
      .select("id, name, palette")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setCustomPalettes(data.map(d => ({ id: d.id, name: d.name, palette: d.palette as unknown as CardPalette })));
  }, [user]);

  const handleSavePalette = useCallback(async () => {
    if (!user || !newPaletteName.trim()) return;
    setSavingPalette(true);
    const { error } = await supabase.from("custom_palettes").insert({
      user_id: user.id, name: newPaletteName.trim(), palette: palette as any,
    });
    setSavingPalette(false);
    if (error) { toast({ title: "Error saving palette", variant: "destructive" }); }
    else {
      toast({ title: `"${newPaletteName.trim()}" saved` });
      setNewPaletteName(""); setShowSaveInput(false); fetchCustomPalettes();
    }
  }, [user, newPaletteName, palette, toast, fetchCustomPalettes]);

  const handleDeletePalette = useCallback(async (id: string) => {
    await supabase.from("custom_palettes").delete().eq("id", id);
    fetchCustomPalettes();
  }, [fetchCustomPalettes]);

  useEffect(() => {
    const p = currentOverrides.palette ?? defaultPalette;
    const f = currentOverrides.fonts ?? defaultFonts;
    const t = currentOverrides.tokens ?? {};
    const g = currentOverrides.gradientBg ?? { enabled: false, color2: "#e0e7ff", direction: "to bottom right" };
    const b = currentOverrides.bgPattern ?? { type: "none", opacity: 0.08 };
    const m = currentOverrides.metallicEffect ?? DEFAULT_METALLIC;
    const h = currentOverrides.heroBackgroundId ?? "";
    _setPalette(p); _setFonts(f); _setTokens(t); _setGradientBg(g); _setBgPattern(b); _setMetallicEffect(m); _setHeroBackgroundId(h); _setCardLayout(currentOverrides.cardLayout ?? "classic");
    if (open) {
      historyRef.current = [{ palette: p, fonts: f, tokens: t, gradientBg: g, bgPattern: b, metallicEffect: m, heroBackgroundId: h }];
      historyIndexRef.current = 0;
      setHistoryLen(1);
      setHistoryIdx(0);
      fetchCustomPalettes();
    }
  }, [open]);

  // ── Live preview: push overrides on every change ──
  useEffect(() => {
    if (!open || !onPreview) return;
    onPreview({
      palette, fonts, tokens,
      gradientBg: gradientBg.enabled ? gradientBg : undefined,
      bgPattern: bgPattern.type !== "none" ? bgPattern : undefined,
      metallicEffect: metallicEffect.type !== "none" ? metallicEffect : undefined,
      heroBackgroundId: heroBackgroundId || undefined,
    });
  }, [palette, fonts, tokens, gradientBg, bgPattern, metallicEffect, heroBackgroundId, open, onPreview]);

  const handleColorChange = useCallback((key: keyof CardPalette, value: string) => {
    setPalette((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setPalette(defaultPalette); setFonts(defaultFonts); setTokens({});
    setGradientBg({ enabled: false, color2: "#e0e7ff", direction: "to bottom right" });
    setBgPattern({ type: "none", opacity: 0.08 });
    setMetallicEffect(DEFAULT_METALLIC);
    setHeroBackgroundId("");
  }, [defaultPalette, defaultFonts]);

  const handleSave = useCallback(() => {
    onSave({
      palette, fonts, tokens,
      gradientBg: gradientBg.enabled ? gradientBg : undefined,
      bgPattern: bgPattern.type !== "none" ? bgPattern : undefined,
      metallicEffect: metallicEffect.type !== "none" ? metallicEffect : undefined,
      heroBackgroundId: heroBackgroundId || undefined,
      cardLayout,
    });
    onOpenChange(false);
  }, [palette, fonts, tokens, gradientBg, bgPattern, metallicEffect, heroBackgroundId, cardLayout, onSave, onOpenChange]);

  const updateToken = useCallback(<K extends keyof CardStyleTokens>(key: K, value: CardStyleTokens[K]) => {
    setTokens((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateNestedToken = useCallback((group: "button" | "header" | "section" | "shadow" | "radius", field: string, value: any) => {
    setTokens((prev) => ({ ...prev, [group]: { ...(prev[group] as any ?? {}), [field]: value } }));
  }, []);

  // Resolved values
  const rb = {
    shape: tokens.button?.shape ?? (stylePackTokens?.button?.shape ?? "rounded"),
    style: tokens.button?.style ?? (stylePackTokens?.button?.style ?? "filled"),
    size: tokens.button?.size ?? (stylePackTokens?.button?.size ?? "lg"),
  };
  const rh = {
    layout: tokens.header?.layout ?? (stylePackTokens?.header?.layout ?? "classic"),
    avatarShape: tokens.header?.avatarShape ?? (stylePackTokens?.header?.avatarShape ?? "circle"),
  };
  const rs = {
    cardStyle: tokens.section?.cardStyle ?? (stylePackTokens?.section?.cardStyle ?? "solid"),
    divider: tokens.section?.divider ?? (stylePackTokens?.section?.divider ?? "none"),
    dividerWidth: tokens.section?.dividerWidth ?? (stylePackTokens?.section?.dividerWidth ?? 100),
    dividerColor: tokens.section?.dividerColor ?? (stylePackTokens?.section?.dividerColor ?? ""),
  };
  const rSpacing = tokens.spacingScale ?? (stylePackTokens?.spacingScale ?? "comfortable");
  const rShadow = tokens.shadow?.card ?? (stylePackTokens?.shadow?.card ?? "soft");
  const rRadius = tokens.radius?.card ?? (stylePackTokens?.radius?.card ?? 16);

  const COLOR_FIELDS: { key: keyof CardPalette; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "secondary", label: "Text" },
    { key: "background", label: "Background" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4">
          <SheetHeader className="space-y-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              Theme & Styling
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="colors" className="flex flex-col h-[calc(100%-130px)]">
          <div className="px-5 pt-3">
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="colors" className="text-xs gap-1">
                <Palette className="h-3 w-3" /> Colors
              </TabsTrigger>
              <TabsTrigger value="layout" className="text-xs gap-1">
                <Layers className="h-3 w-3" /> Layout
              </TabsTrigger>
              <TabsTrigger value="type" className="text-xs gap-1">
                <Type className="h-3 w-3" /> Type
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {/* ── Colors Tab ── */}
            <TabsContent value="colors" className="mt-3 space-y-4">
              {/* Palette Presets */}
              <div className="space-y-2">
                <SectionLabel>Presets</SectionLabel>
                {PALETTE_CATEGORIES.map((category) => {
                  const hasActive = category.palettes.some(
                    (p) => p.palette.primary === palette.primary && p.palette.accent === palette.accent
                  );
                  return (
                    <div key={category.label} className="space-y-1.5">
                      <button className="flex items-center gap-1.5 text-[11px] font-medium w-full text-left">
                        <span className={hasActive ? "text-primary" : "text-muted-foreground"}>
                          {category.icon}
                        </span>
                        <span className={hasActive ? "text-primary" : "text-muted-foreground"}>
                          {category.label}
                        </span>
                      </button>
                      <div className="grid grid-cols-4 gap-1.5">
                        {category.palettes.map((preset) => {
                          const isActive = preset.palette.primary === palette.primary && preset.palette.accent === palette.accent;
                          return (
                            <button
                              key={preset.name}
                              onClick={() => setPalette(preset.palette)}
                              className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                                isActive ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/40 hover:border-border hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex gap-px">
                                <div className="h-4 w-4 rounded-full border border-border/20" style={{ background: preset.palette.primary }} />
                                <div className="h-4 w-4 rounded-full border border-border/20" style={{ background: preset.palette.accent }} />
                              </div>
                              <span className="text-[9px] font-medium text-muted-foreground leading-none">{preset.name}</span>
                              {isActive && <Check className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Style Pack Palettes */}
              {stylePackPalettes && stylePackPalettes.length > 1 && (
                <div className="space-y-1.5">
                  <SectionLabel>Style Pack</SectionLabel>
                  <div className="flex gap-1.5 flex-wrap">
                    {stylePackPalettes.map((sp, i) => (
                      <button key={i} onClick={() => setPalette(sp)} className="flex gap-px p-1.5 rounded-lg border border-border/40 hover:border-primary/40 transition-all">
                        <div className="h-3.5 w-3.5 rounded-full" style={{ background: sp.primary }} />
                        <div className="h-3.5 w-3.5 rounded-full" style={{ background: sp.accent }} />
                        <div className="h-3.5 w-3.5 rounded-full" style={{ background: sp.background }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Palettes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <SectionLabel>Saved</SectionLabel>
                  <button
                    onClick={() => setShowSaveInput(!showSaveInput)}
                    className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" /> Save Current
                  </button>
                </div>
                {showSaveInput && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={newPaletteName}
                      onChange={(e) => setNewPaletteName(e.target.value)}
                      placeholder="Name…"
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleSavePalette()}
                      autoFocus
                    />
                    <Button size="sm" className="h-7 px-2 text-[10px]" onClick={handleSavePalette} disabled={savingPalette || !newPaletteName.trim()}>
                      <Save className="h-2.5 w-2.5 mr-1" /> Save
                    </Button>
                  </div>
                )}
                {customPalettes.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {customPalettes.map((cp) => {
                      const isActive = cp.palette.primary === palette.primary && cp.palette.accent === palette.accent && cp.palette.background === palette.background;
                      return (
                        <div key={cp.id} className="relative group">
                          <button
                            onClick={() => setPalette(cp.palette)}
                            className={`w-full flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                              isActive ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/40 hover:border-border hover:bg-muted/30"
                            }`}
                          >
                            <div className="flex gap-px">
                              <div className="h-4 w-4 rounded-full border border-border/20" style={{ background: cp.palette.primary }} />
                              <div className="h-4 w-4 rounded-full border border-border/20" style={{ background: cp.palette.accent }} />
                            </div>
                            <span className="text-[9px] font-medium text-muted-foreground truncate w-full text-center">{cp.name}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePalette(cp.id); }}
                            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-2 w-2" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center py-1.5">No saved palettes</p>
                )}
              </div>

              {/* Custom Colors */}
              <div className="space-y-1.5">
                <SectionLabel>Custom Colors</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <ColorField key={key} label={label} value={palette[key]} onChange={(v) => handleColorChange(key, v)} />
                  ))}
                </div>
              </div>

              {/* Gradient */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <SectionLabel>Gradient Background</SectionLabel>
                  <Switch checked={gradientBg.enabled} onCheckedChange={(v) => setGradientBg(prev => ({ ...prev, enabled: v }))} className="scale-75" />
                </div>
                {gradientBg.enabled && (
                  <div className="space-y-2 pl-1">
                    <ColorField label="Second Color" value={gradientBg.color2} onChange={(v) => setGradientBg(prev => ({ ...prev, color2: v }))} />
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Direction</Label>
                      <OptionGrid
                        cols={4}
                        options={[
                          { value: "to bottom", label: "↓" },
                          { value: "to right", label: "→" },
                          { value: "to bottom right", label: "↘" },
                          { value: "to top right", label: "↗" },
                        ]}
                        value={gradientBg.direction}
                        onChange={(v) => setGradientBg(prev => ({ ...prev, direction: v as any }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pattern */}
              <div className="space-y-1.5">
                <SectionLabel>Pattern Overlay</SectionLabel>
                <OptionGrid
                  cols={5}
                  options={[
                    { value: "none", label: "None" },
                    { value: "dots", label: "Dots" },
                    { value: "lines", label: "Lines" },
                    { value: "grid", label: "Grid" },
                    { value: "noise", label: "Noise" },
                  ]}
                  value={bgPattern.type}
                  onChange={(v) => setBgPattern(prev => ({ ...prev, type: v as BgPatternType }))}
                />
                {bgPattern.type !== "none" && (
                  <div className="space-y-2 pl-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Opacity — {Math.round(bgPattern.opacity * 100)}%</Label>
                      <Slider value={[bgPattern.opacity * 100]} onValueChange={([v]) => setBgPattern(prev => ({ ...prev, opacity: v / 100 }))} min={2} max={25} step={1} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Scale — {bgPattern.scale ?? 20}px</Label>
                      <Slider value={[bgPattern.scale ?? 20]} onValueChange={([v]) => setBgPattern(prev => ({ ...prev, scale: v }))} min={8} max={80} step={2} />
                    </div>
                    <OptionGrid
                      cols={2}
                      options={[
                        { value: "full", label: "Full card" },
                        { value: "gaps", label: "Background only" },
                      ]}
                      value={bgPattern.coverage ?? "full"}
                      onChange={(v) => setBgPattern(prev => ({ ...prev, coverage: v as BgPatternCoverage }))}
                    />
                  </div>
                )}
              </div>

              {/* Hero Background */}
              <div className="space-y-1.5">
                <SectionLabel>Hero Background</SectionLabel>
                <p className="text-[10px] text-muted-foreground">Gradient shown when no cover image is uploaded</p>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => setHeroBackgroundId("")}
                    className={`h-10 rounded-md border-2 transition-all flex items-center justify-center text-[9px] font-medium ${
                      !heroBackgroundId ? "border-primary ring-1 ring-primary/30" : "border-border/50 hover:border-border"
                    }`}
                    style={{ background: `linear-gradient(135deg, ${palette.primary}30, ${palette.accent || palette.primary}20)` }}
                  >
                    Auto
                  </button>
                  {HERO_BACKGROUNDS.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => setHeroBackgroundId(bg.id)}
                      title={bg.label}
                      className={`h-10 rounded-md border-2 transition-all ${
                        heroBackgroundId === bg.id ? "border-primary ring-1 ring-primary/30" : "border-border/50 hover:border-border"
                      }`}
                      style={{ background: bg.gradient }}
                    />
                  ))}
                </div>
              </div>


              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <SectionLabel>Metallic Effect</SectionLabel>
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                </div>
                <OptionGrid
                  cols={3}
                  options={[
                    { value: "none", label: "None" },
                    { value: "gold", label: "Gold" },
                    { value: "silver", label: "Silver" },
                    { value: "rose-gold", label: "Rose" },
                    { value: "bronze", label: "Bronze" },
                    { value: "platinum", label: "Platinum" },
                  ]}
                  value={metallicEffect.type}
                  onChange={(v) => setMetallicEffect(prev => ({ ...prev, type: v as MetallicType }))}
                />
                {metallicEffect.type !== "none" && (
                  <div className="space-y-2 pl-1 pt-1">
                    {/* Metallic preview swatch */}
                    <div className="h-6 rounded-md" style={{ background: METALLIC_GRADIENTS[metallicEffect.type as Exclude<MetallicType, "none">] }} />
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Intensity — {metallicEffect.intensity}%</Label>
                      <Slider value={[metallicEffect.intensity]} onValueChange={([v]) => setMetallicEffect(prev => ({ ...prev, intensity: v }))} min={20} max={100} step={5} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Apply to</Label>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Name text</span>
                        <Switch checked={metallicEffect.applyToName} onCheckedChange={(v) => setMetallicEffect(prev => ({ ...prev, applyToName: v }))} className="scale-75" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Buttons</span>
                        <Switch checked={metallicEffect.applyToButtons} onCheckedChange={(v) => setMetallicEffect(prev => ({ ...prev, applyToButtons: v }))} className="scale-75" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Section backgrounds</span>
                        <Switch checked={metallicEffect.applyToSections} onCheckedChange={(v) => setMetallicEffect(prev => ({ ...prev, applyToSections: v }))} className="scale-75" />
                      </div>
                    </div>
                  </div>
                )}
              </div>


              <div className="space-y-1.5">
                <SectionLabel>Preview</SectionLabel>
                <div
                  className="rounded-lg p-3 border border-border/40 relative overflow-hidden"
                  style={{
                    background: gradientBg.enabled
                      ? `linear-gradient(${gradientBg.direction}, ${palette.background}, ${gradientBg.color2})`
                      : palette.background,
                  }}
                >
                  {bgPattern.type !== "none" && (
                    <div className="absolute inset-0 pointer-events-none" style={{
                      opacity: bgPattern.opacity,
                      backgroundImage: getPatternSvg(bgPattern.type, bgPattern.color || palette.secondary),
                      backgroundSize: bgPattern.type === "noise" ? "200px 200px" : `${bgPattern.scale ?? 20}px ${bgPattern.scale ?? 20}px`,
                    }} />
                  )}
                  <div className="relative z-[1]">
                    <div className="h-2.5 w-16 rounded-full mb-1.5" style={{ background: palette.primary }} />
                    <div className="h-2 w-24 rounded-full mb-2.5" style={{ background: palette.secondary, opacity: 0.4 }} />
                    <div className="flex gap-1.5">
                      <div className="h-7 flex-1 rounded-md flex items-center justify-center text-[10px] font-semibold" style={{ background: palette.primary, color: palette.background }}>Button</div>
                      <div className="h-7 flex-1 rounded-md flex items-center justify-center text-[10px] font-semibold" style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`, color: "#fff" }}>Accent</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Layout Tab ── */}
            <TabsContent value="layout" className="mt-3 space-y-4">
              <div className="space-y-1.5">
                <SectionLabel>Header Layout</SectionLabel>
                <OptionGrid
                  options={[
                    { value: "classic", label: "Classic" },
                    { value: "cover", label: "Cover" },
                    { value: "hero", label: "Hero" },
                  ]}
                  value={rh.layout}
                  onChange={(v) => updateNestedToken("header", "layout", v)}
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Avatar Shape</SectionLabel>
                <OptionGrid
                  options={[
                    { value: "circle", label: "Circle" },
                    { value: "rounded", label: "Rounded" },
                    { value: "square", label: "Square" },
                  ]}
                  value={rh.avatarShape}
                  onChange={(v) => updateNestedToken("header", "avatarShape", v)}
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Button Style</SectionLabel>
                <OptionGrid
                  options={[
                    { value: "filled", label: "Filled" },
                    { value: "outline", label: "Outline" },
                    { value: "gradient", label: "Gradient" },
                  ]}
                  value={rb.style}
                  onChange={(v) => updateNestedToken("button", "style", v)}
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Button Shape</SectionLabel>
                <OptionGrid
                  cols={2}
                  options={[
                    { value: "rounded", label: "Rounded" },
                    { value: "pill", label: "Pill" },
                  ]}
                  value={rb.shape}
                  onChange={(v) => updateNestedToken("button", "shape", v)}
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Button Size</SectionLabel>
                <OptionGrid
                  options={[
                    { value: "sm", label: "Small" },
                    { value: "md", label: "Medium" },
                    { value: "lg", label: "Large" },
                  ]}
                  value={rb.size}
                  onChange={(v) => updateNestedToken("button", "size", v)}
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Section Style</SectionLabel>
                <OptionGrid
                  cols={3}
                  options={[
                    { value: "solid", label: "Solid" },
                    { value: "frosted", label: "Frosted" },
                    { value: "elevated", label: "Elevated" },
                    { value: "soft", label: "Soft" },
                    { value: "glow", label: "Glow" },
                    { value: "glass", label: "Glass" },
                  ]}
                  value={rs.cardStyle}
                  onChange={(v) => updateNestedToken("section", "cardStyle", v)}
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Section Divider</SectionLabel>
                <OptionGrid
                  cols={2}
                  options={[
                    { value: "none", label: "None" },
                    { value: "hairline", label: "Hairline" },
                  ]}
                  value={rs.divider}
                  onChange={(v) => updateNestedToken("section", "divider", v)}
                />
                {rs.divider === "hairline" && (
                  <div className="space-y-2 pl-1 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Length — {rs.dividerWidth}%</Label>
                      <Slider min={20} max={100} step={5} value={[rs.dividerWidth]} onValueChange={([v]) => updateNestedToken("section", "dividerWidth", v)} />
                    </div>
                    <ColorField
                      label="Color"
                      value={rs.dividerColor || palette.secondary}
                      onChange={(v) => updateNestedToken("section", "dividerColor", v)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Spacing</SectionLabel>
                <OptionGrid
                  options={[
                    { value: "compact", label: "Compact" },
                    { value: "comfortable", label: "Comfort" },
                    { value: "airy", label: "Airy" },
                  ]}
                  value={rSpacing}
                  onChange={(v) => updateToken("spacingScale", v as any)}
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Card Shadow</SectionLabel>
                <OptionGrid
                  options={[
                    { value: "none", label: "None" },
                    { value: "subtle", label: "Subtle" },
                    { value: "soft", label: "Soft" },
                  ]}
                  value={rShadow}
                  onChange={(v) => updateNestedToken("shadow", "card", v)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <SectionLabel>Corner Radius</SectionLabel>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{rRadius}px</span>
                </div>
                <Slider value={[rRadius]} onValueChange={([v]) => updateNestedToken("radius", "card", v)} min={0} max={32} step={2} />
              </div>
            </TabsContent>

            {/* ── Typography Tab ── */}
            <TabsContent value="type" className="mt-3 space-y-5 max-h-[65vh] overflow-y-auto pr-1">

              {/* ── Global Fonts ── */}
              <div className="space-y-3">
                <SectionLabel>Global Fonts</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Heading</label>
                    <Select value={fonts.primary} onValueChange={(v) => setFonts((f) => ({ ...f, primary: v }))}>
                      <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {FONT_CATEGORIES.map((cat) => (
                          <div key={cat.label}>
                            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">{cat.label}</div>
                            {cat.fonts.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: `'${font}', sans-serif` }} className="text-[11px]">{font}</span>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Body</label>
                    <Select value={fonts.secondary} onValueChange={(v) => setFonts((f) => ({ ...f, secondary: v }))}>
                      <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {FONT_CATEGORIES.map((cat) => (
                          <div key={cat.label}>
                            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">{cat.label}</div>
                            {cat.fonts.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: `'${font}', sans-serif` }} className="text-[11px]">{font}</span>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* ── Name / Title ── */}
              <div className="space-y-2">
                <SectionLabel>Name / Title</SectionLabel>
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Font Override</label>
                  <Select value={fonts.nameFont || "__inherit__"} onValueChange={(v) => setFonts((f) => ({ ...f, nameFont: v === "__inherit__" ? undefined : v }))}>
                    <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Inherit from heading" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="__inherit__"><span className="text-muted-foreground text-[11px]">Inherit from heading</span></SelectItem>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: `'${font}', sans-serif` }} className="text-[11px]">{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Size</label>
                    <div className="flex items-center gap-1">
                      <Slider value={[fonts.nameFontSize ?? 18]} onValueChange={([v]) => setFonts((f) => ({ ...f, nameFontSize: v }))} min={12} max={48} step={1} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">{fonts.nameFontSize ?? 18}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Weight</label>
                    <Select value={String(fonts.nameFontWeight ?? 700)} onValueChange={(v) => setFonts((f) => ({ ...f, nameFontWeight: Number(v) }))}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={String(w.value)}><span className="text-[10px]">{w.label}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Case</label>
                    <Select value={fonts.nameTransform ?? "none"} onValueChange={(v) => setFonts((f) => ({ ...f, nameTransform: v as any }))}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TEXT_TRANSFORM_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}><span className="text-[10px]">{o.label}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Letter Spacing</label>
                    <span className="text-[9px] text-muted-foreground tabular-nums">{fonts.nameLetterSpacing ?? 0}px</span>
                  </div>
                  <Slider value={[fonts.nameLetterSpacing ?? 0]} onValueChange={([v]) => setFonts((f) => ({ ...f, nameLetterSpacing: v }))} min={-2} max={12} step={0.5} />
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* ── Tagline / Subtitle ── */}
              <div className="space-y-2">
                <SectionLabel>Tagline / Subtitle</SectionLabel>
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Font Override</label>
                  <Select value={fonts.taglineFont || "__inherit__"} onValueChange={(v) => setFonts((f) => ({ ...f, taglineFont: v === "__inherit__" ? undefined : v }))}>
                    <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Inherit from body" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="__inherit__"><span className="text-muted-foreground text-[11px]">Inherit from body</span></SelectItem>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: `'${font}', sans-serif` }} className="text-[11px]">{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Size</label>
                    <div className="flex items-center gap-1">
                      <Slider value={[fonts.taglineFontSize ?? 14]} onValueChange={([v]) => setFonts((f) => ({ ...f, taglineFontSize: v }))} min={10} max={32} step={1} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">{fonts.taglineFontSize ?? 14}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Weight</label>
                    <Select value={String(fonts.taglineFontWeight ?? 400)} onValueChange={(v) => setFonts((f) => ({ ...f, taglineFontWeight: Number(v) }))}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={String(w.value)}><span className="text-[10px]">{w.label}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Spacing</label>
                    <div className="flex items-center gap-1">
                      <Slider value={[fonts.taglineLetterSpacing ?? 0]} onValueChange={([v]) => setFonts((f) => ({ ...f, taglineLetterSpacing: v }))} min={-1} max={8} step={0.5} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">{fonts.taglineLetterSpacing ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* ── Section Headings ── */}
              <div className="space-y-2">
                <SectionLabel>Section Headings</SectionLabel>
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Font Override</label>
                  <Select value={fonts.sectionHeadingFont || "__inherit__"} onValueChange={(v) => setFonts((f) => ({ ...f, sectionHeadingFont: v === "__inherit__" ? undefined : v }))}>
                    <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Inherit from heading" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="__inherit__"><span className="text-muted-foreground text-[11px]">Inherit from heading</span></SelectItem>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: `'${font}', sans-serif` }} className="text-[11px]">{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Size</label>
                    <div className="flex items-center gap-1">
                      <Slider value={[fonts.sectionHeadingFontSize ?? 16]} onValueChange={([v]) => setFonts((f) => ({ ...f, sectionHeadingFontSize: v }))} min={12} max={32} step={1} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">{fonts.sectionHeadingFontSize ?? 16}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Weight</label>
                    <Select value={String(fonts.sectionHeadingFontWeight ?? 600)} onValueChange={(v) => setFonts((f) => ({ ...f, sectionHeadingFontWeight: Number(v) }))}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={String(w.value)}><span className="text-[10px]">{w.label}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Case</label>
                    <Select value={fonts.sectionHeadingTransform ?? "none"} onValueChange={(v) => setFonts((f) => ({ ...f, sectionHeadingTransform: v as any }))}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TEXT_TRANSFORM_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}><span className="text-[10px]">{o.label}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* ── Body Text ── */}
              <div className="space-y-2">
                <SectionLabel>Body Text</SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Size</label>
                    <div className="flex items-center gap-1">
                      <Slider value={[fonts.bodyFontSize ?? 14]} onValueChange={([v]) => setFonts((f) => ({ ...f, bodyFontSize: v }))} min={10} max={22} step={1} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">{fonts.bodyFontSize ?? 14}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Weight</label>
                    <Select value={String(fonts.bodyFontWeight ?? 400)} onValueChange={(v) => setFonts((f) => ({ ...f, bodyFontWeight: Number(v) }))}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={String(w.value)}><span className="text-[10px]">{w.label}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Line Height</label>
                    <div className="flex items-center gap-1">
                      <Slider value={[fonts.bodyLineHeight ?? 1.6]} onValueChange={([v]) => setFonts((f) => ({ ...f, bodyLineHeight: v }))} min={1} max={2.5} step={0.1} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">{(fonts.bodyLineHeight ?? 1.6).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* ── Buttons ── */}
              <div className="space-y-2">
                <SectionLabel>Buttons</SectionLabel>
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Font Override</label>
                  <Select value={fonts.buttonFont || "__inherit__"} onValueChange={(v) => setFonts((f) => ({ ...f, buttonFont: v === "__inherit__" ? undefined : v }))}>
                    <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Inherit from body" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="__inherit__"><span className="text-muted-foreground text-[11px]">Inherit from body</span></SelectItem>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: `'${font}', sans-serif` }} className="text-[11px]">{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Size</label>
                    <div className="flex items-center gap-1">
                      <Slider value={[fonts.buttonFontSize ?? 14]} onValueChange={([v]) => setFonts((f) => ({ ...f, buttonFontSize: v }))} min={10} max={22} step={1} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">{fonts.buttonFontSize ?? 14}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Weight</label>
                    <Select value={String(fonts.buttonFontWeight ?? 600)} onValueChange={(v) => setFonts((f) => ({ ...f, buttonFontWeight: Number(v) }))}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={String(w.value)}><span className="text-[10px]">{w.label}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* Font Preview */}
              <div className="rounded-lg border border-border/40 p-4 space-y-2 bg-muted/20">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">Live Preview</p>
                <p style={{
                  fontFamily: `'${fonts.nameFont || fonts.primary}', sans-serif`,
                  fontWeight: fonts.nameFontWeight ?? 700,
                  fontSize: fonts.nameFontSize ?? 18,
                  letterSpacing: fonts.nameLetterSpacing ? `${fonts.nameLetterSpacing}px` : undefined,
                  textTransform: (fonts.nameTransform ?? "none") as any,
                }}>
                  Your Business Name
                </p>
                <p style={{
                  fontFamily: `'${fonts.taglineFont || fonts.secondary}', sans-serif`,
                  fontWeight: fonts.taglineFontWeight ?? 400,
                  fontSize: fonts.taglineFontSize ?? 14,
                  letterSpacing: fonts.taglineLetterSpacing ? `${fonts.taglineLetterSpacing}px` : undefined,
                  color: "var(--muted-foreground)",
                }}>
                  Professional tagline goes here
                </p>
                <p style={{
                  fontFamily: `'${fonts.sectionHeadingFont || fonts.primary}', sans-serif`,
                  fontWeight: fonts.sectionHeadingFontWeight ?? 600,
                  fontSize: fonts.sectionHeadingFontSize ?? 16,
                  textTransform: (fonts.sectionHeadingTransform ?? "none") as any,
                  marginTop: 8,
                }}>
                  Section Heading
                </p>
                <p style={{
                  fontFamily: `'${fonts.secondary}', sans-serif`,
                  fontWeight: fonts.bodyFontWeight ?? 400,
                  fontSize: fonts.bodyFontSize ?? 14,
                  lineHeight: fonts.bodyLineHeight ?? 1.6,
                  color: "var(--muted-foreground)",
                }}>
                  Body text preview — The quick brown fox jumps over the lazy dog.
                </p>
                <div style={{
                  display: "inline-block",
                  padding: "6px 16px",
                  borderRadius: 8,
                  background: "var(--primary)",
                  color: "white",
                  fontFamily: `'${fonts.buttonFont || fonts.secondary}', sans-serif`,
                  fontWeight: fonts.buttonFontWeight ?? 600,
                  fontSize: fonts.buttonFontSize ?? 14,
                  marginTop: 4,
                }}>
                  Button Text
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Sticky Actions */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-5 py-3 flex items-center gap-2">
          <div className="flex items-center gap-1 mr-auto">
            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={!canUndo} className="h-8 w-8 p-0" title="Undo">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRedo} disabled={!canRedo} className="h-8 w-8 p-0" title="Redo">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-9">
            <RotateCcw className="h-3 w-3 mr-1.5" /> Reset
          </Button>
          <Button size="sm" className="flex-1 h-9" onClick={handleSave}>
            <Check className="h-3 w-3 mr-1.5" /> Apply Theme
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
