/**
 * Dynamic Hero Background System
 * Maps professions to visually appropriate hero backgrounds
 * with complementary gradient overlays and color palettes.
 */

// ── Hero background theme presets ──

export interface HeroBackground {
  id: string;
  label: string;
  /** CSS gradient or solid color for the hero area */
  gradient: string;
  /** Semi-transparent overlay gradient to ensure text readability */
  overlay: string;
  /** Suggested palette to complement this background */
  palette?: { primary: string; accent: string };
  /** Category for grouping in picker */
  category: "nature" | "urban" | "creative" | "professional" | "warm" | "cool" | "dark" | "custom";
}

export const HERO_BACKGROUNDS: HeroBackground[] = [
  // Nature / Landscaping
  {
    id: "forest-green",
    label: "Forest Green",
    gradient: "linear-gradient(135deg, #134e2b 0%, #0f7b3f 40%, #2d6a4f 70%, #1b4332 100%)",
    overlay: "linear-gradient(180deg, rgba(19,78,43,0.3) 0%, rgba(27,67,50,0.6) 100%)",
    palette: { primary: "#2d6a4f", accent: "#52b788" },
    category: "nature",
  },
  {
    id: "garden-dawn",
    label: "Garden Dawn",
    gradient: "linear-gradient(135deg, #606c38 0%, #283618 30%, #588157 60%, #a3b18a 100%)",
    overlay: "linear-gradient(180deg, rgba(40,54,24,0.25) 0%, rgba(96,108,56,0.5) 100%)",
    palette: { primary: "#606c38", accent: "#a3b18a" },
    category: "nature",
  },
  {
    id: "meadow",
    label: "Meadow",
    gradient: "linear-gradient(135deg, #4a7c59 0%, #6bab6e 50%, #a3d9a5 100%)",
    overlay: "linear-gradient(180deg, rgba(74,124,89,0.2) 0%, rgba(74,124,89,0.55) 100%)",
    palette: { primary: "#4a7c59", accent: "#6bab6e" },
    category: "nature",
  },

  // Urban / Real Estate
  {
    id: "navy-skyline",
    label: "Navy Skyline",
    gradient: "linear-gradient(135deg, #0a1628 0%, #1a2744 40%, #1e3a5f 70%, #0d2137 100%)",
    overlay: "linear-gradient(180deg, rgba(10,22,40,0.3) 0%, rgba(30,58,95,0.5) 100%)",
    palette: { primary: "#1e3a5f", accent: "#4895ef" },
    category: "urban",
  },
  {
    id: "city-dusk",
    label: "City Dusk",
    gradient: "linear-gradient(135deg, #2b2d42 0%, #3d405b 40%, #8d99ae 70%, #edf2f4 100%)",
    overlay: "linear-gradient(180deg, rgba(43,45,66,0.3) 0%, rgba(61,64,91,0.55) 100%)",
    palette: { primary: "#2b2d42", accent: "#8d99ae" },
    category: "urban",
  },
  {
    id: "steel-blue",
    label: "Steel Blue",
    gradient: "linear-gradient(135deg, #1b263b 0%, #415a77 50%, #778da9 100%)",
    overlay: "linear-gradient(180deg, rgba(27,38,59,0.3) 0%, rgba(65,90,119,0.5) 100%)",
    palette: { primary: "#415a77", accent: "#778da9" },
    category: "urban",
  },

  // Creative / Photography
  {
    id: "dark-elegant",
    label: "Dark Elegant",
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)",
    overlay: "linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(26,26,46,0.5) 100%)",
    palette: { primary: "#e2e2e2", accent: "#0f3460" },
    category: "dark",
  },
  {
    id: "noir",
    label: "Noir",
    gradient: "linear-gradient(135deg, #111111 0%, #1c1c1c 50%, #2a2a2a 100%)",
    overlay: "linear-gradient(180deg, rgba(17,17,17,0.15) 0%, rgba(17,17,17,0.45) 100%)",
    palette: { primary: "#f5f5f5", accent: "#888888" },
    category: "dark",
  },
  {
    id: "moody-purple",
    label: "Moody Purple",
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b69 40%, #5b21b6 70%, #7c3aed 100%)",
    overlay: "linear-gradient(180deg, rgba(26,10,46,0.25) 0%, rgba(45,27,105,0.5) 100%)",
    palette: { primary: "#7c3aed", accent: "#a78bfa" },
    category: "creative",
  },

  // Warm / Beauty / Wellness
  {
    id: "soft-blush",
    label: "Soft Blush",
    gradient: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f9a8d4 70%, #ec4899 100%)",
    overlay: "linear-gradient(180deg, rgba(253,242,248,0.2) 0%, rgba(252,231,243,0.45) 100%)",
    palette: { primary: "#be185d", accent: "#f9a8d4" },
    category: "warm",
  },
  {
    id: "warm-clay",
    label: "Warm Clay",
    gradient: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 70%, #fbbf24 100%)",
    overlay: "linear-gradient(180deg, rgba(146,64,14,0.3) 0%, rgba(180,83,9,0.5) 100%)",
    palette: { primary: "#92400e", accent: "#d97706" },
    category: "warm",
  },
  {
    id: "champagne",
    label: "Champagne",
    gradient: "linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 30%, #d4c4a8 60%, #c2a96e 100%)",
    overlay: "linear-gradient(180deg, rgba(245,240,232,0.15) 0%, rgba(212,196,168,0.4) 100%)",
    palette: { primary: "#6b5b3e", accent: "#c2a96e" },
    category: "warm",
  },
  {
    id: "spa-zen",
    label: "Spa Zen",
    gradient: "linear-gradient(135deg, #f0ebe3 0%, #e6ddd4 30%, #c9b99a 60%, #a68a64 100%)",
    overlay: "linear-gradient(180deg, rgba(240,235,227,0.15) 0%, rgba(201,185,154,0.35) 100%)",
    palette: { primary: "#6b5b43", accent: "#a68a64" },
    category: "warm",
  },

  // Cool / Professional
  {
    id: "arctic",
    label: "Arctic",
    gradient: "linear-gradient(135deg, #caf0f8 0%, #90e0ef 30%, #48cae4 60%, #0096c7 100%)",
    overlay: "linear-gradient(180deg, rgba(202,240,248,0.15) 0%, rgba(72,202,228,0.4) 100%)",
    palette: { primary: "#0077b6", accent: "#48cae4" },
    category: "cool",
  },
  {
    id: "ocean-gradient",
    label: "Ocean",
    gradient: "linear-gradient(135deg, #023e8a 0%, #0077b6 40%, #0096c7 70%, #48cae4 100%)",
    overlay: "linear-gradient(180deg, rgba(2,62,138,0.3) 0%, rgba(0,119,182,0.5) 100%)",
    palette: { primary: "#0077b6", accent: "#48cae4" },
    category: "cool",
  },

  // Professional / Trades
  {
    id: "workshop",
    label: "Workshop",
    gradient: "linear-gradient(135deg, #292524 0%, #44403c 40%, #78716c 70%, #a8a29e 100%)",
    overlay: "linear-gradient(180deg, rgba(41,37,36,0.3) 0%, rgba(68,64,60,0.5) 100%)",
    palette: { primary: "#d6d3d1", accent: "#78716c" },
    category: "professional",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #264f78 40%, #3c6e9e 70%, #4a90d9 100%)",
    overlay: "linear-gradient(180deg, rgba(30,58,95,0.3) 0%, rgba(38,79,120,0.5) 100%)",
    palette: { primary: "#e0e7ff", accent: "#4a90d9" },
    category: "professional",
  },
  {
    id: "concrete",
    label: "Concrete",
    gradient: "linear-gradient(135deg, #374151 0%, #4b5563 40%, #6b7280 70%, #9ca3af 100%)",
    overlay: "linear-gradient(180deg, rgba(55,65,81,0.25) 0%, rgba(75,85,99,0.5) 100%)",
    palette: { primary: "#f3f4f6", accent: "#6b7280" },
    category: "professional",
  },
  {
    id: "ember",
    label: "Ember",
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #dc2626 70%, #f87171 100%)",
    overlay: "linear-gradient(180deg, rgba(127,29,29,0.3) 0%, rgba(153,27,27,0.5) 100%)",
    palette: { primary: "#fee2e2", accent: "#dc2626" },
    category: "professional",
  },
];

