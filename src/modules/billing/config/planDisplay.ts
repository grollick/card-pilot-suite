import { getPlanLimits } from "@/lib/plans";
import { tierName, tierOf, tierPrice } from "@/lib/planTiers";
import { PLAN_CONFIGS } from "./planLimits";

type ComparisonValue = boolean | string;

export interface DisplayFeature {
  key: string;
  label: string;
  bullet: string;
  value: ComparisonValue;
}

export interface DisplayPlan {
  key: string;
  name: string;
  price: number;
  tagline: string;
  status: "available" | "coming_soon";
  highlighted: boolean;
  features: DisplayFeature[];
}

const formatLimit = (limit: number) => limit === -1 ? "Unlimited" : String(limit);

// Capacity and branding values come from enforcement, not a separate marketing limit list.
export const PLAN_DISPLAY: DisplayPlan[] = [
  {
    key: "free",
    name: tierName("free"),
    price: tierPrice(tierOf("free")),
    tagline: "Create your card and start capturing leads",
    status: "available",
    highlighted: false,
    features: [
      { key: "card", label: "Digital business card", bullet: "Your own digital business card", value: true },
      { key: "sharing", label: "QR and link sharing", bullet: "Share with a QR code or a link", value: true },
      { key: "capture", label: "Lead capture", bullet: "Capture customer details from your card", value: true },
      { key: "booking", label: "Bookings per month", bullet: `Up to ${PLAN_CONFIGS.free.limits.bookingsPerMonth} bookings per month`, value: formatLimit(PLAN_CONFIGS.free.limits.bookingsPerMonth) },
      { key: "services", label: "Services listed", bullet: `List up to ${PLAN_CONFIGS.free.limits.services} services`, value: formatLimit(PLAN_CONFIGS.free.limits.services) },
      { key: "contacts", label: "Contacts", bullet: `Keep up to ${PLAN_CONFIGS.free.limits.contacts} contacts`, value: formatLimit(PLAN_CONFIGS.free.limits.contacts) },
      { key: "scanner", label: "Business card scanner", bullet: "Scan a business card to save a contact", value: true },
    ],
  },
  {
    key: "growth",
    name: tierName("growth"),
    price: tierPrice(tierOf("growth")),
    tagline: "More room for your services and customers",
    status: "coming_soon",
    highlighted: true,
    features: [
      { key: "card", label: "Digital business card", bullet: "Your own digital business card", value: true },
      { key: "sharing", label: "QR and link sharing", bullet: "Share with a QR code or a link", value: true },
      { key: "capture", label: "Lead capture", bullet: "Capture customer details from your card", value: true },
      { key: "booking", label: "Bookings per month", bullet: "Unlimited bookings", value: formatLimit(PLAN_CONFIGS.growth.limits.bookingsPerMonth) },
      { key: "services", label: "Services listed", bullet: "List every service you offer", value: formatLimit(PLAN_CONFIGS.growth.limits.services) },
      { key: "contacts", label: "Contacts", bullet: "Unlimited contacts", value: formatLimit(PLAN_CONFIGS.growth.limits.contacts) },
      { key: "scanner", label: "Business card scanner", bullet: "Scan a business card to save a contact", value: true },
      { key: "branding", label: "Remove guzzl.pro branding", bullet: "Remove guzzl.pro branding from your card", value: PLAN_CONFIGS.growth.features.removeBranding },
      { key: "estimates", label: "Estimates and invoices", bullet: "Create and send estimates and invoices", value: true },
      { key: "pipeline", label: "CRM pipeline", bullet: "Track customers from first call to invoice", value: true },
      { key: "email", label: "Email campaigns", bullet: "Email offers and reminders to past customers", value: true },
      { key: "followups", label: "Email follow-ups", bullet: "Set up email follow-up sequences", value: true },
      { key: "promotions", label: "Promotion banners", bullet: "Run deals and specials on your card", value: true },
      { key: "analytics", label: "Card analytics", bullet: "See card views and clicks", value: PLAN_CONFIGS.growth.features.analytics },
    ],
  },
  {
    key: "pro",
    name: tierName("pro"),
    price: tierPrice(tierOf("pro")),
    tagline: "A closer look at your business",
    status: "coming_soon",
    highlighted: false,
    features: [
      { key: "card", label: "Digital business card", bullet: "Your own digital business card", value: true },
      { key: "sharing", label: "QR and link sharing", bullet: "Share with a QR code or a link", value: true },
      { key: "capture", label: "Lead capture", bullet: "Capture customer details from your card", value: true },
      { key: "booking", label: "Bookings per month", bullet: "Unlimited bookings", value: formatLimit(PLAN_CONFIGS.pro.limits.bookingsPerMonth) },
      { key: "services", label: "Services listed", bullet: "List every service you offer", value: formatLimit(PLAN_CONFIGS.pro.limits.services) },
      { key: "contacts", label: "Contacts", bullet: "Unlimited contacts", value: formatLimit(PLAN_CONFIGS.pro.limits.contacts) },
      { key: "scanner", label: "Business card scanner", bullet: "Scan a business card to save a contact", value: true },
      { key: "branding", label: "Remove guzzl.pro branding", bullet: "Remove guzzl.pro branding from your card", value: PLAN_CONFIGS.pro.features.removeBranding },
      { key: "estimates", label: "Estimates and invoices", bullet: "Create and send estimates and invoices", value: true },
      { key: "pipeline", label: "CRM pipeline", bullet: "Track customers from first call to invoice", value: true },
      { key: "email", label: "Email campaigns", bullet: "Email offers and reminders to past customers", value: true },
      { key: "followups", label: "Email follow-ups", bullet: "Set up email follow-up sequences", value: true },
      { key: "promotions", label: "Promotion banners", bullet: "Run deals and specials on your card", value: true },
      { key: "analytics", label: "Card analytics", bullet: "See card views and clicks", value: PLAN_CONFIGS.pro.features.analytics },
      { key: "forecast", label: "Monthly work trends", bullet: "See which months bring the most work", value: true },
      { key: "team", label: "Team accounts", bullet: "Add your crew to your workspace", value: true },
    ],
  },
  {
    key: "agency",
    name: tierName("agency"),
    price: tierPrice("agency"),
    tagline: "More room for your clients and crew",
    status: "coming_soon",
    highlighted: false,
    features: [],
  },
];
// Agency includes all Ultra features, with capacity values taken from its enforcement config.
const agency = PLAN_DISPLAY[3];
agency.features = PLAN_DISPLAY[2].features.map(feature => ({ ...feature,
  value: feature.key === "services" ? formatLimit(PLAN_CONFIGS.agency.limits.services)
    : feature.key === "booking" ? formatLimit(PLAN_CONFIGS.agency.limits.bookingsPerMonth)
    : feature.key === "contacts" ? formatLimit(PLAN_CONFIGS.agency.limits.contacts)
    : feature.key === "branding" ? PLAN_CONFIGS.agency.features.removeBranding : feature.value,
}));

