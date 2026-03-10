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
    name: "Modern Professional",
    description: "Clean and versatile. Works for any industry with a balanced layout.",
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
      tagline: "Professional services you can trust",
      sampleServices: ["Consultation", "Assessment", "Follow-Up"],
      sampleReview: "Excellent service and very professional!",
    },
    recommendedFor: ["sales_advising", "legal_finance", "education_services"],
  },
  {
    id: "service_pro",
    name: "Service Pro",
    description: "Optimized for service businesses. Quote requests and booking front and center.",
    category: "general",
    style: "Modern",
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
      tagline: "Quality work, fair prices",
      sampleServices: ["Installation", "Repair", "Maintenance"],
      sampleReview: "Great work and completed on time. Highly recommend!",
    },
    recommendedFor: ["home_trade", "automotive_services"],
  },
  {
    id: "portfolio_showcase",
    name: "Portfolio Showcase",
    description: "Gallery-first layout. Perfect for visual professionals.",
    category: "creative",
    style: "Elegant",
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
      tagline: "Creating moments that last forever",
      sampleServices: ["Photography", "Editing", "Albums"],
      sampleReview: "Absolutely stunning work. Captured every moment beautifully.",
    },
    recommendedFor: ["creative_media"],
  },
  {
    id: "booking_first",
    name: "Booking First",
    description: "Booking is the star. Ideal for appointment-based businesses.",
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
      tagline: "Book your appointment in seconds",
      sampleServices: ["Haircut", "Color", "Styling"],
      sampleReview: "Best salon experience I've ever had. Booking was so easy!",
    },
    recommendedFor: ["beauty_personal_care", "health_wellness"],
  },
  {
    id: "minimal_contact",
    name: "Minimal Contact",
    description: "Simple and elegant. Just the essentials — name, info, and a CTA.",
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
      tagline: "Let's connect",
      sampleServices: [],
      sampleReview: "",
    },
    recommendedFor: [],
  },

  // ── Profession-Specific Templates ──
  {
    id: "contractor_template",
    name: "Contractor Pro",
    description: "Built for contractors. Quotes, gallery of past work, and reviews.",
    category: "trades",
    style: "Bold",
    sections: [
      { id: "hero", enabled: true },
      { id: "services", enabled: true },
      { id: "projects", enabled: true },
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
      tagline: "Built right, built to last",
      sampleServices: ["Renovation", "New Build", "Repairs"],
      sampleReview: "Top-notch craftsmanship. The team was professional from start to finish.",
    },
    recommendedFor: ["home_trade"],
  },
  {
    id: "landscaper_template",
    name: "Landscaper Pro",
    description: "Showcase your outdoor transformations with before/after galleries.",
    category: "trades",
    style: "Modern",
    sections: [
      { id: "hero", enabled: true },
      { id: "projects", enabled: true },
      { id: "gallery", enabled: true },
      { id: "services", enabled: true },
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
      tagline: "Transform your outdoor space",
      sampleServices: ["Lawn Care", "Hardscaping", "Garden Design"],
      sampleReview: "Our yard has never looked better. Amazing transformation!",
    },
    recommendedFor: ["home_trade"],
  },
  {
    id: "realtor_template",
    name: "Realtor Card",
    description: "Designed for real estate agents. Contact-forward with trust signals.",
    category: "real_estate",
    style: "Elegant",
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
      tagline: "Your trusted real estate partner",
      sampleServices: ["Home Buying", "Home Selling", "Market Analysis"],
      sampleReview: "Found us our dream home in just two weeks. Incredible agent!",
    },
    recommendedFor: ["sales_advising"],
  },
  {
    id: "photographer_template",
    name: "Photographer Card",
    description: "Visual-first with large gallery. Let your work speak for itself.",
    category: "creative",
    style: "Elegant",
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
      tagline: "Every moment tells a story",
      sampleServices: ["Wedding", "Portrait", "Commercial"],
      sampleReview: "The photos exceeded every expectation. True artistry!",
    },
    recommendedFor: ["creative_media"],
  },
  {
    id: "barber_template",
    name: "Barber Card",
    description: "Book-first with style gallery. Clean and bold.",
    category: "beauty_wellness",
    style: "Bold",
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
      tagline: "Fresh cuts, sharp style",
      sampleServices: ["Haircut", "Beard Trim", "Hot Towel Shave"],
      sampleReview: "Best barber in town. Always leave looking great!",
    },
    recommendedFor: ["beauty_personal_care"],
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
  consultant: "modern_professional",
  coach: "modern_professional",
  tutor: "modern_professional",
  chef: "portfolio_showcase",
  caterer: "service_pro",
  "event planner": "portfolio_showcase",
  florist: "portfolio_showcase",
  baker: "portfolio_showcase",
  "wedding planner": "portfolio_showcase",
  mechanic: "service_pro",
  "auto detailer": "service_pro",
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
