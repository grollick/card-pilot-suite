// ── Block Marketplace Catalog ──
// Static catalog of installable card builder blocks

import type { LucideIcon } from "lucide-react";

export type BlockCategory =
  | "conversion"
  | "media"
  | "trust"
  | "contact"
  | "business";

export interface MarketplaceBlock {
  id: string;
  name: string;
  description: string;
  category: BlockCategory;
  icon: string; // lucide icon name
  preview?: string; // short example text
  isPremium: boolean;
  requiredPlan: "starter" | "growth" | "pro" | "agency";
  tags: string[];
  defaultContent: Record<string, any>;
}

export const BLOCK_CATEGORIES: { id: BlockCategory; label: string; icon: string }[] = [
  { id: "conversion", label: "Conversion", icon: "Target" },
  { id: "media", label: "Media", icon: "Play" },
  { id: "trust", label: "Trust", icon: "Shield" },
  { id: "contact", label: "Contact", icon: "MessageCircle" },
  { id: "business", label: "Business Tools", icon: "Briefcase" },
];

export const MARKETPLACE_BLOCKS: MarketplaceBlock[] = [
  // ── Conversion Blocks ──
  {
    id: "faq",
    name: "FAQ Section",
    description: "Answer common questions to reduce friction and boost conversions.",
    category: "conversion",
    icon: "HelpCircle",
    preview: "Q: How long does a typical project take? A: Most projects are completed within 2–4 weeks.",
    isPremium: false,
    requiredPlan: "starter",
    tags: ["questions", "answers", "support"],
    defaultContent: {
      items: [
        { question: "How long does a typical project take?", answer: "Most projects are completed within 2–4 weeks depending on scope." },
        { question: "Do you offer free estimates?", answer: "Yes! Contact us for a free, no-obligation estimate." },
        { question: "What areas do you serve?", answer: "We serve the greater metro area and surrounding communities." },
      ],
    },
  },
  {
    id: "offer_banner",
    name: "Offer Banner",
    description: "Highlight a limited-time promotion or seasonal discount.",
    category: "conversion",
    icon: "BadgePercent",
    preview: "🔥 20% off all services this month — Book now!",
    isPremium: false,
    requiredPlan: "starter",
    tags: ["promotion", "discount", "urgency"],
    defaultContent: {
      headline: "Limited Time Offer",
      body: "20% off all services this month",
      cta_text: "Claim Offer",
      cta_url: "",
      bg_color: "",
    },
  },
  {
    id: "countdown_timer",
    name: "Countdown Timer",
    description: "Create urgency with a countdown to a deadline or event.",
    category: "conversion",
    icon: "Timer",
    preview: "Offer ends in 3d 12h 45m",
    isPremium: false,
    requiredPlan: "growth",
    tags: ["urgency", "timer", "deadline"],
    defaultContent: {
      end_date: "",
      label: "Offer ends in",
      expired_text: "This offer has ended.",
    },
  },
  {
    id: "animated_cta",
    name: "Animated CTA Banner",
    description: "Eye-catching animated call-to-action with motion effects.",
    category: "conversion",
    icon: "Zap",
    isPremium: true,
    requiredPlan: "pro",
    tags: ["animation", "call-to-action", "premium"],
    defaultContent: {
      headline: "Ready to get started?",
      subtext: "Book your free consultation today",
      cta_text: "Get Started",
      animation: "pulse",
    },
  },

  // ── Media Blocks ──
  {
    id: "video_embed",
    name: "Video Embed",
    description: "Embed a YouTube or Vimeo video to showcase your work.",
    category: "media",
    icon: "Play",
    preview: "Embed your project walkthrough or intro video",
    isPremium: false,
    requiredPlan: "starter",
    tags: ["video", "youtube", "vimeo"],
    defaultContent: {
      video_url: "",
      caption: "",
      autoplay: false,
    },
  },
  {
    id: "before_after",
    name: "Before / After Slider",
    description: "Interactive slider showing transformation results.",
    category: "media",
    icon: "Columns",
    preview: "Drag to compare before and after",
    isPremium: false,
    requiredPlan: "starter",
    tags: ["comparison", "slider", "transformation"],
    defaultContent: {
      pairs: [
        { before_url: "", after_url: "", caption: "Project transformation" },
      ],
    },
  },
  {
    id: "instagram_feed",
    name: "Instagram Feed",
    description: "Display your latest Instagram posts to build social proof.",
    category: "media",
    icon: "Instagram",
    isPremium: true,
    requiredPlan: "pro",
    tags: ["social", "instagram", "feed"],
    defaultContent: {
      username: "",
      post_count: 6,
    },
  },
  {
    id: "advanced_gallery",
    name: "Advanced Gallery",
    description: "Masonry layout gallery with lightbox, filters, and categories.",
    category: "media",
    icon: "LayoutGrid",
    isPremium: true,
    requiredPlan: "pro",
    tags: ["gallery", "masonry", "lightbox", "premium"],
    defaultContent: {
      layout: "masonry",
      columns: 3,
      categories: [],
      images: [],
    },
  },

  // ── Trust Blocks ──
  {
    id: "testimonials_carousel",
    name: "Testimonials Carousel",
    description: "Auto-rotating carousel of customer testimonials.",
    category: "trust",
    icon: "Quote",
    preview: "\"Best contractor we've ever worked with!\" — Sarah M.",
    isPremium: false,
    requiredPlan: "starter",
    tags: ["reviews", "carousel", "social proof"],
    defaultContent: {
      autoplay: true,
      interval_seconds: 5,
      show_stars: true,
    },
  },
  {
    id: "trust_badges",
    name: "Trust Badges",
    description: "Display certifications, licenses, and trust indicators.",
    category: "trust",
    icon: "Award",
    preview: "Licensed · Insured · BBB A+ Rated",
    isPremium: false,
    requiredPlan: "growth",
    tags: ["badges", "certifications", "trust"],
    defaultContent: {
      badges: [
        { label: "Licensed & Insured", icon: "Shield" },
        { label: "5-Star Rated", icon: "Star" },
        { label: "Satisfaction Guaranteed", icon: "ThumbsUp" },
      ],
    },
  },
  {
    id: "stats_counter",
    name: "Stats Counter",
    description: "Animated counters showing key business metrics.",
    category: "trust",
    icon: "TrendingUp",
    preview: "500+ Projects · 10+ Years · 98% Satisfaction",
    isPremium: false,
    requiredPlan: "growth",
    tags: ["statistics", "numbers", "metrics"],
    defaultContent: {
      stats: [
        { label: "Projects Completed", value: 500, suffix: "+" },
        { label: "Years Experience", value: 10, suffix: "+" },
        { label: "Client Satisfaction", value: 98, suffix: "%" },
      ],
    },
  },

  // ── Contact Blocks ──
  {
    id: "quick_contact",
    name: "Quick Contact Bar",
    description: "Floating contact bar with call, text, and email buttons.",
    category: "contact",
    icon: "Phone",
    isPremium: false,
    requiredPlan: "starter",
    tags: ["contact", "phone", "email", "sticky"],
    defaultContent: {
      show_call: true,
      show_text: true,
      show_email: true,
      sticky: true,
    },
  },
  {
    id: "appointment_scheduler",
    name: "Appointment Scheduler",
    description: "Inline calendar widget for direct appointment booking.",
    category: "contact",
    icon: "CalendarPlus",
    isPremium: true,
    requiredPlan: "pro",
    tags: ["booking", "calendar", "scheduling"],
    defaultContent: {
      show_services: true,
      show_availability: true,
    },
  },

  // ── Business Tools ──
  {
    id: "pricing_table",
    name: "Pricing Table",
    description: "Display your service tiers or packages with pricing.",
    category: "business",
    icon: "DollarSign",
    preview: "Basic $99 · Standard $199 · Premium $349",
    isPremium: false,
    requiredPlan: "growth",
    tags: ["pricing", "packages", "tiers"],
    defaultContent: {
      tiers: [
        { name: "Basic", price: 99, features: ["Feature 1", "Feature 2"] },
        { name: "Standard", price: 199, features: ["Feature 1", "Feature 2", "Feature 3"], highlighted: true },
        { name: "Premium", price: 349, features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"] },
      ],
    },
  },
  {
    id: "quote_calc",
    name: "Quote Calculator",
    description: "Interactive pricing calculator for instant estimates.",
    category: "business",
    icon: "Calculator",
    isPremium: true,
    requiredPlan: "pro",
    tags: ["calculator", "estimate", "pricing"],
    defaultContent: {
      base_price: 0,
      options: [],
    },
  },
  {
    id: "ai_content",
    name: "AI Content Generator",
    description: "Auto-generate card copy, bios, and service descriptions with AI.",
    category: "business",
    icon: "Wand2",
    isPremium: true,
    requiredPlan: "pro",
    tags: ["ai", "content", "generator"],
    defaultContent: {
      tone: "professional",
      length: "medium",
    },
  },
];

export function getBlocksByCategory(category: BlockCategory): MarketplaceBlock[] {
  return MARKETPLACE_BLOCKS.filter((b) => b.category === category);
}

export function getBlockById(id: string): MarketplaceBlock | undefined {
  return MARKETPLACE_BLOCKS.find((b) => b.id === id);
}

/** Check if user's plan can access a block */
export function canAccessBlock(block: MarketplaceBlock, userPlan: string): boolean {
  const planOrder = ["starter", "growth", "pro", "agency"];
  const userIdx = planOrder.indexOf(userPlan || "starter");
  const reqIdx = planOrder.indexOf(block.requiredPlan);
  return userIdx >= reqIdx;
}
