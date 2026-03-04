// ── CardPilot Pricing Tiers ──
// Positioning: "The digital business card that automatically captures and follows up with leads."

export const PLAN_TIERS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    interval: "month" as const,
    tagline: "Try it out — forever free",
    popular: false,
    features: [
      "1 digital card",
      "20 contacts",
      "Basic lead capture",
      "QR code sharing",
      "CardPilot branding on card",
    ],
    limits: {
      contacts: 20,
      cards: 1,
      booking_services: 0,
      team_members: 1,
      automations: 0,
      email_templates: 0,
      qr_campaigns: 0,
    },
  },
  {
    key: "starter",
    name: "Starter",
    price: 19,
    interval: "month" as const,
    tagline: "For individuals just starting",
    popular: false,
    features: [
      "1 digital card",
      "100 contacts",
      "Basic lead capture",
      "Contact CRM",
      "Task tracking",
      "QR code sharing",
      "Basic analytics",
      "Remove CardPilot branding",
    ],
    limits: {
      contacts: 100,
      cards: 1,
      booking_services: 1,
      team_members: 1,
      automations: 0,
      email_templates: 0,
      qr_campaigns: 1,
    },
  },
  {
    key: "pro",
    name: "Pro",
    price: 49,
    interval: "month" as const,
    tagline: "For professionals serious about leads",
    popular: true,
    features: [
      "Everything in Starter",
      "Unlimited contacts",
      "Pipeline CRM",
      "Booking system",
      "Email templates",
      "Automation rules",
      "Advanced analytics",
      "AI card content generator",
    ],
    limits: {
      contacts: -1, // unlimited
      cards: 3,
      booking_services: 5,
      team_members: 1,
      automations: 10,
      email_templates: -1,
      qr_campaigns: 5,
    },
  },
  {
    key: "business",
    name: "Business",
    price: 99,
    interval: "month" as const,
    tagline: "For serious lead generators",
    popular: false,
    features: [
      "Everything in Pro",
      "Unlimited cards",
      "Team members (up to 5)",
      "Advanced automation",
      "QR campaign analytics",
      "Priority support",
    ],
    limits: {
      contacts: -1,
      cards: -1,
      booking_services: -1,
      team_members: 5,
      automations: -1,
      email_templates: -1,
      qr_campaigns: -1,
    },
  },
  {
    key: "agency",
    name: "Agency",
    price: 249,
    interval: "month" as const,
    tagline: "For teams & agencies",
    popular: false,
    features: [
      "Everything in Business",
      "White-label cards",
      "Team management (up to 20)",
      "Shared CRM",
      "Advanced analytics",
      "API access",
    ],
    limits: {
      contacts: -1,
      cards: -1,
      booking_services: -1,
      team_members: 20,
      automations: -1,
      email_templates: -1,
      qr_campaigns: -1,
    },
  },
] as const;

export type PlanKey = (typeof PLAN_TIERS)[number]["key"];

export interface PlanLimits {
  contacts: number;
  cards: number;
  booking_services: number;
  team_members: number;
  automations: number;
  email_templates: number;
  qr_campaigns: number;
}

export function getPlanByKey(key: string): (typeof PLAN_TIERS)[number] | undefined {
  return PLAN_TIERS.find((p) => p.key === key);
}

export function getPlanLimits(key: string): PlanLimits {
  const plan = getPlanByKey(key);
  if (!plan) {
    // Default to free limits for unknown plans
    return PLAN_TIERS[0].limits;
  }
  return { ...plan.limits };
}

/** Returns true if the limit is reached. -1 means unlimited. */
export function isLimitReached(limit: number, current: number): boolean {
  if (limit === -1) return false;
  return current >= limit;
}

/** Whether this plan shows "Powered by CardPilot" branding */
export function showsBranding(planKey: string): boolean {
  return planKey === "free" || !planKey;
}
