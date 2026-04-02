export type PostFormat = "square" | "vertical" | "landscape";
export type TemplateProfession = "contractor" | "barber" | "realtor" | "landscaper" | "general";
export type TemplateCategory = "before_after" | "project_completed" | "now_booking" | "promotion" | "testimonial" | "tip";

export interface CanvasElement {
  id: string;
  type: "text" | "image" | "shape" | "badge";
  x: number;       // percent 0-100
  y: number;       // percent 0-100
  width: number;   // percent
  height: number;  // percent
  rotation: number;
  zIndex: number;
  locked?: boolean;
  // text props
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  // shape/image props
  fill?: string;
  opacity?: number;
  borderRadius?: number;
  imageUrl?: string;
  // badge
  badgeText?: string;
  badgeColor?: string;
}

export interface PostTemplate {
  id: string;
  name: string;
  profession: TemplateProfession;
  category: TemplateCategory;
  format: PostFormat;
  bgColor: string;
  accentColor: string;
  elements: CanvasElement[];
  thumbnail?: string;
  /** Slug of the marketplace app that provides this template */
  appSource?: string;
}

export const FORMAT_DIMENSIONS: Record<PostFormat, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "Square (1:1)" },
  vertical: { w: 1080, h: 1350, label: "Vertical (4:5)" },
  landscape: { w: 1200, h: 628, label: "Landscape (1.91:1)" },
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ── Helper builders ──
function headlineEl(text: string, opts?: Partial<CanvasElement>): CanvasElement {
  return {
    id: uid(), type: "text", x: 8, y: 12, width: 84, height: 18, rotation: 0, zIndex: 10,
    text, fontSize: 42, fontWeight: "800", color: "#FFFFFF", textAlign: "left", fontFamily: "Inter",
    ...opts,
  };
}

function subheadEl(text: string, opts?: Partial<CanvasElement>): CanvasElement {
  return {
    id: uid(), type: "text", x: 8, y: 32, width: 84, height: 10, rotation: 0, zIndex: 10,
    text, fontSize: 20, fontWeight: "400", color: "#FFFFFFCC", textAlign: "left", fontFamily: "Inter",
    ...opts,
  };
}

function bgBlock(fill: string, opts?: Partial<CanvasElement>): CanvasElement {
  return {
    id: uid(), type: "shape", x: 0, y: 0, width: 100, height: 100, rotation: 0, zIndex: 0,
    fill, opacity: 1, borderRadius: 0,
    ...opts,
  };
}

function ctaBadge(text: string, color: string, opts?: Partial<CanvasElement>): CanvasElement {
  return {
    id: uid(), type: "badge", x: 8, y: 80, width: 40, height: 10, rotation: 0, zIndex: 12,
    badgeText: text, badgeColor: color, borderRadius: 8,
    ...opts,
  };
}

function imagePlaceholder(opts?: Partial<CanvasElement>): CanvasElement {
  return {
    id: uid(), type: "image", x: 5, y: 45, width: 90, height: 30, rotation: 0, zIndex: 5,
    fill: "#00000022", borderRadius: 12, opacity: 1,
    ...opts,
  };
}