// ── Profession → hero background mapping ──

const PROFESSION_HERO_MAP: Record<string, string> = {
  // Landscaping / Outdoors
  landscaper: "forest-green",
  gardener: "garden-dawn",
  "lawn care": "meadow",
  arborist: "forest-green",
  "pool service": "arctic",

  // Real Estate / Sales
  realtor: "navy-skyline",
  "real estate": "navy-skyline",
  "property manager": "city-dusk",
  "insurance agent": "steel-blue",
  "financial advisor": "navy-skyline",
  consultant: "steel-blue",
  broker: "city-dusk",

  // Photography / Creative
  photographer: "dark-elegant",
  videographer: "noir",
  designer: "moody-purple",
  artist: "moody-purple",
  dj: "noir",
  musician: "dark-elegant",

  // Beauty / Wellness
  barber: "workshop",
  stylist: "soft-blush",
  salon: "champagne",
  esthetician: "spa-zen",
  "nail tech": "soft-blush",
  "makeup artist": "champagne",
  "massage therapist": "spa-zen",
  "personal trainer": "concrete",
  "yoga instructor": "spa-zen",

  // Trades / Construction
  contractor: "blueprint",
  electrician: "blueprint",
  plumber: "concrete",
  hvac: "concrete",
  roofer: "workshop",
  painter: "warm-clay",
  handyman: "workshop",
  carpenter: "workshop",
  welder: "ember",
  mechanic: "concrete",
  "pressure washer": "arctic",

  // Food / Events
  caterer: "champagne",
  chef: "warm-clay",
  baker: "champagne",
  florist: "garden-dawn",
  "event planner": "soft-blush",
  "wedding planner": "champagne",
};

