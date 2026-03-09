import type { EstimateLineItem, EstimateSection } from "@/hooks/useEstimates";
import type { CalcMode } from "@/lib/estimateCalculators";

/** Template for trades professions */
export interface TradesTemplate {
  key: string;
  name: string;
  defaultJobType: string;
  sections: { name: string; items: Omit<EstimateLineItem, "line_total" | "sort_order">[] }[];
}

function li(title: string, overrides: Partial<Omit<EstimateLineItem, "line_total" | "sort_order">> = {}): Omit<EstimateLineItem, "line_total" | "sort_order"> {
  return {
    title,
    description: "",
    quantity: 1,
    unit: "each",
    unit_price: 0,
    labor_hours: 0,
    labor_rate: 0,
    material_cost: 0,
    markup_percent: 0,
    tax_percent: 0,
    calc_mode: "unit_count" as CalcMode,
    calc_length: 0,
    calc_width: 0,
    calc_depth: 0,
    is_optional: false,
    ...overrides,
  };
}

export const TRADES_TEMPLATES: TradesTemplate[] = [
  {
    key: "general_contractor",
    name: "General Contractor",
    defaultJobType: "Renovation",
    sections: [
      {
        name: "Demolition & Prep",
        items: [
          li("Demolition", { description: "Removal of existing structures", unit: "job", labor_hours: 8, labor_rate: 65, material_cost: 200, markup_percent: 15 }),
          li("Debris Removal", { unit: "job", labor_hours: 4, labor_rate: 45, markup_percent: 10 }),
          li("Site Protection", { unit: "job", material_cost: 150, markup_percent: 10 }),
        ],
      },
      {
        name: "Construction",
        items: [
          li("Framing", { description: "New wall framing", unit: "job", labor_hours: 16, labor_rate: 65, material_cost: 800, markup_percent: 15 }),
          li("Drywall", { description: "Install and finish drywall", unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 3.5, labor_hours: 12, labor_rate: 55, markup_percent: 15 }),
          li("Insulation", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 1.5, material_cost: 0, markup_percent: 10 }),
        ],
      },
      {
        name: "Finishing",
        items: [
          li("Trim & Molding", { unit: "lf", calc_mode: "linear_ft" as CalcMode, unit_price: 4, labor_hours: 6, labor_rate: 55, markup_percent: 15 }),
          li("Paint", { unit: "job", labor_hours: 8, labor_rate: 45, material_cost: 200, markup_percent: 10 }),
          li("Cleanup", { unit: "job", labor_hours: 4, labor_rate: 35 }),
        ],
      },
    ],
  },
  {
    key: "plumber",
    name: "Plumber",
    defaultJobType: "Plumbing Repair",
    sections: [
      {
        name: "Service",
        items: [
          li("Service Call", { unit: "visit", unit_price: 95, calc_mode: "flat_rate" as CalcMode }),
          li("Diagnostic / Inspection", { description: "On-site assessment", unit: "hr", labor_hours: 1, labor_rate: 85, calc_mode: "hourly" as CalcMode }),
        ],
      },
      {
        name: "Labor & Repairs",
        items: [
          li("Fixture Installation", { description: "Install new fixture", unit: "each", labor_hours: 2, labor_rate: 85, material_cost: 250, markup_percent: 10 }),
          li("Pipe Repair", { description: "Replace damaged section", unit: "job", labor_hours: 3, labor_rate: 85, material_cost: 120, markup_percent: 10 }),
          li("Leak Repair", { unit: "job", labor_hours: 2, labor_rate: 85, material_cost: 50, markup_percent: 10 }),
        ],
      },
      {
        name: "Parts & Materials",
        items: [
          li("Parts & Fittings", { unit: "lot", material_cost: 150, markup_percent: 15 }),
          li("Emergency Charge", { unit: "job", unit_price: 150, calc_mode: "flat_rate" as CalcMode, is_optional: true }),
        ],
      },
    ],
  },
  {
    key: "electrician",
    name: "Electrician",
    defaultJobType: "Electrical Work",
    sections: [
      {
        name: "Diagnostics",
        items: [
          li("Troubleshooting", { unit: "hr", labor_hours: 1, labor_rate: 90, calc_mode: "hourly" as CalcMode }),
          li("Panel Inspection", { unit: "visit", unit_price: 120, calc_mode: "flat_rate" as CalcMode }),
        ],
      },
      {
        name: "Installation",
        items: [
          li("Outlet/Switch Install", { quantity: 4, unit: "each", labor_hours: 0.5, labor_rate: 90, material_cost: 25, markup_percent: 10 }),
          li("Fixture Install", { unit: "each", labor_hours: 1, labor_rate: 90, material_cost: 75, markup_percent: 10 }),
          li("Panel Work", { unit: "job", labor_hours: 4, labor_rate: 95, material_cost: 300, markup_percent: 15 }),
          li("Wiring Run", { unit: "job", labor_hours: 6, labor_rate: 90, material_cost: 350, markup_percent: 10 }),
        ],
      },
      {
        name: "Other",
        items: [
          li("Permit Fee", { unit: "each", unit_price: 200, calc_mode: "flat_rate" as CalcMode }),
          li("Materials", { unit: "lot", material_cost: 200, markup_percent: 10 }),
        ],
      },
    ],
  },
  {
    key: "painter",
    name: "Painter",
    defaultJobType: "Interior Painting",
    sections: [
      {
        name: "Preparation",
        items: [
          li("Wall Prep", { description: "Patching, sanding, cleaning", unit: "job", labor_hours: 4, labor_rate: 45, material_cost: 40, markup_percent: 10 }),
          li("Masking & Taping", { unit: "job", labor_hours: 2, labor_rate: 40, material_cost: 30 }),
          li("Surface Priming", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 0.5, labor_hours: 3, labor_rate: 45, material_cost: 80, markup_percent: 10 }),
        ],
      },
      {
        name: "Painting",
        items: [
          li("First Coat", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 0.75, labor_hours: 4, labor_rate: 45, material_cost: 60, markup_percent: 10 }),
          li("Second Coat", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 0.75, labor_hours: 4, labor_rate: 45, material_cost: 60, markup_percent: 10 }),
          li("Trim", { unit: "lf", calc_mode: "linear_ft" as CalcMode, unit_price: 2, labor_hours: 3, labor_rate: 45, material_cost: 30, markup_percent: 10 }),
          li("Ceiling", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 0.85, labor_hours: 3, labor_rate: 45, material_cost: 50, markup_percent: 10, is_optional: true }),
        ],
      },
      {
        name: "Materials",
        items: [
          li("Paint & Supplies", { unit: "lot", material_cost: 200, markup_percent: 10 }),
        ],
      },
    ],
  },
  {
    key: "landscaper",
    name: "Landscaper",
    defaultJobType: "Landscaping",
    sections: [
      {
        name: "Site Work",
        items: [
          li("Site Cleanup", { unit: "job", labor_hours: 4, labor_rate: 40, markup_percent: 10 }),
          li("Topsoil", { quantity: 5, unit: "cy", calc_mode: "cubic_yard" as CalcMode, unit_price: 35, markup_percent: 10 }),
          li("Mulch", { quantity: 5, unit: "cy", calc_mode: "cubic_yard" as CalcMode, unit_price: 45, markup_percent: 10 }),
        ],
      },
      {
        name: "Planting",
        items: [
          li("Sod Installation", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 1.5, labor_hours: 4, labor_rate: 40, markup_percent: 10 }),
          li("Planting", { quantity: 10, unit: "plants", unit_price: 25, labor_hours: 0.5, labor_rate: 40, markup_percent: 10 }),
        ],
      },
      {
        name: "Labor & Disposal",
        items: [
          li("General Labor", { unit: "hr", labor_hours: 8, labor_rate: 40, calc_mode: "hourly" as CalcMode }),
          li("Disposal", { unit: "job", unit_price: 150, calc_mode: "flat_rate" as CalcMode }),
        ],
      },
    ],
  },
  {
    key: "cleaner",
    name: "Cleaner",
    defaultJobType: "Deep Clean",
    sections: [
      {
        name: "Cleaning Services",
        items: [
          li("Standard Clean", { unit: "job", labor_hours: 3, labor_rate: 35, material_cost: 20 }),
          li("Deep Clean", { unit: "job", labor_hours: 5, labor_rate: 35, material_cost: 30 }),
          li("Move-in/Move-out Clean", { unit: "job", labor_hours: 6, labor_rate: 40, material_cost: 40, is_optional: true }),
        ],
      },
      {
        name: "Add-ons",
        items: [
          li("Window Cleaning", { unit: "job", labor_hours: 2, labor_rate: 35, material_cost: 15, is_optional: true }),
          li("Carpet Shampooing", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 0.25, labor_hours: 2, labor_rate: 35, is_optional: true }),
          li("Supplies", { unit: "lot", material_cost: 30 }),
        ],
      },
    ],
  },
  {
    key: "roofer",
    name: "Roofer",
    defaultJobType: "Roof Repair",
    sections: [
      {
        name: "Inspection & Tear-off",
        items: [
          li("Roof Inspection", { unit: "visit", unit_price: 150, calc_mode: "flat_rate" as CalcMode }),
          li("Tear-off", { unit: "sq", labor_hours: 6, labor_rate: 70, markup_percent: 10 }),
          li("Disposal", { unit: "job", unit_price: 250, calc_mode: "flat_rate" as CalcMode }),
        ],
      },
      {
        name: "Installation",
        items: [
          li("Underlayment", { unit: "sq", unit_price: 35, labor_hours: 2, labor_rate: 70, markup_percent: 15 }),
          li("Shingles / Materials", { unit: "sq", unit_price: 0, labor_hours: 4, labor_rate: 75, material_cost: 250, markup_percent: 15 }),
          li("Flashing Repair", { unit: "job", labor_hours: 2, labor_rate: 75, material_cost: 80, markup_percent: 15 }),
        ],
      },
      {
        name: "Labor",
        items: [
          li("Roofing Labor", { unit: "hr", labor_hours: 16, labor_rate: 70, calc_mode: "hourly" as CalcMode }),
        ],
      },
    ],
  },
  {
    key: "flooring",
    name: "Flooring Installer",
    defaultJobType: "Flooring Installation",
    sections: [
      {
        name: "Removal & Prep",
        items: [
          li("Floor Removal", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 1.5, labor_hours: 4, labor_rate: 50, markup_percent: 10 }),
          li("Subfloor Prep", { unit: "job", labor_hours: 2, labor_rate: 50, material_cost: 100, markup_percent: 10 }),
          li("Underlayment", { unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 0.5, markup_percent: 10 }),
        ],
      },
      {
        name: "Installation",
        items: [
          li("Flooring Install", { description: "LVP / Hardwood / Tile", quantity: 200, unit: "sqft", calc_mode: "sqft" as CalcMode, unit_price: 4.5, markup_percent: 10 }),
          li("Trim / Baseboards", { unit: "lf", calc_mode: "linear_ft" as CalcMode, unit_price: 3, labor_hours: 3, labor_rate: 50, markup_percent: 10 }),
        ],
      },
      {
        name: "Materials",
        items: [
          li("Flooring Material", { unit: "sqft", calc_mode: "sqft" as CalcMode, material_cost: 0, unit_price: 4.5, markup_percent: 10 }),
          li("Adhesive & Supplies", { unit: "lot", material_cost: 100, markup_percent: 10 }),
        ],
      },
    ],
  },
  {
    key: "hvac",
    name: "HVAC",
    defaultJobType: "HVAC Service",
    sections: [
      {
        name: "Service & Diagnostic",
        items: [
          li("Service Call", { unit: "visit", unit_price: 125, calc_mode: "flat_rate" as CalcMode }),
          li("System Diagnostic", { unit: "hr", labor_hours: 1, labor_rate: 95, calc_mode: "hourly" as CalcMode }),
        ],
      },
      {
        name: "Repairs & Install",
        items: [
          li("Install Labor", { unit: "hr", labor_hours: 8, labor_rate: 95, calc_mode: "hourly" as CalcMode }),
          li("Equipment", { unit: "each", material_cost: 2000, markup_percent: 15 }),
          li("Refrigerant Recharge", { unit: "job", labor_hours: 1, labor_rate: 95, material_cost: 200, markup_percent: 15 }),
          li("Ducting", { unit: "lf", calc_mode: "linear_ft" as CalcMode, unit_price: 12, labor_hours: 4, labor_rate: 85, markup_percent: 10 }),
        ],
      },
      {
        name: "Other",
        items: [
          li("Filter & Coil Cleaning", { unit: "job", labor_hours: 1.5, labor_rate: 95, material_cost: 40, markup_percent: 10 }),
          li("Disposal", { unit: "job", unit_price: 100, calc_mode: "flat_rate" as CalcMode }),
        ],
      },
    ],
  },
  {
    key: "handyman",
    name: "Handyman",
    defaultJobType: "General Repair",
    sections: [
      {
        name: "Service",
        items: [
          li("Service Call", { unit: "visit", unit_price: 75, calc_mode: "flat_rate" as CalcMode }),
          li("Hourly Labor", { unit: "hr", labor_hours: 2, labor_rate: 55, calc_mode: "hourly" as CalcMode }),
        ],
      },
      {
        name: "Materials & Misc",
        items: [
          li("Materials", { unit: "lot", material_cost: 50, markup_percent: 10 }),
          li("Misc Repairs", { unit: "job", labor_hours: 1, labor_rate: 55, material_cost: 25 }),
          li("Disposal", { unit: "job", unit_price: 50, calc_mode: "flat_rate" as CalcMode, is_optional: true }),
        ],
      },
    ],
  },
];
