/**
 * Contact Protection Utilities
 * Protects card users against scrapers, spam, and bot submissions.
 */

/** Obfuscate an email for public display: j***@gmail.com */
export function obfuscateEmail(email: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

/** Mask a phone number for display: ***-***-9180 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const lastFour = digits.slice(-4);
  return `***-***-${lastFour}`;
}

/**
 * Bot detection for form submissions.
 * Returns true if submission appears to be from a bot.
 */
export function detectBot(honeypotValue: string, formLoadTime: number): { isBot: boolean; reason?: string } {
  // 1. Honeypot filled = bot
  if (honeypotValue && honeypotValue.trim().length > 0) {
    return { isBot: true, reason: "honeypot" };
  }

  // 2. Form submitted too fast (< 2 seconds) = likely bot
  const elapsed = Date.now() - formLoadTime;
  if (elapsed < 2000) {
    return { isBot: true, reason: "too_fast" };
  }

  // 3. Suspicious user agents
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    "bot", "crawler", "spider", "scraper", "curl", "wget", "python-requests",
    "httpx", "scrapy", "phantom", "headless", "selenium", "puppeteer",
  ];
  if (botPatterns.some(pattern => ua.includes(pattern))) {
    return { isBot: true, reason: "bot_ua" };
  }

  return { isBot: false };
}
