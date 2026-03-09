/** Measurement calculation modes for estimate line items */

export type CalcMode = "unit_count" | "sqft" | "linear_ft" | "cubic_yard" | "hourly" | "flat_rate";

export const CALC_MODES: { value: CalcMode; label: string; description: string }[] = [
  { value: "unit_count", label: "Unit Count", description: "Qty × Unit Price" },
  { value: "sqft", label: "Sq Footage", description: "Length × Width" },
  { value: "linear_ft", label: "Linear Ft", description: "Length" },
  { value: "cubic_yard", label: "Cubic Yard", description: "L × W × D ÷ 27" },
  { value: "hourly", label: "Hourly", description: "Hours × Rate" },
  { value: "flat_rate", label: "Flat Rate", description: "Fixed amount" },
];

/**
 * Derives the effective quantity from calc mode + dimension inputs.
 * For modes that compute quantity from dimensions, returns the calculated value.
 */
export function calcQuantityFromMode(
  mode: CalcMode,
  opts: { calc_length?: number; calc_width?: number; calc_depth?: number; labor_hours?: number; quantity?: number },
): number {
  const L = opts.calc_length || 0;
  const W = opts.calc_width || 0;
  const D = opts.calc_depth || 0;

  switch (mode) {
    case "sqft":
      return Math.round(L * W * 100) / 100;
    case "linear_ft":
      return L;
    case "cubic_yard":
      return W > 0 ? Math.round((L * W * D) / 27 * 100) / 100 : 0;
    case "hourly":
      return opts.labor_hours || 0;
    case "flat_rate":
      return 1;
    case "unit_count":
    default:
      return opts.quantity || 1;
  }
}

/** Returns which dimension fields to show for a given calc mode */
export function dimensionFieldsForMode(mode: CalcMode): ("length" | "width" | "depth")[] {
  switch (mode) {
    case "sqft": return ["length", "width"];
    case "linear_ft": return ["length"];
    case "cubic_yard": return ["length", "width", "depth"];
    default: return [];
  }
}

/** Returns the auto-set unit label for a calc mode */
export function unitForMode(mode: CalcMode): string | null {
  switch (mode) {
    case "sqft": return "sqft";
    case "linear_ft": return "lf";
    case "cubic_yard": return "cy";
    case "hourly": return "hr";
    case "flat_rate": return "job";
    default: return null;
  }
}
