/**
 * Card Template System
 *
 * Templates define the layout, section order, CTA priorities, and visual emphasis
 * for different types of business cards. They are purely data-driven and extensible.
 */

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  style: "Modern" | "Elegant" | "Bold" | "Minimal";
  /** Whether this template requires a paid plan */
  premium?: boolean;
  /** Ordered section IDs with enabled state */
  sections: Array<{ id: string; enabled: boolean }>;
  /** CTA buttons in priority order */
  ctaPriority: string[];
  /** Visual emphasis hints */
  emphasis: {
    heroStyle: "cover" | "split" | "classic" | "hero";
    showGallery: boolean;
    showBooking: boolean;
    showQuote: boolean;
    showTestimonials: boolean;
  };
  /** Preview sample data for template browser */
  preview: {
    tagline: string;
    sampleServices: string[];
    sampleReview: string;
  };
  /** Which profession categories this template is recommended for */
  recommendedFor: string[];
}

// ── Style Presets ──
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  premium?: boolean;
  palette: { primary: string; secondary: string; accent: string; background: string };
  fonts: { primary: string; secondary: string };
  borderRadius: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional with sharp accents",
    palette: { primary: "#2563eb", secondary: "#0f172a", accent: "#14b8a6", background: "#f8fafc" },
    fonts: { primary: "Inter", secondary: "Inter" },
    borderRadius: "12px",
  },
  {
    id: "bold",
    name: "Bold",
    description: "High-contrast and attention-grabbing",
    premium: true,
    palette: { primary: "#dc2626", secondary: "#111827", accent: "#f59e0b", background: "#fff7ed" },
    fonts: { primary: "DM Sans", secondary: "Inter" },
    borderRadius: "16px",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Refined elegance with gold accents",
    premium: true,
    palette: { primary: "#9f1239", secondary: "#3f1d2e", accent: "#d4a017", background: "#fffaf3" },
    fonts: { primary: "Playfair Display", secondary: "Inter" },
    borderRadius: "8px",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Less is more — quiet confidence",
    palette: { primary: "#374151", secondary: "#111827", accent: "#6b7280", background: "#f9fafb" },
    fonts: { primary: "Inter", secondary: "Inter" },
    borderRadius: "10px",
  },
];

export type TemplateCategory =
  | "general"
  | "trades"
  | "real_estate"
  | "beauty_wellness"
  | "creative"
  | "consulting";

export const TEMPLATE_CATEGORIES: Array<{ id: TemplateCategory; label: string }> = [
  { id: "general", label: "All Templates" },
  { id: "trades", label: "Trades" },
  { id: "real_estate", label: "Real Estate" },
  { id: "beauty_wellness", label: "Beauty & Wellness" },
  { id: "creative", label: "Creative Services" },
  { id: "consulting", label: "Consulting" },
];

// ── Template Definitions ──

