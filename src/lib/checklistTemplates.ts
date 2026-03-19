import {
  Globe, Wrench, Image, FileText, Send, LinkIcon, AtSign,
  UserPlus, CalendarCheck, Scissors, Star, Camera, Home,
  type LucideIcon,
} from "lucide-react";

// ── Types ──

export type ChecklistGroup = "setup" | "share" | "result";

export interface ChecklistStepTemplate {
  key: string;
  label: string;
  tip: string;
  route: string;
  icon: LucideIcon;
  group: ChecklistGroup;
  /** Which data signal determines completion */
  signal:
    | "card_published"
    | "has_services"
    | "has_image"
    | "estimate_sent"
    | "has_views"
    | "has_lead"
    | "has_booking"
    | "has_review";
  order: number;
}

export interface ChecklistMilestone {
  key: string;
  title: string;
  description: string;
}

export interface ProfessionChecklist {
  /** Profession category key or "default" */
  id: string;
  /** Human label */
  label: string;
  /** Headline shown at top of checklist */
  headline: string;
  /** Sub-headline */
  subheadline: string;
  steps: ChecklistStepTemplate[];
  milestones: ChecklistMilestone[];
}

export const GROUP_LABELS: Record<ChecklistGroup, string> = {
  setup: "Set Up Your Card",
  share: "Share & Promote",
  result: "Get Results",
};

// ── Shared step definitions ──

const STEP = {
  card: (o = 1): ChecklistStepTemplate => ({
    key: "card", label: "Publish your card", group: "setup", order: o,
    tip: "Your card must be live before customers can find you.",
    route: "/app/card", icon: Globe, signal: "card_published",
  }),
  services: (o = 2): ChecklistStepTemplate => ({
    key: "services", label: "Add your services", group: "setup", order: o,
    tip: "Add at least one service so customers know what you offer and can book directly.",
    route: "/app/bookings", icon: Wrench, signal: "has_services",
  }),
  image: (o = 3): ChecklistStepTemplate => ({
    key: "image", label: "Upload a photo or logo", group: "setup", order: o,
    tip: "Cards with images get 3× more engagement. Add a profile photo or work sample.",
    route: "/app/card", icon: Image, signal: "has_image",
  }),
  estimate: (o = 4): ChecklistStepTemplate => ({
    key: "estimate", label: "Send your first estimate", group: "setup", order: o,
    tip: "Create and send an estimate to start your revenue workflow.",
    route: "/app/estimates", icon: FileText, signal: "estimate_sent",
  }),
  shareDirect: (o = 5): ChecklistStepTemplate => ({
    key: "share_direct", label: "Send your card to 5 people", group: "share", order: o,
    tip: "Text or email your card link to 5 contacts.",
    route: "/app/card/qr", icon: Send, signal: "has_views",
  }),
  sharePost: (o = 6): ChecklistStepTemplate => ({
    key: "share_post", label: "Post your card link online", group: "share", order: o,
    tip: "Share on Facebook, Instagram, or Nextdoor to reach your local audience.",
    route: "/app/card/qr", icon: LinkIcon, signal: "has_lead",
  }),
  shareBio: (o = 7): ChecklistStepTemplate => ({
    key: "share_bio", label: "Add card link to your social bio", group: "share", order: o,
    tip: "Put your CardPilot link in your Instagram, Facebook, or TikTok bio for ongoing traffic.",
    route: "/app/card/qr", icon: AtSign, signal: "has_lead",
  }),
  lead: (o = 8): ChecklistStepTemplate => ({
    key: "lead", label: "Get your first lead", group: "result", order: o,
    tip: "Once your card is shared, leads will appear in your Contacts automatically.",
    route: "/app/contacts", icon: UserPlus, signal: "has_lead",
  }),
  booking: (o = 9): ChecklistStepTemplate => ({
    key: "booking", label: "Get your first booking", group: "result", order: o,
    tip: "Customers can book directly from your card once services are set up.",
    route: "/app/bookings", icon: CalendarCheck, signal: "has_booking",
  }),
  review: (o = 10): ChecklistStepTemplate => ({
    key: "review", label: "Get your first review", group: "result", order: o,
    tip: "Reviews build trust — ask a happy customer to leave one on your card.",
    route: "/app/reviews", icon: Star, signal: "has_review",
  }),
};

// ── Shared milestones ──

const COMMON_MILESTONES: ChecklistMilestone[] = [
  { key: "card", title: "🎉 Your card is live!", description: "Customers can now find and contact you." },
  { key: "services", title: "✅ Services added!", description: "Customers can see what you offer." },
  { key: "lead", title: "🎉 First lead captured!", description: "Your marketing is working. Keep sharing!" },
  { key: "booking", title: "🎊 First booking!", description: "Your first customer booked through CardPilot." },
  { key: "review", title: "⭐ First review!", description: "Social proof makes you stand out." },
];

// ── Profession-specific templates ──

