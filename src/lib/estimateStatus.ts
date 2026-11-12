/** Shows "expired" for a sent or viewed estimate whose valid-until date has passed. */
export function displayEstimateStatus(status: string, expiryDate?: string | null, now = new Date()): string {
  if ((status === "sent" || status === "viewed") && expiryDate) {
    const end = new Date(`${expiryDate}T23:59:59`);
    if (!isNaN(end.getTime()) && now > end) return "expired";
  }
  return status;
}