export const CARD_TEMPLATES: CardTemplate[] = [
  // ── General Templates ──
  {
    id: "modern_professional",
    name: "Pro Business — Growth Engine",
    description: "A polished, conversion-optimized card for any industry. Strong CTA placement, trust signals, and a clean layout that turns visitors into clients.",
    category: "general",
    style: "Modern",
    sections: [
      { id: "hero", enabled: true },
      { id: "about", enabled: true },
      { id: "services", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "gallery", enabled: false },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: true },
    ],
    ctaPriority: ["call", "book", "email"],
    emphasis: {
      heroStyle: "cover",
      showGallery: false,
      showBooking: true,
      showQuote: false,
      showTestimonials: true,
    },
    preview: {
      tagline: "Trusted by hundreds of local customers",
      sampleServices: ["Free Consultation", "Custom Solutions", "Priority Support"],
      sampleReview: "Hands down the most professional service I've experienced. Will absolutely hire again.",
    },
    recommendedFor: ["sales_advising", "legal_finance", "education_services"],
  },
  {
    id: "service_pro",
    name: "Service Pro — Quote Machine",
    description: "Built for service businesses that close deals fast. Quote calculator, instant booking, and before/after galleries front and center.",
    category: "general",
    style: "Modern",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "services", enabled: true },
      { id: "projects", enabled: true },
      { id: "quote_calculator", enabled: true },
      { id: "quote_request", enabled: true },
      { id: "about", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "gallery", enabled: true },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: false },
    ],
    ctaPriority: ["call", "quote", "book"],
    emphasis: {
      heroStyle: "hero",
      showGallery: true,
      showBooking: true,
      showQuote: true,
      showTestimonials: true,
    },
    preview: {
      tagline: "Quality craftsmanship, transparent pricing",
      sampleServices: ["Full Installation", "Emergency Repair", "Annual Maintenance Plan"],
      sampleReview: "Got a detailed quote within minutes. Work was done perfectly and on schedule.",
    },
    recommendedFor: ["home_trade", "automotive_services"],
  },
  {
    id: "portfolio_showcase",
    name: "Creative Portfolio — Visual Impact",
    description: "Gallery-first layout that lets your work do the talking. Large visuals, elegant typography, and seamless booking for creative professionals.",
    category: "creative",
    style: "Elegant",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "gallery", enabled: true },
      { id: "projects", enabled: true },
      { id: "about", enabled: true },
      { id: "services", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: true },
    ],
    ctaPriority: ["book", "quote", "email"],
    emphasis: {
      heroStyle: "cover",
      showGallery: true,
      showBooking: true,
      showQuote: true,
      showTestimonials: true,
    },
    preview: {
      tagline: "Creating moments that last a lifetime",
      sampleServices: ["Wedding Coverage", "Portrait Sessions", "Commercial Shoots"],
      sampleReview: "Absolutely breathtaking work. Every single photo was frame-worthy.",
    },
    recommendedFor: ["creative_media"],
  },
  {
    id: "booking_first",
    name: "Wellness Pro — Appointment Magnet",
    description: "Designed for appointment-based businesses. One-tap booking, service menu, and client reviews positioned to fill your calendar.",
    category: "beauty_wellness",
    style: "Modern",
    sections: [
      { id: "hero", enabled: true },
      { id: "booking", enabled: true },
      { id: "services", enabled: true },
      { id: "gallery", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "about", enabled: true },
      { id: "contact", enabled: false },
      { id: "social", enabled: true },
    ],
    ctaPriority: ["book", "call", "text"],
    emphasis: {
      heroStyle: "split",
      showGallery: true,
      showBooking: true,
      showQuote: false,
      showTestimonials: true,
    },
    preview: {
      tagline: "Your next appointment is one tap away",
      sampleServices: ["Premium Cut & Style", "Color Treatment", "Full Grooming Package"],
      sampleReview: "Best experience I've had. Booking was instant and the service was flawless.",
    },
    recommendedFor: ["beauty_personal_care", "health_wellness"],
  },
  {
    id: "minimal_contact",
    name: "Executive Card — Clean & Direct",
    description: "Minimalist sophistication. Your name, your brand, and one clear call to action. Nothing more, nothing less.",
    category: "general",
    style: "Minimal",
    sections: [
      { id: "hero", enabled: true },
      { id: "about", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: true },
      { id: "services", enabled: false },
      { id: "testimonials", enabled: false },
      { id: "gallery", enabled: false },
      { id: "booking", enabled: false },
    ],
    ctaPriority: ["call", "email", "text"],
    emphasis: {
      heroStyle: "classic",
      showGallery: false,
      showBooking: false,
      showQuote: false,
      showTestimonials: false,
    },
    preview: {
      tagline: "Let's build something together",
      sampleServices: [],
      sampleReview: "",
    },
    recommendedFor: [],
  },

  // ── Profession-Specific Templates ──
  {
    id: "contractor_template",
    name: "Pro Contractor — Lead Generator",
    description: "Purpose-built for contractors who want more jobs. Instant quote calculator, before/after project gallery, and verified reviews that close deals.",
    category: "trades",
    style: "Bold",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "services", enabled: true },
      { id: "projects", enabled: true },
      { id: "quote_calculator", enabled: true },
      { id: "quote_request", enabled: true },
      { id: "gallery", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "about", enabled: true },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: false },
    ],
    ctaPriority: ["call", "quote", "book"],
    emphasis: {
      heroStyle: "hero",
      showGallery: true,
      showBooking: true,
      showQuote: true,
      showTestimonials: true,
    },
    preview: {
      tagline: "Licensed, insured, and ready to build",
      sampleServices: ["Kitchen Renovation", "Basement Finishing", "Custom Deck Build"],
      sampleReview: "Incredible attention to detail. Project came in on time and under budget. Already planning our next one.",
    },
    recommendedFor: ["home_trade"],
  },
  {
    id: "landscaper_template",
    name: "Elite Landscaper — Transformation Showcase",
    description: "Show off stunning outdoor transformations with side-by-side galleries. Built to turn curb appeal into booked contracts.",
    category: "trades",
    style: "Modern",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "projects", enabled: true },
      { id: "gallery", enabled: true },
      { id: "services", enabled: true },
      { id: "quote_calculator", enabled: true },
      { id: "quote_request", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "about", enabled: true },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: false },
    ],
    ctaPriority: ["call", "quote", "book"],
    emphasis: {
      heroStyle: "cover",
      showGallery: true,
      showBooking: true,
      showQuote: true,
      showTestimonials: true,
    },
    preview: {
      tagline: "From vision to reality — your outdoor space transformed",
      sampleServices: ["Complete Landscape Design", "Paver Patios & Walkways", "Seasonal Maintenance Plans"],
      sampleReview: "They completely transformed our backyard. The neighbors keep asking for their number!",
    },
    recommendedFor: ["home_trade"],
  },
  {
    id: "realtor_template",
    name: "Premium Realtor — Client Capture",
    description: "Trust-forward design for real estate professionals. Testimonials, market expertise, and instant scheduling that converts browsers into buyers.",
    category: "real_estate",
    style: "Elegant",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "about", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "services", enabled: true },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: true },
      { id: "gallery", enabled: false },
    ],
    ctaPriority: ["call", "text", "book"],
    emphasis: {
      heroStyle: "split",
      showGallery: false,
      showBooking: true,
      showQuote: false,
      showTestimonials: true,
    },
    preview: {
      tagline: "Your trusted partner in finding the perfect home",
      sampleServices: ["Buyer Representation", "Seller Strategy", "Comparative Market Analysis"],
      sampleReview: "Found us our dream home in under three weeks. Incredible negotiation skills and always available.",
    },
    recommendedFor: ["sales_advising"],
  },
  {
    id: "photographer_template",
    name: "Studio Pro — Visual Storyteller",
    description: "Let your images speak volumes. Full-bleed gallery, elegant presentation, and seamless booking designed for visual artists.",
    category: "creative",
    style: "Elegant",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "gallery", enabled: true },
      { id: "services", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "booking", enabled: true },
      { id: "about", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: true },
    ],
    ctaPriority: ["book", "quote", "email"],
    emphasis: {
      heroStyle: "cover",
      showGallery: true,
      showBooking: true,
      showQuote: true,
      showTestimonials: true,
    },
    preview: {
      tagline: "Every frame tells your story",
      sampleServices: ["Wedding Day Coverage", "Brand Photography", "Family Portraits"],
      sampleReview: "The photos exceeded every expectation. Pure artistry — we'll treasure these forever.",
    },
    recommendedFor: ["creative_media"],
  },
  {
    id: "barber_template",
    name: "Elite Barber — Booking Focused",
    description: "Bold, confident, and built to fill your chair. One-tap booking, style gallery, and 5-star reviews that keep clients coming back.",
    category: "beauty_wellness",
    style: "Bold",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "booking", enabled: true },
      { id: "services", enabled: true },
      { id: "gallery", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "about", enabled: true },
      { id: "social", enabled: true },
      { id: "contact", enabled: false },
    ],
    ctaPriority: ["book", "call", "text"],
    emphasis: {
      heroStyle: "hero",
      showGallery: true,
      showBooking: true,
      showQuote: false,
      showTestimonials: true,
    },
    preview: {
      tagline: "Sharp cuts. Clean fades. Walk out confident.",
      sampleServices: ["Signature Haircut", "Beard Sculpt & Hot Towel", "Premium Grooming Package"],
      sampleReview: "Best barber I've ever had. The attention to detail is unreal. Won't go anywhere else.",
    },
    recommendedFor: ["beauty_personal_care"],
  },

  // ── Additional Premium Templates ──
  {
    id: "consultant_authority",
    name: "Authority Consultant — Trust Builder",
    description: "Credibility-first layout for consultants and coaches. Testimonials, expertise badges, and a frictionless booking flow that positions you as the expert.",
    category: "consulting",
    style: "Elegant",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "about", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "services", enabled: true },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: true },
      { id: "gallery", enabled: false },
    ],
    ctaPriority: ["book", "call", "email"],
    emphasis: {
      heroStyle: "split",
      showGallery: false,
      showBooking: true,
      showQuote: false,
      showTestimonials: true,
    },
    preview: {
      tagline: "Strategic guidance that drives measurable results",
      sampleServices: ["Strategy Session", "Growth Audit", "Executive Coaching"],
      sampleReview: "Doubled our revenue in 6 months following their roadmap. Worth every penny.",
    },
    recommendedFor: ["sales_advising", "education_services"],
  },
  {
    id: "trades_emergency",
    name: "Emergency Pro — Fast Response",
    description: "Urgency-driven design for 24/7 service providers. Giant call button, response time badge, and service area map that converts emergencies into jobs.",
    category: "trades",
    style: "Bold",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "services", enabled: true },
      { id: "about", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "gallery", enabled: true },
      { id: "booking", enabled: true },
      { id: "contact", enabled: true },
      { id: "social", enabled: false },
    ],
    ctaPriority: ["call", "text", "book"],
    emphasis: {
      heroStyle: "hero",
      showGallery: true,
      showBooking: true,
      showQuote: false,
      showTestimonials: true,
    },
    preview: {
      tagline: "Fast response. Fair pricing. Available 24/7.",
      sampleServices: ["Emergency Repair", "Same-Day Service", "Annual Maintenance"],
      sampleReview: "Called at 11pm, they were here in 30 minutes. Lifesaver!",
    },
    recommendedFor: ["home_trade"],
  },
  {
    id: "beauty_luxe",
    name: "Luxe Beauty — Premium Experience",
    description: "High-end aesthetic for beauty professionals. Elegant gallery, premium service menu, and VIP booking that attracts high-value clients.",
    category: "beauty_wellness",
    style: "Elegant",
    premium: true,
    sections: [
      { id: "hero", enabled: true },
      { id: "gallery", enabled: true },
      { id: "services", enabled: true },
      { id: "booking", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "about", enabled: true },
      { id: "social", enabled: true },
      { id: "contact", enabled: false },
    ],
    ctaPriority: ["book", "call", "text"],
    emphasis: {
      heroStyle: "cover",
      showGallery: true,
      showBooking: true,
      showQuote: false,
      showTestimonials: true,
    },
    preview: {
      tagline: "Elevate your beauty experience",
      sampleServices: ["Signature Facial", "Lash Extensions", "Bridal Package"],
      sampleReview: "The most luxurious experience. I felt like a celebrity. Already rebooked!",
    },
    recommendedFor: ["beauty_personal_care", "health_wellness"],
  },
];

