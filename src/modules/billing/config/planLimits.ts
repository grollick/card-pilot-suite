import { Rocket, Eye, Sparkles, Zap, Star, TrendingUp, Users, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PlanConfig {
  key: string;
  label: string;
  limits: {
    services: number;        // -1 = unlimited
    bookingsPerMonth: number; // -1 = unlimited
    contacts: number;         // -1 = unlimited
  };
  features: {
    removeBranding: boolean;
    analytics: boolean;
    advancedAnalytics: boolean;
    reviewTools: boolean;
    featuredPlacement: boolean;
    premiumBadge: boolean;
    multipleServiceAreas: boolean;
    leadManagement: boolean;
    advancedLeadManagement: boolean;
  };
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    key: "free",
    label: "Free",
    limits: { services: 3, bookingsPerMonth: 200, contacts: 100 },
    features: {
      removeBranding: false,
      analytics: false,
      advancedAnalytics: false,
      reviewTools: false,
      featuredPlacement: false,
      premiumBadge: false,
      multipleServiceAreas: false,
      leadManagement: false,
      advancedLeadManagement: false,
    },
  },
  starter: {
    key: "starter",
    label: "Free",
    limits: { services: 3, bookingsPerMonth: 200, contacts: 100 },
    features: {
      removeBranding: false,
      analytics: false,
      advancedAnalytics: false,
      reviewTools: false,
      featuredPlacement: false,
      premiumBadge: false,
      multipleServiceAreas: false,
      leadManagement: false,
      advancedLeadManagement: false,
    },
  },
  pro: {
    key: "pro",
    label: "Pro",
    limits: { services: -1, bookingsPerMonth: -1, contacts: -1 },
    features: {
      removeBranding: true,
      analytics: true,
      advancedAnalytics: false,
      reviewTools: true,
      featuredPlacement: false,
      premiumBadge: false,
      multipleServiceAreas: false,
      leadManagement: true,
      advancedLeadManagement: false,
    },
  },
  growth: {
    key: "growth",
    label: "Growth",
    limits: { services: -1, bookingsPerMonth: -1, contacts: -1 },
    features: {
      removeBranding: true,
      analytics: true,
      advancedAnalytics: true,
      reviewTools: true,
      featuredPlacement: true,
      premiumBadge: true,
      multipleServiceAreas: true,
      leadManagement: true,
      advancedLeadManagement: true,
    },
  },
  pro_plus: {
    key: "pro_plus",
    label: "Growth",
    limits: { services: -1, bookingsPerMonth: -1, contacts: -1 },
    features: {
      removeBranding: true,
      analytics: true,
      advancedAnalytics: true,
      reviewTools: true,
      featuredPlacement: true,
      premiumBadge: true,
      multipleServiceAreas: true,
      leadManagement: true,
      advancedLeadManagement: true,
    },
  },
};

export type UpgradeTrigger = "service_limit" | "booking_limit" | "branding" | "visibility" | "analytics" | "reviews" | "lead_management" | "generic";

export interface UpgradeScenario {
  trigger: UpgradeTrigger;
  icon: LucideIcon;
  headline: string;
  message: string;
  bullets: string[];
  suggestedPlan: string;
}

export const UPGRADE_SCENARIOS: Record<UpgradeTrigger, UpgradeScenario> = {
  service_limit: {
    trigger: "service_limit",
    icon: Zap,
    headline: "You've reached your service limit",
    message: "Upgrade to add more services and capture more types of work from your customers.",
    bullets: [
      "List unlimited services on your profile",
      "Reach more customers searching for what you offer",
      "One extra service listing can bring in $500+/month",
    ],
    suggestedPlan: "pro",
  },
  booking_limit: {
    trigger: "booking_limit",
    icon: Users,
    headline: "You're getting booked — great problem to have",
    message: "Upgrade to unlock unlimited bookings and never miss an appointment.",
    bullets: [
      "Accept unlimited bookings every month",
      "Never turn away a paying customer",
      "Automated reminders reduce no-shows by 40%",
    ],
    suggestedPlan: "pro",
  },
  branding: {
    trigger: "branding",
    icon: Shield,
    headline: "Look more professional",
    message: "Remove guzzl branding and present your business on your own terms.",
    bullets: [
      "Remove \"Powered by guzzl\" from your card",
      "Build trust with a clean, professional look",
      "Customers take you more seriously — and pay more",
    ],
    suggestedPlan: "pro",
  },
  visibility: {
    trigger: "visibility",
    icon: Eye,
    headline: "Get seen by more customers",
    message: "Featured placement puts you at the top of local search results.",
    bullets: [
      "Appear first in marketplace search results",
      "Premium badge builds instant trust",
      "Featured providers get 3x more leads on average",
    ],
    suggestedPlan: "growth",
  },
  analytics: {
    trigger: "analytics",
    icon: TrendingUp,
    headline: "Know what's working",
    message: "Unlock analytics to see which services drive the most revenue.",
    bullets: [
      "Track profile views, leads, and bookings",
      "See your conversion rate over time",
      "Make data-driven decisions to grow faster",
    ],
    suggestedPlan: "pro",
  },
  reviews: {
    trigger: "reviews",
    icon: Star,
    headline: "Build your reputation",
    message: "Unlock review tools to collect and showcase customer feedback.",
    bullets: [
      "Send automated review requests after jobs",
      "Display verified reviews on your profile",
      "Businesses with 5+ reviews get 2x more bookings",
    ],
    suggestedPlan: "pro",
  },
  lead_management: {
    trigger: "lead_management",
    icon: Sparkles,
    headline: "Never lose a lead again",
    message: "Upgrade for better lead management and automated follow-ups.",
    bullets: [
      "Automated follow-up sequences",
      "Lead scoring to prioritize hot prospects",
      "Pipeline view to track every opportunity",
    ],
    suggestedPlan: "pro",
  },
  generic: {
    trigger: "generic",
    icon: Rocket,
    headline: "Ready to grow your business?",
    message: "Upgrade to unlock powerful tools that help you get more customers and make more money.",
    bullets: [
      "Unlimited services and bookings",
      "Professional branding and analytics",
      "Automated lead follow-ups that close deals",
    ],
    suggestedPlan: "pro",
  },
};

export function getPlanConfig(planKey: string): PlanConfig {
  return PLAN_CONFIGS[planKey] ?? PLAN_CONFIGS.free;
}

export function getNextPlan(currentPlan: string): string {
  if (currentPlan === "free" || currentPlan === "starter") return "pro";
  if (currentPlan === "pro") return "growth";
  return currentPlan;
}
