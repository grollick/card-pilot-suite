/**
 * Anti-abuse utilities: disposable email detection, fingerprinting, rate limiting
 */

// --- Disposable Email Detection ---
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","tempmail.com","throwaway.email",
  "yopmail.com","sharklasers.com","guerrillamailblock.com","grr.la",
  "guerrillamail.info","guerrillamail.net","guerrillamail.org","guerrillamail.de",
  "temp-mail.org","dispostable.com","trashmail.com","trashmail.net",
  "trashmail.org","mailnesia.com","maildrop.cc","fakeinbox.com",
  "tempail.com","tempr.email","discard.email","discardmail.com",
  "mailcatch.com","tempinbox.com","getnada.com","emailondeck.com",
  "mintemail.com","mohmal.com","mailsac.com","burnermail.io",
  "inboxbear.com","mailnull.com","spamgourmet.com","jetable.org",
  "harakirimail.com","crazymailing.com","tmail.ws","10minutemail.com",
  "20minutemail.it","getairmail.com","filzmail.com","trashymail.com",
  "temporarymail.com","mailforspam.com","safetymail.info","instantemailaddress.com",
  "emaillime.com","emailsensei.com","incognitomail.org","mailexpire.com",
  "throwam.com","tempmailaddress.com","wegwerfmail.de","wegwerfmail.net",
  "mytemp.email","tempmailo.com","mohmal.im","emailfake.com",
  "cuvox.de","armyspy.com","dayrep.com","einrot.com","fleckens.hu",
  "gustr.com","jourrapide.com","rhyta.com","superrito.com","teleworm.us",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() || "";
}

// --- Browser Fingerprint ---
export function generateFingerprint(): string {
  const components: string[] = [];
  
  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // Hardware concurrency
  components.push(String(navigator.hardwareConcurrency || 0));
  
  // Device memory (if available)
  components.push(String((navigator as any).deviceMemory || 0));
  
  // Touch support
  components.push(String(navigator.maxTouchPoints || 0));
  
  // Canvas fingerprint (fast)
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("fp", 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch { /* skip */ }

  return hashString(components.join("|"));
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// --- Client-Side Rate Limiting ---
const RATE_LIMIT_KEY = "cp_signup_attempts";

interface RateLimitEntry {
  timestamps: number[];
}

export function checkClientRateLimit(maxAttempts = 5, windowMs = 300_000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let entry: RateLimitEntry = { timestamps: [] };
  
  try {
    const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (stored) entry = JSON.parse(stored);
  } catch { /* fresh */ }

  // Filter to window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  
  const remaining = Math.max(0, maxAttempts - entry.timestamps.length);
  const allowed = entry.timestamps.length < maxAttempts;

  return { allowed, remaining };
}

export function recordSignupAttempt(): void {
  const now = Date.now();
  let entry: RateLimitEntry = { timestamps: [] };
  
  try {
    const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (stored) entry = JSON.parse(stored);
  } catch { /* fresh */ }

  entry.timestamps.push(now);
  // Keep only last 20
  if (entry.timestamps.length > 20) entry.timestamps = entry.timestamps.slice(-20);
  
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry));
  } catch { /* skip */ }
}

// --- Risk Assessment ---
export type RiskLevel = "low" | "medium" | "high";

export interface RiskAssessment {
  level: RiskLevel;
  flags: string[];
  blocked: boolean;
}

export function assessSignupRisk(email: string): RiskAssessment {
  const flags: string[] = [];
  let score = 0;

  // Disposable email
  if (isDisposableEmail(email)) {
    flags.push("disposable_email");
    score += 3;
  }

  // Rate limit check
  const rateCheck = checkClientRateLimit();
  if (!rateCheck.allowed) {
    flags.push("rate_limited");
    score += 4;
  } else if (rateCheck.remaining <= 2) {
    flags.push("near_rate_limit");
    score += 1;
  }

  // Determine level
  let level: RiskLevel = "low";
  if (score >= 4) level = "high";
  else if (score >= 2) level = "medium";

  return {
    level,
    flags,
    blocked: score >= 6,
  };
}
