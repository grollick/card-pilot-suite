import { tierOf, tierName, tierPrice } from "./planTiers";
import { PLAN_CONFIGS } from "@/modules/billing/config/planLimits";
// ── guzzl.pro Pricing Tiers ──
// Stored keys remain starter → growth → pro → agency; resolve aliases through tierOf.

export const PLAN_TIERS = [
  {
    key: "starter",
    name: tierName("starter"),
    price: tierPrice(tierOf("starter")),
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
      "Basic before/after gallery (3 projects)",
      "2 review requests per month",
    ],
    limits: {
      contacts: PLAN_CONFIGS.free.limits.contacts,
      cards: 1,
      estimates: 3,
      invoices: 3,
      social_posts: 5,
      social_posts_monthly: 3,
      booking_services: 3,
      bookings_monthly: PLAN_CONFIGS.free.limits.bookingsPerMonth,
      team_members: 1,
      automations: 0,
      email_templates: 0,
      qr_campaigns: 0,
      gallery_images: 3,
      testimonials: 2,
      ai_requests_monthly: 5,
      before_after_projects: 3,
      review_requests_monthly: 2,
      social_platforms_max: 1,
      pdf_export: false,
      estimate_approvals: false,
      payments: false,
      deposits: false,
      recurring_invoices: false,
      advanced_reporting: false,
      premium_templates: false,
      whatsapp_chat: false,
      sms_chat: false,
      loyalty_program: false,
      team_cards: false,
      google_business_sync: false,
      expense_tracker: false,
      video_intro: false,
      social_scheduling: false,
      social_ai_tools: false,
      social_analytics: false,
      social_content_feed: false,
      social_dfy: false,
    },
  },
  {
    key: "growth",
    name: tierName("growth"),
    price: tierPrice(tierOf("growth")),
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
      "Unlimited before/after gallery",
      "Automated review collection",
      "WhatsApp & SMS quick chat",
      "Client loyalty program",
      "Video introduction on card",
    ],
    limits: {
      contacts: -1,
      cards: 2,
      estimates: -1,
      invoices: -1,
      social_posts: -1,
      social_posts_monthly: 30,
      booking_services: -1,
      bookings_monthly: -1,
      team_members: 1,
      automations: 5,
      email_templates: -1,
      qr_campaigns: 3,
      gallery_images: -1,
      testimonials: -1,
      ai_requests_monthly: 50,
      before_after_projects: -1,
      review_requests_monthly: -1,
      social_platforms_max: -1,
      pdf_export: true,
      estimate_approvals: true,
      payments: false,
      deposits: false,
      recurring_invoices: false,
      advanced_reporting: false,
      premium_templates: true,
      whatsapp_chat: true,
      sms_chat: true,
      loyalty_program: true,
      team_cards: false,
      google_business_sync: false,
      expense_tracker: false,
      video_intro: true,
      social_scheduling: true,
      social_ai_tools: true,
      social_analytics: true,
      social_content_feed: true,
      social_dfy: false,
    },
  },
  {
    key: "pro",
    name: tierName("pro"),
    price: tierPrice(tierOf("pro")),
    interval: "month" as const,
    tagline: "Scale with AI, payments, and team tools",
    popular: false,
    features: [
      "Everything in Pro, plus:",
      "Accept online payments",
      "AI-powered business assistant",
      "Revenue forecasting & insights",
      "Team member cards",
      "Google Business Profile sync",
      "Expense tracker",
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
      social_posts_monthly: -1,
      booking_services: -1,
      bookings_monthly: -1,
      team_members: 3,
      automations: -1,
      email_templates: -1,
      qr_campaigns: -1,
      gallery_images: -1,
      testimonials: -1,
      ai_requests_monthly: 500,
      before_after_projects: -1,
      review_requests_monthly: -1,
      social_platforms_max: -1,
      pdf_export: true,
      estimate_approvals: true,
      payments: true,
      deposits: true,
      recurring_invoices: true,
      advanced_reporting: true,
      premium_templates: true,
      whatsapp_chat: true,
      sms_chat: true,
      loyalty_program: true,
      team_cards: true,
      google_business_sync: true,
      expense_tracker: true,
      video_intro: true,
      social_scheduling: true,
      social_ai_tools: true,
      social_analytics: true,
      social_content_feed: true,
      social_dfy: true,
    },
  },
  {
    key: "agency",
    name: tierName("agency"),
    price: tierPrice(tierOf("agency")),
    interval: "month" as const,
    tagline: "Manage multiple clients at scale",
    popular: false,
    features: [
      "Everything in Ultra, plus:",
      "Unlimited client workspaces",
      "Unlimited team cards",
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
      social_posts_monthly: -1,
      booking_services: -1,
      bookings_monthly: -1,
      team_members: -1,
      automations: -1,
      email_templates: -1,
      qr_campaigns: -1,
      gallery_images: -1,
      testimonials: -1,
      ai_requests_monthly: -1,
      before_after_projects: -1,
      review_requests_monthly: -1,
      social_platforms_max: -1,
      pdf_export: true,
      estimate_approvals: true,
      payments: true,
      deposits: true,
      recurring_invoices: true,
      advanced_reporting: true,
      premium_templates: true,
      whatsapp_chat: true,
      sms_chat: true,
      loyalty_program: true,
      team_cards: true,
      google_business_sync: true,
      expense_tracker: true,
      video_intro: true,
      social_scheduling: true,
      social_ai_tools: true,
      social_analytics: true,
      social_content_feed: true,
      social_dfy: true,
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
  social_posts_monthly: number;
  booking_services: number;
  bookings_monthly: number;
  team_members: number;
  automations: number;
  email_templates: number;
  qr_campaigns: number;
  gallery_images: number;
  testimonials: number;
  ai_requests_monthly: number;
  before_after_projects: number;
  review_requests_monthly: number;
  social_platforms_max: number;
  pdf_export: boolean;
  estimate_approvals: boolean;
  payments: boolean;
  deposits: boolean;
  recurring_invoices: boolean;
  advanced_reporting: boolean;
  premium_templates: boolean;
  whatsapp_chat: boolean;
  sms_chat: boolean;
  loyalty_program: boolean;
  team_cards: boolean;
  google_business_sync: boolean;
  expense_tracker: boolean;
  video_intro: boolean;
  social_scheduling: boolean;
  social_ai_tools: boolean;
  social_analytics: boolean;
  social_content_feed: boolean;
  social_dfy: boolean;
}

export function getPlanByKey(key: string): (typeof PLAN_TIERS)[number] | undefined {
  return PLAN_TIERS.find((p) => tierOf(p.key) === tierOf(key));
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
export const AI_LIMITS: Record<string, number> = new Proxy(
  Object.fromEntries(["free", "starter", "growth", "pro", "pro_plus", "business", "agency"].map(key => [key, getPlanLimits(key).ai_requests_monthly])),
  { get: (limits, key) => typeof key === "string" ? limits[key] ?? getPlanLimits(key).ai_requests_monthly : undefined },
);

/** Whether this plan shows "Powered by guzzl.pro" branding */
export function showsBranding(planKey: string): boolean {
  return tierOf(planKey) === "free";
}

/** Returns the next tier up from the current plan, or null if already at top */
export function getNextTier(currentKey: string): (typeof PLAN_TIERS)[number] | null {
  const idx = PLAN_TIERS.findIndex((p) => tierOf(p.key) === tierOf(currentKey));
  if (idx === -1 || idx >= PLAN_TIERS.length - 1) return null;
  return PLAN_TIERS[idx + 1];
}