/**
 * Get the best hero background for a given profession name.
 * Performs fuzzy matching against known profession keywords.
 */
export function getHeroBackgroundForProfession(professionName?: string): HeroBackground {
  const fallback = HERO_BACKGROUNDS.find(b => b.id === "ocean-gradient")!;
  if (!professionName) return fallback;

  const lower = professionName.toLowerCase();

  // Direct match
  if (PROFESSION_HERO_MAP[lower]) {
    return HERO_BACKGROUNDS.find(b => b.id === PROFESSION_HERO_MAP[lower]) ?? fallback;
  }

  // Fuzzy keyword match
  for (const [keyword, bgId] of Object.entries(PROFESSION_HERO_MAP)) {
    if (lower.includes(keyword) || keyword.includes(lower)) {
      return HERO_BACKGROUNDS.find(b => b.id === bgId) ?? fallback;
    }
  }

  // Category-based fallback
  if (["sales", "advising", "finance", "legal"].some(k => lower.includes(k))) {
    return HERO_BACKGROUNDS.find(b => b.id === "navy-skyline")!;
  }
  if (["beauty", "spa", "wellness", "health"].some(k => lower.includes(k))) {
    return HERO_BACKGROUNDS.find(b => b.id === "spa-zen")!;
  }
  if (["trade", "construction", "repair"].some(k => lower.includes(k))) {
    return HERO_BACKGROUNDS.find(b => b.id === "workshop")!;
  }
  if (["creative", "art", "media", "design"].some(k => lower.includes(k))) {
    return HERO_BACKGROUNDS.find(b => b.id === "moody-purple")!;
  }

  return fallback;
}

/**
 * Get a hero background by its ID.
 */
export function getHeroBackgroundById(id: string): HeroBackground | undefined {
  return HERO_BACKGROUNDS.find(b => b.id === id);
}

/**
 * Get hero backgrounds grouped by category for the picker UI.
 */
export function getHeroBackgroundsByCategory(): Record<string, HeroBackground[]> {
  const groups: Record<string, HeroBackground[]> = {};
  for (const bg of HERO_BACKGROUNDS) {
    if (!groups[bg.category]) groups[bg.category] = [];
    groups[bg.category].push(bg);
  }
  return groups;
}
