import {
  Wrench,
  Zap,
  Thermometer,
  Triangle,
  Paintbrush,
  Layers,
  Footprints,
  Grid3x3,
  Box,
  Hammer,
  Fence,
  Drill,
  Construction,
  HardHat,
  TreePine,
  Drama,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export interface ProfessionIconRule {
  match: RegExp;
  icon: LucideIcon;
  color: string;
  label: string;
}

/**
 * Single source of truth for category → icon + color mapping
 * used by both On-Duty Map markers and the map legend.
 *
 * Resolved by prioritized regex match against `profession_name` (free text).
 */
export const PROFESSION_ICON_RULES: ProfessionIconRule[] = [
  { match: /plumb/i, icon: Wrench, color: "#2563EB", label: "Plumbing" },
  { match: /electric/i, icon: Zap, color: "#CA8A04", label: "Electrical" },
  { match: /hvac|heating|cooling/i, icon: Thermometer, color: "#0EA5E9", label: "HVAC" },
  { match: /roof/i, icon: Triangle, color: "#EA580C", label: "Roofing" },
  { match: /paint/i, icon: Paintbrush, color: "#9333EA", label: "Painting" },
  { match: /drywall/i, icon: Layers, color: "#A78BFA", label: "Drywall" },
  { match: /floor/i, icon: Footprints, color: "#0D9488", label: "Flooring" },
  { match: /tile/i, icon: Grid3x3, color: "#F59E0B", label: "Tile" },
  { match: /concrete|mason/i, icon: Box, color: "#52525B", label: "Concrete/Masonry" },
  { match: /deck/i, icon: Hammer, color: "#84CC16", label: "Decks" },
  { match: /fence/i, icon: Fence, color: "#A16207", label: "Fencing" },
  { match: /handy/i, icon: Drill, color: "#06B6D4", label: "Handyman" },
  { match: /renovat|remodel/i, icon: Construction, color: "#DC2626", label: "Renovation" },
  { match: /general contractor/i, icon: HardHat, color: "#111827", label: "General Contractor" },
  { match: /landscap|lawn|garden/i, icon: TreePine, color: "#16A34A", label: "Landscaping" },
  { match: /actor|perform|music|entertain/i, icon: Drama, color: "#DB2777", label: "Entertainment" },
];

export const PROFESSION_ICON_FALLBACK: Omit<ProfessionIconRule, "match"> = {
  icon: MapPin,
  color: "#475569",
  label: "Other",
};

export function resolveProfessionIcon(
  professionName: string | null | undefined
): Omit<ProfessionIconRule, "match"> {
  if (!professionName) return PROFESSION_ICON_FALLBACK;
  for (const rule of PROFESSION_ICON_RULES) {
    if (rule.match.test(professionName)) {
      return { icon: rule.icon, color: rule.color, label: rule.label };
    }
  }
  return PROFESSION_ICON_FALLBACK;
}

/**
 * Render a lucide icon to an SVG string for use inside a maplibre HTML marker.
 * We use the icon's iconNode (lucide internal) to build a static SVG without React.
 */
export function iconToSvgString(icon: LucideIcon, size = 18, stroke = "#FFFFFF"): string {
  // Lucide icon components carry their iconNode on the React component.
  // Each iconNode is an array of [tagName, attrs] children of an outer <svg>.
  const node = (icon as unknown as { iconNode?: Array<[string, Record<string, string | number>]> })
    .iconNode;
  const children = Array.isArray(node)
    ? node
        .map(([tag, attrs]) => {
          const a = Object.entries(attrs)
            .map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`)
            .join(" ");
          return `<${tag} ${a} />`;
        })
        .join("")
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}
