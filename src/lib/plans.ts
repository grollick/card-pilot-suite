// ── guzzl.pro Pricing Tiers ──
// 4-tier model: Starter (free) → Growth → Pro → Agency

export const PLAN_TIERS = [
  {
    key: "starter",
    name: "Free",
    price: 0,
    interval: "month" as const,
    tagline: "Start getting leads — no strings attached",
    popular: false,
    features: [
      "Your own digital business card",
      "Capture leads from every interaction",
      "Let customers book you online",
      "See who's viewing your card",
      "Share via QR code or link",
      "Up to 3 services listed",
      "5 AI requests per month",
    ],
    limits: {
      contacts: 100,
      cards: 1,
      estimates: 3,
      invoices: 3,
      social_posts: 5,
      booking_services: 3,
      bookings_monthly: 200,
      team_members: 1,
      automations: 0,
      email_templates: 0,
      qr_campaigns: 0,
      gallery_images: 3,
      testimonials: 2,
      ai_requests_monthly: 5,
      pdf_export: false,
      estimate_approvals: false,
      payments: false,
      deposits: false,
      recurring_invoices: false,
      advanced_reporting: false,
      premium_templates: false,
    },
  },
  {
    key: "growth",
    name: "Pro",
    price: 29,
    interval: "month" as const,
    tagline: "Generate more leads and book more jobs — on autopilot",
    popular: true,
    features: [
      "Everything in Free, plus:",
      "Unlimited services & bookings",
      "Automated lead follow-ups",
      "Email marketing campaigns",
      "Full CRM pipeline",
      "Social media scheduler",
      "Promotion banners on your card",
      "Remove guzzl.pro watermark",
      "50 AI requests per month",
    ],
    limits: {
      contacts: -1,
      cards: 2,
      estimates: -1,
      invoices: -1,
      social_posts: -1,
      booking_services: -1,
      bookings_monthly: -1,
      team_members: 1,
      automations: 5,
      email_templates: -1,
      qr_campaigns: 3,
      gallery_images: -1,
      testimonials: -1,
      ai_requests_monthly: 50,
      pdf_export: true,
      estimate_approvals: true,
      payments: false,
      deposits: false,
      recurring_invoices: false,
      advanced_reporting: false,
      premium_templates: true,
    },
  },
  {
    key: "pro",
    name: "Pro Plus",
    price: 79,
    interval: "month" as const,
    tagline: "Scale with AI, payments, and team tools",
    popular: false,
    features: [
      "Everything in Pro, plus:",
      "Accept online payments",
      "AI-powered business assistant",
      "Revenue forecasting & insights",
      "Team member accounts",
      "Custom domain support",
      "White-label branding option",
      "Priority support",
      "500 AI requests per month",
    ],
    limits: {
      contacts: -1,
      cards: -1,
      estimates: -1,
      invoices: -1,
      social_posts: -1,
      booking_services: -1,
      bookings_monthly: -1,
      team_members: 3,
      automations: -1,
      email_templates: -1,
      qr_campaigns: -1,
      gallery_images: -1,
      testimonials: -1,
      ai_requests_monthly: 500,
      pdf_export: true,
      estimate_approvals: true,
      payments: true,
      deposits: true,
      recurring_invoices: true,
      advanced_reporting: true,
      premium_templates: true,
    },
  },
  {
    key: "agency",
    name: "Agency",
    price: 249,
    interval: "month" as const,
    tagline: "Manage multiple clients at scale",
    popular: false,
    features: [
      "Everything in Pro",
      "Unlimited client workspaces",
      "White-label branding",
      "Agency command center",
      "Bulk marketing tools",
      "Per-client analytics",
      "Custom domain support",
      "Dedicated support",
      "Unlimited AI requests",
    ],
    limits: {
      contacts: -1,
      cards: -1,
      estimates: -1,
      invoices: -1,
      social_posts: -1,
      booking_services: -1,
      bookings_monthly: -1,
      team_members: -1,
      automations: -1,
      email_templates: -1,
      qr_campaigns: -1,
      gallery_images: -1,
      testimonials: -1,
      ai_requests_monthly: -1,
      pdf_export: true,
      estimate_approvals: true,
      payments: true,
      deposits: true,
      recurring_invoices: true,
      advanced_reporting: true,
    },
  },
] as const;

export type PlanKey = (typeof PLAN_TIERS)[number]["key"];

export interface PlanLimits {
  contacts: number;
  cards: number;
  estimates: number;
  invoices: number;
  social_posts: number;
  booking_services: number;
  bookings_monthly: number;
  team_members: number;
  automations: number;
  email_templates: number;
  qr_campaigns: number;
  gallery_images: number;
  testimonials: number;
  ai_requests_monthly: number;
  pdf_export: boolean;
  estimate_approvals: boolean;
  payments: boolean;
  deposits: boolean;
  recurring_invoices: boolean;
  advanced_reporting: boolean;
  premium_templates: boolean;
}

export function getPlanByKey(key: string): (typeof PLAN_TIERS)[number] | undefined {
  return PLAN_TIERS.find((p) => p.key === key);
}

export function getPlanLimits(key: string): PlanLimits {
  const plan = getPlanByKey(key);
  if (!plan) {
    return { ...PLAN_TIERS[0].limits };
  }
  return { ...plan.limits };
}

/** Returns true if the limit is reached. -1 means unlimited. */
export function isLimitReached(limit: number, current: number): boolean {
  if (limit === -1) return false;
  return current >= limit;
}

/** AI request limits by plan key (used server-side in edge functions) */
export const AI_LIMITS: Record<string, number> = {
  starter: 5,
  free: 5,
  growth: 50,
  pro: 500,
  agency: -1,
};

/** Whether this plan shows "Powered by guzzl.pro" branding */
export function showsBranding(planKey: string): boolean {
  return planKey === "starter" || planKey === "free" || !planKey;
}

/** Returns the next tier up from the current plan, or null if already at top */
export function getNextTier(currentKey: string): (typeof PLAN_TIERS)[number] | null {
  const idx = PLAN_TIERS.findIndex((p) => p.key === currentKey);
  if (idx === -1 || idx >= PLAN_TIERS.length - 1) return null;
  return PLAN_TIERS[idx + 1];
}