const contractorChecklist: ProfessionChecklist = {
  id: "contractor",
  label: "Contractor",
  headline: "Get Your First Job",
  subheadline: "Complete these steps to land your first job within 48 hours.",
  steps: [
    STEP.card(1),
    STEP.services(2),
    STEP.image(3),
    { ...STEP.estimate(4), tip: "Create and send an estimate to start your revenue workflow. Most contractors close their first job within a week." },
    STEP.shareDirect(5),
    STEP.sharePost(6),
    STEP.shareBio(7),
    STEP.lead(8),
    STEP.booking(9),
  ],
  milestones: [
    ...COMMON_MILESTONES,
    { key: "estimate", title: "📨 First estimate sent!", description: "You're on your way to closing your first job." },
  ],
};

const barberChecklist: ProfessionChecklist = {
  id: "barber",
  label: "Barber / Stylist",
  headline: "Fill Your Chair",
  subheadline: "Get your first booking through your digital card.",
  steps: [
    STEP.card(1),
    { ...STEP.services(2), label: "Add your cuts & styles", tip: "List your haircuts, styles, and prices so clients can book instantly." },
    { ...STEP.image(3), label: "Upload work photos", tip: "Show off your best cuts — clients book barbers based on their portfolio.", icon: Camera },
    STEP.shareDirect(4),
    { ...STEP.sharePost(5), tip: "Post a fresh cut photo with your card link on Instagram or TikTok." },
    STEP.shareBio(6),
    STEP.lead(7),
    STEP.booking(8),
    STEP.review(9),
  ],
  milestones: [
    ...COMMON_MILESTONES,
  ],
};

const realtorChecklist: ProfessionChecklist = {
  id: "realtor",
  label: "Realtor",
  headline: "Get Your First Client",
  subheadline: "Stand out and capture leads with your professional card.",
  steps: [
    STEP.card(1),
    { ...STEP.services(2), label: "Add your specialties", tip: "List buying, selling, rentals, or other services you offer.", icon: Home },
    STEP.image(3),
    { ...STEP.shareDirect(4), tip: "Send your card to past clients, neighbors, and your sphere of influence." },
    { ...STEP.sharePost(5), tip: "Share your card alongside a new listing or market update." },
    STEP.shareBio(6),
    STEP.lead(7),
    STEP.booking(8),
  ],
  milestones: COMMON_MILESTONES,
};

const defaultChecklist: ProfessionChecklist = {
  id: "default",
  label: "Professional",
  headline: "Get Your First Lead",
  subheadline: "Complete these steps to start getting leads within 48 hours.",
  steps: [
    STEP.card(1),
    STEP.services(2),
    STEP.image(3),
    STEP.estimate(4),
    STEP.shareDirect(5),
    STEP.sharePost(6),
    STEP.shareBio(7),
    STEP.lead(8),
    STEP.booking(9),
  ],
  milestones: [
    ...COMMON_MILESTONES,
    { key: "estimate", title: "📨 First estimate sent!", description: "You're on your way to closing your first deal." },
  ],
};

// ── Template registry — add new professions here ──

const CHECKLIST_REGISTRY: Record<string, ProfessionChecklist> = {
  contractor: contractorChecklist,
  barber: barberChecklist,
  realtor: realtorChecklist,
  default: defaultChecklist,
};

// Category-to-template mapping
const CATEGORY_MAP: Record<string, string> = {
  "Home & Trade": "contractor",
  "Automotive Services": "contractor",
  "Beauty & Personal Care": "barber",
  "Sales & Advising": "realtor",
};

// Profession name overrides (more specific than category)
const PROFESSION_MAP: Record<string, string> = {
  "General Contractor": "contractor",
  "Electrician": "contractor",
  "Plumber": "contractor",
  "Landscaper": "contractor",
  "HVAC Technician": "contractor",
  "Roofer": "contractor",
  "Painter": "contractor",
  "Barber": "barber",
  "Hair Stylist": "barber",
  "Nail Technician": "barber",
  "Esthetician": "barber",
  "Realtor": "realtor",
  "Real Estate Agent": "realtor",
  "Mortgage Broker": "realtor",
};

/**
 * Get the checklist template for a given profession.
 * Falls back to category match, then default.
 */
export function getChecklistTemplate(
  professionName?: string | null,
  professionCategory?: string | null
): ProfessionChecklist {
  if (professionName && PROFESSION_MAP[professionName]) {
    return CHECKLIST_REGISTRY[PROFESSION_MAP[professionName]];
  }
  if (professionCategory && CATEGORY_MAP[professionCategory]) {
    return CHECKLIST_REGISTRY[CATEGORY_MAP[professionCategory]];
  }
  return CHECKLIST_REGISTRY.default;
}

/**
 * Get all available checklist template IDs (for admin/future use).
 */
export function getAvailableTemplateIds(): string[] {
  return Object.keys(CHECKLIST_REGISTRY);
}

/**
 * Register a new checklist template at runtime (extensibility without rebuild).
 */
export function registerChecklistTemplate(template: ProfessionChecklist) {
  CHECKLIST_REGISTRY[template.id] = template;
}
