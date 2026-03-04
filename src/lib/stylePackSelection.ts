/**
 * Style selection rules: maps (style + categoryKey) → preferred style pack keys.
 * Falls back to first pack matching the chosen style.
 */

const SELECTION_RULES: Record<string, string[]> = {
  "Modern|sales_advising": ["modern_glass", "bold_hero", "neutral_pro"],
  "Modern|home_trade": ["modern_minimal", "bold_hero", "neutral_pro"],
  "Modern|creative_media": ["modern_gradient", "modern_glass", "bold_neon"],
  "Modern|legal_finance": ["modern_glass", "neutral_pro"],
  "Modern|education_services": ["modern_glass", "neutral_pro"],
  "Modern|health_wellness": ["modern_glass", "neutral_pro"],
  "Modern|beauty_personal_care": ["modern_gradient", "modern_glass"],
  "Modern|automotive_services": ["modern_minimal", "neutral_pro"],
  "Modern|food_events": ["modern_gradient", "modern_glass"],
  "Modern|pet_other": ["modern_minimal", "neutral_pro"],
  "Elegant|legal_finance": ["elegant_editorial", "neutral_pro"],
  "Elegant|beauty_personal_care": ["elegant_luxe", "elegant_soft"],
  "Elegant|health_wellness": ["elegant_soft", "elegant_editorial"],
  "Elegant|sales_advising": ["elegant_editorial", "elegant_luxe"],
  "Elegant|education_services": ["elegant_editorial", "elegant_soft"],
  "Elegant|food_events": ["elegant_luxe", "elegant_soft"],
  "Elegant|home_trade": ["elegant_editorial", "neutral_pro"],
  "Elegant|pet_other": ["elegant_soft"],
  "Elegant|automotive_services": ["elegant_editorial"],
  "Elegant|creative_media": ["elegant_luxe", "elegant_editorial"],
  "Bold|automotive_services": ["bold_contrast", "bold_hero"],
  "Bold|creative_media": ["bold_neon", "bold_contrast"],
  "Bold|home_trade": ["bold_contrast", "bold_hero"],
  "Bold|sales_advising": ["bold_hero", "bold_contrast"],
  "Bold|food_events": ["bold_neon", "bold_hero"],
  "Bold|beauty_personal_care": ["bold_neon", "bold_contrast"],
  "Bold|health_wellness": ["bold_hero", "bold_contrast"],
  "Bold|legal_finance": ["bold_hero", "bold_contrast"],
  "Bold|education_services": ["bold_hero", "bold_contrast"],
  "Bold|pet_other": ["bold_contrast", "bold_hero"],
};

// Fallback: first pack per style
const STYLE_FALLBACKS: Record<string, string> = {
  Modern: "modern_glass",
  Elegant: "elegant_editorial",
  Bold: "bold_contrast",
};

export interface StylePack {
  id: string;
  key: string;
  name: string;
  style: string;
  recommended_for_categories: string[];
  theme_tokens: Record<string, any>;
  default_palettes: Array<{ primary: string; secondary: string; accent: string; background: string }>;
}

/**
 * Given user's chosen style ("Modern"/"Elegant"/"Bold") and profession categoryKey,
 * return the best matching style pack key.
 */
export function pickStylePackKey(style: string, categoryKey: string): string {
  const key = `${style}|${categoryKey}`;
  const preferred = SELECTION_RULES[key];
  if (preferred && preferred.length > 0) return preferred[0];
  return STYLE_FALLBACKS[style] || "modern_glass";
}

/**
 * Return ordered list of recommended pack keys for display.
 */
export function getRecommendedPacks(style: string, categoryKey: string): string[] {
  const key = `${style}|${categoryKey}`;
  return SELECTION_RULES[key] || [STYLE_FALLBACKS[style] || "modern_glass"];
}
