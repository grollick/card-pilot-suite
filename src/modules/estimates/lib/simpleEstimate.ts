import { calculateLineTotals, type EstimateLineItem, type EstimateSection } from "@/hooks/useEstimates";

export const EMPTY_LINE_ITEM: EstimateLineItem = {
  title: "", description: "", quantity: 1, unit: "each",
  unit_price: 0, labor_hours: 0, labor_rate: 0,
  material_cost: 0, markup_percent: 0, tax_percent: 0,
  line_total: 0, sort_order: 0,
  calc_mode: "unit_count", calc_length: 0, calc_width: 0, calc_depth: 0,
  is_optional: false,
};

/** A line from the simple view, saved exactly like a full-editor line: unit "each", the estimate's tax %, same line_total math. */
export function simpleLineItem(title: string, quantity: number, unitPrice: number, taxPercent: number, sortOrder: number, base: Partial<EstimateLineItem> = {}): EstimateLineItem {
  return calculateLineTotals({
    ...EMPTY_LINE_ITEM, ...base,
    title, quantity, unit: "each", unit_price: unitPrice, tax_percent: taxPercent, sort_order: sortOrder,
  });
}

/** Tax % to show in the simple view (all lines share one). */
export function sharedTaxPercent(sections: EstimateSection[]): number {
  return sections[0]?.items[0]?.tax_percent || 0;
}

/** True when the estimate uses anything the simple view can't show, so it must open in the full editor. */
export function needsFullEditor(sections: EstimateSection[], opts: { discount_amount?: number; deposit_amount?: number; deposit_percent?: number } = {}): boolean {
  if (sections.length > 1) return true;
  if ((opts.discount_amount || 0) > 0 || (opts.deposit_amount || 0) > 0 || (opts.deposit_percent || 0) > 0) return true;
  const items = sections[0]?.items ?? [];
  const taxes = new Set(items.map((i) => Number(i.tax_percent) || 0));
  if (taxes.size > 1) return true;
  return items.some((i) =>
    (Number(i.labor_hours) || 0) > 0 || (Number(i.labor_rate) || 0) > 0 ||
    (Number(i.material_cost) || 0) > 0 || (Number(i.markup_percent) || 0) > 0 ||
    i.is_optional || (i.calc_mode && i.calc_mode !== "unit_count"));
}
