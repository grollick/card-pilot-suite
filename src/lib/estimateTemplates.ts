import type { EstimateLineItem } from "@/hooks/useEstimates";

/** Template for trades professions */
export interface TradesTemplate {
  key: string;
  name: string;
  defaultJobType: string;
  lineItems: Omit<EstimateLineItem, "line_total" | "sort_order">[];
}

export const TRADES_TEMPLATES: TradesTemplate[] = [
  {
    key: "general_contractor",
    name: "General Contractor",
    defaultJobType: "Renovation",
    lineItems: [
      { title: "Demolition", description: "Removal of existing structures", quantity: 1, unit: "job", unit_price: 0, labor_hours: 8, labor_rate: 65, material_cost: 200, markup_percent: 15, tax_percent: 0 },
      { title: "Framing", description: "New wall framing", quantity: 1, unit: "job", unit_price: 0, labor_hours: 16, labor_rate: 65, material_cost: 800, markup_percent: 15, tax_percent: 0 },
      { title: "Drywall", description: "Install and finish drywall", quantity: 1, unit: "job", unit_price: 0, labor_hours: 12, labor_rate: 55, material_cost: 400, markup_percent: 15, tax_percent: 0 },
    ],
  },
  {
    key: "plumber",
    name: "Plumber",
    defaultJobType: "Plumbing Repair",
    lineItems: [
      { title: "Diagnostic / Inspection", description: "On-site assessment", quantity: 1, unit: "visit", unit_price: 95, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Pipe Repair", description: "Replace damaged section", quantity: 1, unit: "job", unit_price: 0, labor_hours: 3, labor_rate: 85, material_cost: 120, markup_percent: 10, tax_percent: 0 },
      { title: "Fixture Installation", description: "Install new fixture", quantity: 1, unit: "each", unit_price: 0, labor_hours: 2, labor_rate: 85, material_cost: 250, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "electrician",
    name: "Electrician",
    defaultJobType: "Electrical Work",
    lineItems: [
      { title: "Panel Inspection", quantity: 1, unit: "visit", unit_price: 120, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Outlet Installation", quantity: 4, unit: "each", unit_price: 0, labor_hours: 0.5, labor_rate: 90, material_cost: 25, markup_percent: 10, tax_percent: 0 },
      { title: "Wiring Run", quantity: 1, unit: "job", unit_price: 0, labor_hours: 6, labor_rate: 90, material_cost: 350, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "painter",
    name: "Painter",
    defaultJobType: "Interior Painting",
    lineItems: [
      { title: "Surface Preparation", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 45, material_cost: 60, markup_percent: 10, tax_percent: 0 },
      { title: "Primer Coat", quantity: 1, unit: "job", unit_price: 0, labor_hours: 3, labor_rate: 45, material_cost: 80, markup_percent: 10, tax_percent: 0 },
      { title: "Finish Coats (2x)", quantity: 1, unit: "job", unit_price: 0, labor_hours: 6, labor_rate: 45, material_cost: 120, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "landscaper",
    name: "Landscaper",
    defaultJobType: "Landscaping",
    lineItems: [
      { title: "Site Cleanup", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 40, material_cost: 0, markup_percent: 10, tax_percent: 0 },
      { title: "Planting", quantity: 10, unit: "plants", unit_price: 25, labor_hours: 0.5, labor_rate: 40, material_cost: 0, markup_percent: 10, tax_percent: 0 },
      { title: "Mulch & Topsoil", quantity: 5, unit: "yards", unit_price: 45, labor_hours: 0, labor_rate: 0, material_cost: 0, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "cleaner",
    name: "Cleaner",
    defaultJobType: "Deep Clean",
    lineItems: [
      { title: "General Cleaning", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 35, material_cost: 30, markup_percent: 0, tax_percent: 0 },
      { title: "Window Cleaning", quantity: 1, unit: "job", unit_price: 0, labor_hours: 2, labor_rate: 35, material_cost: 15, markup_percent: 0, tax_percent: 0 },
    ],
  },
  {
    key: "roofer",
    name: "Roofer",
    defaultJobType: "Roof Repair",
    lineItems: [
      { title: "Roof Inspection", quantity: 1, unit: "visit", unit_price: 150, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Shingle Replacement", quantity: 1, unit: "sq", unit_price: 0, labor_hours: 4, labor_rate: 75, material_cost: 250, markup_percent: 15, tax_percent: 0 },
      { title: "Flashing Repair", quantity: 1, unit: "job", unit_price: 0, labor_hours: 2, labor_rate: 75, material_cost: 80, markup_percent: 15, tax_percent: 0 },
    ],
  },
  {
    key: "flooring",
    name: "Flooring Installer",
    defaultJobType: "Flooring Installation",
    lineItems: [
      { title: "Floor Removal", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 50, material_cost: 0, markup_percent: 10, tax_percent: 0 },
      { title: "Subfloor Prep", quantity: 1, unit: "job", unit_price: 0, labor_hours: 2, labor_rate: 50, material_cost: 100, markup_percent: 10, tax_percent: 0 },
      { title: "Flooring Install", description: "LVP / Hardwood / Tile", quantity: 200, unit: "sqft", unit_price: 4.5, labor_hours: 0, labor_rate: 0, material_cost: 0, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "hvac",
    name: "HVAC",
    defaultJobType: "HVAC Service",
    lineItems: [
      { title: "System Diagnostic", quantity: 1, unit: "visit", unit_price: 125, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Refrigerant Recharge", quantity: 1, unit: "job", unit_price: 0, labor_hours: 1, labor_rate: 95, material_cost: 200, markup_percent: 15, tax_percent: 0 },
      { title: "Filter & Coil Cleaning", quantity: 1, unit: "job", unit_price: 0, labor_hours: 1.5, labor_rate: 95, material_cost: 40, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "handyman",
    name: "Handyman",
    defaultJobType: "General Repair",
    lineItems: [
      { title: "Service Call", quantity: 1, unit: "visit", unit_price: 75, labor_hours: 0, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Repair Work", quantity: 1, unit: "hr", unit_price: 0, labor_hours: 2, labor_rate: 55, material_cost: 50, markup_percent: 10, tax_percent: 0 },
    ],
  },
];