// Quantities and gated capabilities are read from enforcement for every pricing column.
for (const plan of PLAN_DISPLAY) {
  const config = PLAN_CONFIGS[plan.key];
  const limits = getPlanLimits(plan.key);
  const ai = formatLimit(limits.ai_requests_monthly);
  const team = formatLimit(limits.team_members);
  plan.features = plan.features.filter(feature => feature.key !== "team");
  plan.features.push(
    { key: "ai", label: "AI requests per month", bullet: `${ai} AI requests per month`, value: ai },
    { key: "team", label: "Team members", bullet: `${team} team member${team === "1" ? "" : "s"}`, value: team },
    { key: "advancedAnalytics", label: "Advanced analytics", bullet: "Advanced analytics", value: config.features.advancedAnalytics },
    { key: "onlinePayments", label: "Online invoice payments", bullet: "Let customers pay through your own payment links", value: config.features.online_invoice_payments },
  );
}

export const PLAN_COMPARISON = Array.from(
  new Map(PLAN_DISPLAY.flatMap(plan => plan.features.map(feature => [feature.key, { key: feature.key, label: feature.label }] as const))).values(),
).map(feature => ({
  ...feature,
  values: PLAN_DISPLAY.map(plan => plan.features.find(item => item.key === feature.key)?.value ?? false),
}));