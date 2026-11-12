export function formatServicePrice(price: number | string | null | undefined): string {
  if (price == null || (typeof price === "string" && !price.trim())) return "";
  const value = Number(price);
  if (Number.isFinite(value)) return value === 0 ? "Free" : `$${value.toLocaleString("en-CA", { maximumFractionDigits: 2 })}`;
  return String(price);
}

export function formatServiceDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return "";
  if (minutes >= 1440) { const days = Number((minutes / 1440).toFixed(2)); return `${days} ${days === 1 ? "day" : "days"}`; }
  if (minutes >= 60) { const hours = Number((minutes / 60).toFixed(2)); return `${hours} ${hours === 1 ? "hr" : "hrs"}`; }
  return `${minutes} min`;
}