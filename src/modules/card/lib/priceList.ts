import type { CalcPreset } from "@/modules/card/components/QuoteCalculator";

export interface PriceRow {
  name: string;
  from: string;
  to: string;
}

export const MAX_PRICE_ROWS = 8;
export const DEFAULT_PRICE_NOTE = "Rough estimate. Final price after a look at the job.";

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

/** Returns an error message for a row, or null when it is valid. */
export function validatePriceRow(row: PriceRow): string | null {
  if (!row.name.trim()) return "Add a job name.";
  const from = num(row.from);
  const to = num(row.to);
  if (row.from.trim() !== "" && !(from > 0)) return "From must be above 0.";
  if (row.to.trim() !== "") {
    if (row.from.trim() === "") return "Add a From price first.";
    if (!(to >= from)) return "To must be empty or at least From.";
  }
  return null;
}

export function isPricedRow(row: PriceRow): boolean {
  return validatePriceRow(row) === null && num(row.from) > 0;
}

/** Builds the saved calculator from the pro's rows. Rows without a price are left out. Null when nothing is priced. */
export function buildPresetFromRows(rows: PriceRow[], note: string): CalcPreset | null {
  const priced = rows.filter(isPricedRow);
  if (priced.length === 0) return null;
  return {
    id: "custom",
    name: "Your price list",
    professions: [],
    basePrice: 0,
    basePriceMax: 0,
    disclaimer: note,
    fields: [
      {
        id: "job",
        label: "What do you need?",
        type: "select",
        options: priced.map((r, i) => {
          const from = num(r.from);
          const to = r.to.trim() === "" ? from : num(r.to);
          return { label: r.name.trim(), value: `job_${i}`, priceMin: from, priceMax: to };
        }),
      },
    ],
  };
}

/** Rebuild editable rows from a saved preset (used when no raw rows were saved). */
export function rowsFromPreset(preset: CalcPreset | null | undefined): PriceRow[] {
  const opts = preset?.fields?.[0]?.options || [];
  return opts.map((o) => ({
    name: o.label,
    from: o.priceMin ? String(o.priceMin) : "",
    to: o.priceMax && o.priceMax !== o.priceMin ? String(o.priceMax) : "",
  }));
}
