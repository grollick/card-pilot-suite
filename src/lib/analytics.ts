/**
 * Shared analytics utilities used across hooks.
 */

/** Parse a user-agent string into a device category. */
export function parseDevice(ua?: string): string {
  if (!ua) return "Unknown";
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  return "Desktop";
}

/** Extract a clean domain from a URL string. */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.slice(0, 30);
  }
}