// ── Templates ──
export const POST_TEMPLATES: PostTemplate[] = [
  // ── Contractor ──
  {
    id: "contractor-before-after",
    name: "Before & After",
    profession: "contractor",
    category: "before_after",
    format: "square",
    bgColor: "#1a1a2e",
    accentColor: "#e94560",
    elements: [
      bgBlock("#1a1a2e"),
      headlineEl("BEFORE & AFTER", { y: 6, fontSize: 36 }),
      subheadEl("See the transformation", { y: 18 }),
      { id: uid(), type: "image", x: 3, y: 28, width: 45, height: 35, rotation: 0, zIndex: 5, fill: "#ffffff11", borderRadius: 8 },
      { id: uid(), type: "image", x: 52, y: 28, width: 45, height: 35, rotation: 0, zIndex: 5, fill: "#ffffff11", borderRadius: 8 },
      { id: uid(), type: "text", x: 3, y: 65, width: 45, height: 6, rotation: 0, zIndex: 6, text: "BEFORE", fontSize: 14, fontWeight: "700", color: "#e94560", textAlign: "center" },
      { id: uid(), type: "text", x: 52, y: 65, width: 45, height: 6, rotation: 0, zIndex: 6, text: "AFTER", fontSize: 14, fontWeight: "700", color: "#4ade80", textAlign: "center" },
      ctaBadge("Get a Free Quote", "#e94560", { y: 82 }),
    ],
  },
  {
    id: "contractor-project-done",
    name: "Project Completed",
    profession: "contractor",
    category: "project_completed",
    format: "square",
    bgColor: "#0f172a",
    accentColor: "#3b82f6",
    elements: [
      bgBlock("#0f172a"),
      { id: uid(), type: "badge", x: 6, y: 5, width: 30, height: 7, rotation: 0, zIndex: 11, badgeText: "✓ COMPLETED", badgeColor: "#22c55e", borderRadius: 20 },
      headlineEl("Another Job\nDone Right", { y: 16, fontSize: 38 }),
      imagePlaceholder({ y: 40, height: 38 }),
      subheadEl("Tap to book your project →", { y: 84, fontSize: 16 }),
    ],
  },
  {
    id: "contractor-now-booking",
    name: "Now Booking",
    profession: "contractor",
    category: "now_booking",
    format: "vertical",
    bgColor: "#fbbf24",
    accentColor: "#1e293b",
    elements: [
      bgBlock("#fbbf24"),
      headlineEl("NOW\nBOOKING", { color: "#1e293b", fontSize: 56, y: 8 }),
      subheadEl("Spring 2025 schedule is filling up fast", { color: "#1e293bCC", y: 35 }),
      imagePlaceholder({ y: 45, height: 28, fill: "#1e293b11" }),
      ctaBadge("Book Today", "#1e293b", { y: 80 }),
    ],
  },
  {
    id: "contractor-promo",
    name: "Seasonal Promo",
    profession: "contractor",
    category: "promotion",
    format: "square",
    bgColor: "#dc2626",
    accentColor: "#fef2f2",
    elements: [
      bgBlock("#dc2626"),
      headlineEl("SAVE 15%", { fontSize: 60, y: 20, textAlign: "center", color: "#FFFFFF" }),
      subheadEl("On all kitchen renovations\nthis month only", { y: 45, textAlign: "center", color: "#FFFFFFDD" }),
      ctaBadge("Claim Offer →", "#FFFFFF", { x: 25, width: 50, y: 75 }),
    ],
  },

  // ── Barber ──
  {
    id: "barber-before-after",
    name: "Fresh Cut Reveal",
    profession: "barber",
    category: "before_after",
    format: "square",
    bgColor: "#18181b",
    accentColor: "#a78bfa",
    elements: [
      bgBlock("#18181b"),
      { id: uid(), type: "image", x: 0, y: 0, width: 50, height: 70, rotation: 0, zIndex: 5, fill: "#ffffff08", borderRadius: 0 },
      { id: uid(), type: "image", x: 50, y: 0, width: 50, height: 70, rotation: 0, zIndex: 5, fill: "#ffffff08", borderRadius: 0 },
      headlineEl("THE\nTRANSFORMATION", { y: 74, fontSize: 32, textAlign: "center", x: 5, width: 90 }),
      ctaBadge("Book Your Spot", "#a78bfa", { x: 25, width: 50, y: 90 }),
    ],
  },
  {
    id: "barber-now-booking",
    name: "Walk-ins Welcome",
    profession: "barber",
    category: "now_booking",
    format: "vertical",
    bgColor: "#1c1917",
    accentColor: "#f59e0b",
    elements: [
      bgBlock("#1c1917"),
      headlineEl("WALK-INS\nWELCOME", { fontSize: 48, y: 10, color: "#f59e0b" }),
      subheadEl("No appointment needed\nSame-day service", { y: 35, color: "#FFFFFFAA" }),
      imagePlaceholder({ y: 48, height: 25 }),
      ctaBadge("Visit Today", "#f59e0b", { y: 82 }),
    ],
  },

  // ── Realtor ──
  {
    id: "realtor-just-listed",
    name: "Just Listed",
    profession: "realtor",
    category: "project_completed",
    format: "landscape",
    bgColor: "#0c0a09",
    accentColor: "#d4af37",
    elements: [
      bgBlock("#0c0a09"),
      { id: uid(), type: "badge", x: 4, y: 8, width: 22, height: 8, rotation: 0, zIndex: 11, badgeText: "JUST LISTED", badgeColor: "#d4af37", borderRadius: 4 },
      headlineEl("123 Oak Street", { y: 22, fontSize: 36, color: "#FFFFFF" }),
      subheadEl("4 Bed · 3 Bath · 2,400 sqft\n$549,000", { y: 42, fontSize: 18, color: "#d4af37" }),
      imagePlaceholder({ x: 55, y: 5, width: 42, height: 90, borderRadius: 8 }),
      ctaBadge("Schedule a Viewing", "#d4af37", { y: 78 }),
    ],
  },
  {
    id: "realtor-sold",
    name: "Just Sold",
    profession: "realtor",
    category: "project_completed",
    format: "square",
    bgColor: "#14532d",
    accentColor: "#bbf7d0",
    elements: [
      bgBlock("#14532d"),
      headlineEl("SOLD!", { fontSize: 72, y: 20, textAlign: "center", x: 5, width: 90 }),
      subheadEl("Another happy family\nin their dream home", { y: 50, textAlign: "center", x: 10, width: 80 }),
      ctaBadge("Thinking of selling?", "#bbf7d0", { x: 20, width: 60, y: 78 }),
    ],
  },
  {
    id: "realtor-open-house",
    name: "Open House Invite",
    profession: "realtor",
    category: "now_booking",
    format: "vertical",
    bgColor: "#1a1a2e",
    accentColor: "#e2b04a",
    appSource: "canva-real-estate-templates",
    elements: [
      bgBlock("#1a1a2e"),
      { id: uid(), type: "badge", x: 6, y: 5, width: 28, height: 6, rotation: 0, zIndex: 11, badgeText: "🏡 OPEN HOUSE", badgeColor: "#e2b04a", borderRadius: 4 },
      headlineEl("You're\nInvited", { y: 15, fontSize: 52, color: "#e2b04a", fontFamily: "Georgia" }),
      subheadEl("Saturday, 1–4 PM\n456 Maple Drive", { y: 38, fontSize: 20, color: "#FFFFFFCC" }),
      imagePlaceholder({ y: 50, height: 28, borderRadius: 12, fill: "#e2b04a11" }),
      ctaBadge("RSVP Now", "#e2b04a", { y: 84 }),
    ],
  },
  {
    id: "realtor-market-update",
    name: "Market Update",
    profession: "realtor",
    category: "tip",
    format: "square",
    bgColor: "#0f172a",
    accentColor: "#60a5fa",
    appSource: "canva-real-estate-templates",
    elements: [
      bgBlock("#0f172a"),
      { id: uid(), type: "badge", x: 6, y: 6, width: 30, height: 7, rotation: 0, zIndex: 11, badgeText: "📊 MARKET UPDATE", badgeColor: "#60a5fa", borderRadius: 20 },
      headlineEl("Home Prices\nUp 4.2%", { y: 20, fontSize: 42, color: "#FFFFFF" }),
      subheadEl("Your neighborhood is trending.\nNow's the time to list.", { y: 48, fontSize: 18, color: "#FFFFFFBB" }),
      ctaBadge("Free Home Valuation", "#60a5fa", { y: 78 }),
    ],
  },
  {
    id: "realtor-luxury-listing",
    name: "Luxury Listing",
    profession: "realtor",
    category: "project_completed",
    format: "vertical",
    bgColor: "#0a0a0a",
    accentColor: "#d4af37",
    appSource: "canva-real-estate-templates",
    elements: [
      bgBlock("#0a0a0a"),
      imagePlaceholder({ x: 0, y: 0, width: 100, height: 55, borderRadius: 0, fill: "#d4af3710" }),
      { id: uid(), type: "shape", x: 0, y: 50, width: 100, height: 50, rotation: 0, zIndex: 4, fill: "#0a0a0a", opacity: 1, borderRadius: 0 },
      headlineEl("789 Luxe Blvd", { y: 56, fontSize: 38, color: "#d4af37", fontFamily: "Georgia" }),
      subheadEl("5 Bed · 4 Bath · 4,200 sqft · Pool\n$1,250,000", { y: 70, fontSize: 18, color: "#FFFFFFCC" }),
      ctaBadge("Private Showing", "#d4af37", { y: 88 }),
    ],
  },
  {
    id: "realtor-testimonial",
    name: "Buyer Testimonial",
    profession: "realtor",
    category: "testimonial",
    format: "square",
    bgColor: "#1c1917",
    accentColor: "#d4af37",
    appSource: "canva-real-estate-templates",
    elements: [
      bgBlock("#1c1917"),
      { id: uid(), type: "text", x: 10, y: 8, width: 80, height: 6, rotation: 0, zIndex: 10, text: "★★★★★", fontSize: 28, fontWeight: "400", color: "#d4af37", textAlign: "center" },
      { id: uid(), type: "text", x: 8, y: 22, width: 84, height: 35, rotation: 0, zIndex: 10, text: '"Found our dream home in 2 weeks. Best realtor we\'ve ever worked with!"', fontSize: 22, fontWeight: "500", color: "#FFFFFF", textAlign: "center", fontFamily: "Georgia" },
      subheadEl("— The Johnson Family", { y: 65, textAlign: "center", x: 10, width: 80, fontSize: 16, color: "#d4af37" }),
      ctaBadge("Your Dream Home Awaits", "#d4af37", { x: 15, width: 70, y: 82 }),
    ],
  },
  {
    id: "realtor-price-reduced",
    name: "Price Reduced",
    profession: "realtor",
    category: "promotion",
    format: "square",
    bgColor: "#7f1d1d",
    accentColor: "#fecaca",
    elements: [
      bgBlock("#7f1d1d"),
      headlineEl("PRICE\nREDUCED", { fontSize: 58, y: 12, textAlign: "center", x: 5, width: 90, color: "#FFFFFF" }),
      subheadEl("$599,000 → $549,000\n321 Elm Street · 3 Bed · 2 Bath", { y: 48, textAlign: "center", x: 8, width: 84, color: "#fecacaDD" }),
      ctaBadge("Schedule a Tour", "#fecaca", { x: 20, width: 60, y: 78 }),
    ],
  },
  {
    id: "realtor-coming-soon",
    name: "Coming Soon",
    profession: "realtor",
    category: "now_booking",
    format: "landscape",
    bgColor: "#1e293b",
    accentColor: "#c084fc",
    elements: [
      bgBlock("#1e293b"),
      { id: uid(), type: "badge", x: 4, y: 10, width: 24, height: 9, rotation: 0, zIndex: 11, badgeText: "COMING SOON", badgeColor: "#c084fc", borderRadius: 4 },
      headlineEl("Be the First\nto See It", { y: 28, fontSize: 34, color: "#FFFFFF" }),
      subheadEl("Exclusive preview before it hits the market", { y: 58, fontSize: 16, color: "#FFFFFFBB" }),
      imagePlaceholder({ x: 55, y: 5, width: 42, height: 90, borderRadius: 8, fill: "#c084fc10" }),
      ctaBadge("Get Early Access", "#c084fc", { y: 78 }),
    ],
  },

  // ── Landscaper ──
  {
    id: "landscaper-before-after",
    name: "Yard Makeover",
    profession: "landscaper",
    category: "before_after",
    format: "square",
    bgColor: "#14532d",
    accentColor: "#4ade80",
    elements: [
      bgBlock("#14532d"),
      headlineEl("YARD MAKEOVER", { fontSize: 36, y: 5 }),
      { id: uid(), type: "image", x: 3, y: 20, width: 45, height: 40, rotation: 0, zIndex: 5, fill: "#ffffff11", borderRadius: 12 },
      { id: uid(), type: "image", x: 52, y: 20, width: 45, height: 40, rotation: 0, zIndex: 5, fill: "#ffffff11", borderRadius: 12 },
      subheadEl("Swipe to see the difference →", { y: 65, fontSize: 16 }),
      ctaBadge("Free Estimate", "#4ade80", { y: 80 }),
    ],
  },
  {
    id: "landscaper-seasonal",
    name: "Seasonal Service",
    profession: "landscaper",
    category: "promotion",
    format: "vertical",
    bgColor: "#365314",
    accentColor: "#fbbf24",
    elements: [
      bgBlock("#365314"),
      headlineEl("SPRING\nCLEANUP", { fontSize: 52, y: 8, color: "#fbbf24" }),
      subheadEl("Book now before spots fill up", { y: 35, color: "#FFFFFFBB" }),
      imagePlaceholder({ y: 42, height: 28 }),
      ctaBadge("Book Now", "#fbbf24", { y: 80 }),
    ],
  },

  // ── General ──
  {
    id: "general-testimonial",
    name: "Client Testimonial",
    profession: "general",
    category: "testimonial",
    format: "square",
    bgColor: "#1e1b4b",
    accentColor: "#818cf8",
    elements: [
      bgBlock("#1e1b4b"),
      { id: uid(), type: "text", x: 10, y: 10, width: 80, height: 6, rotation: 0, zIndex: 10, text: "★★★★★", fontSize: 28, fontWeight: "400", color: "#fbbf24", textAlign: "center" },
      { id: uid(), type: "text", x: 8, y: 25, width: 84, height: 35, rotation: 0, zIndex: 10, text: '"Best service I\'ve ever had. Highly recommend to anyone!"', fontSize: 24, fontWeight: "500", color: "#FFFFFF", textAlign: "center", fontFamily: "Georgia" },
      subheadEl("— Sarah M., Happy Customer", { y: 68, textAlign: "center", x: 10, width: 80, fontSize: 16 }),
      ctaBadge("Read More Reviews", "#818cf8", { x: 20, width: 60, y: 82 }),
    ],
  },
  {
    id: "general-tip",
    name: "Pro Tip",
    profession: "general",
    category: "tip",
    format: "square",
    bgColor: "#0c4a6e",
    accentColor: "#38bdf8",
    elements: [
      bgBlock("#0c4a6e"),
      { id: uid(), type: "badge", x: 6, y: 6, width: 22, height: 7, rotation: 0, zIndex: 11, badgeText: "💡 PRO TIP", badgeColor: "#38bdf8", borderRadius: 20 },
      headlineEl("Your Tip\nHeadline Here", { y: 22, fontSize: 36 }),
      subheadEl("Share valuable advice that positions you as an expert in your field.", { y: 50, fontSize: 18, x: 8, width: 84 }),
      ctaBadge("Follow for More", "#38bdf8", { y: 82 }),
    ],
  },
];

export const PROFESSION_OPTIONS: { value: TemplateProfession; label: string }[] = [
  { value: "general", label: "All Templates" },
  { value: "contractor", label: "Contractors" },
  { value: "barber", label: "Barbers" },
  { value: "realtor", label: "Realtors" },
  { value: "landscaper", label: "Landscapers" },
];

export const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: "before_after", label: "Before & After" },
  { value: "project_completed", label: "Project Completed" },
  { value: "now_booking", label: "Now Booking" },
  { value: "promotion", label: "Promotions" },
  { value: "testimonial", label: "Testimonial" },
  { value: "tip", label: "Pro Tip" },
];