// ── Recommendation Engine ──

/**
 * Given a profession category key, return templates sorted by relevance.
 * Best-fit templates appear first.
 */
export function getRecommendedTemplates(categoryKey?: string): CardTemplate[] {
  if (!categoryKey) return CARD_TEMPLATES;

  return [...CARD_TEMPLATES].sort((a, b) => {
    const aMatch = a.recommendedFor.includes(categoryKey) ? 1 : 0;
    const bMatch = b.recommendedFor.includes(categoryKey) ? 1 : 0;
    return bMatch - aMatch;
  });
}

/**
 * Map profession name to a single best-fit template ID.
 */
const PROFESSION_TEMPLATE_MAP: Record<string, string> = {
  contractor: "contractor_template",
  "general contractor": "contractor_template",
  plumber: "service_pro",
  electrician: "service_pro",
  hvac: "service_pro",
  roofer: "contractor_template",
  painter: "contractor_template",
  handyman: "service_pro",
  landscaper: "landscaper_template",
  carpenter: "contractor_template",
  cleaner: "service_pro",
  "pressure washer": "service_pro",
  realtor: "realtor_template",
  "real estate agent": "realtor_template",
  "insurance agent": "modern_professional",
  "financial advisor": "modern_professional",
  photographer: "photographer_template",
  videographer: "photographer_template",
  designer: "portfolio_showcase",
  artist: "portfolio_showcase",
  dj: "portfolio_showcase",
  barber: "barber_template",
  stylist: "booking_first",
  "hair stylist": "booking_first",
  esthetician: "booking_first",
  "nail tech": "booking_first",
  "massage therapist": "booking_first",
  "personal trainer": "booking_first",
  "yoga instructor": "booking_first",
  therapist: "booking_first",
  consultant: "consultant_authority",
  coach: "consultant_authority",
  tutor: "modern_professional",
  chef: "portfolio_showcase",
  caterer: "service_pro",
  "event planner": "portfolio_showcase",
  florist: "portfolio_showcase",
  baker: "portfolio_showcase",
  "wedding planner": "portfolio_showcase",
  mechanic: "trades_emergency",
  "auto detailer": "service_pro",
  esthetician: "beauty_luxe",
  "nail tech": "beauty_luxe",
  "lash tech": "beauty_luxe",
  "makeup artist": "beauty_luxe",
};

/**
 * Get the best template for a specific profession name.
 */
export function getBestTemplateForProfession(professionName?: string): string {
  if (!professionName) return "modern_professional";
  const lower = professionName.toLowerCase();

  // Exact match
  if (PROFESSION_TEMPLATE_MAP[lower]) return PROFESSION_TEMPLATE_MAP[lower];

  // Partial match
  for (const [key, templateId] of Object.entries(PROFESSION_TEMPLATE_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return templateId;
  }

  return "modern_professional";
}

/**
 * Get a template by ID.
 */
export function getTemplate(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find(t => t.id === id);
}
