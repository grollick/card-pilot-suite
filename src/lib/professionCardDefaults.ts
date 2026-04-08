/**
 * Profession-specific default card content.
 * Ensures every new card looks polished and share-ready, never blank.
 */

export interface ProfessionCardDefaults {
  tagline: string;
  about: string;
  services: Array<{ name: string; description?: string; price?: string }>;
  testimonials: Array<{ name: string; text: string; role?: string }>;
  ctaPriority: string[];
  /** Accent palette for the card header gradient */
  palette?: { primary: string; accent: string };
}

const DEFAULTS_MAP: Record<string, ProfessionCardDefaults> = {
  // ── Trades ──
  contractor: {
    tagline: "Quality craftsmanship you can trust",
    about: "Licensed, insured, and committed to delivering exceptional results on every project. From concept to completion, we bring your vision to life with precision and care.",
    services: [
      { name: "Kitchen Renovation", description: "Full design & build" },
      { name: "Bathroom Remodel", description: "Modern upgrades" },
      { name: "Custom Builds", description: "Tailored to your needs" },
    ],
    testimonials: [
      { name: "Sarah M.", text: "Incredible attention to detail. Came in on time and under budget.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "quote", "book"],
    palette: { primary: "#1e3a5f", accent: "#f59e0b" },
  },
  electrician: {
    tagline: "Safe, reliable electrical solutions",
    about: "Certified electrician providing residential and commercial electrical services. Safety-first approach with clean, code-compliant work every time.",
    services: [
      { name: "Panel Upgrades", description: "200A service upgrades" },
      { name: "Wiring & Rewiring", description: "New construction & retrofit" },
      { name: "Emergency Repairs", description: "Fast response times" },
    ],
    testimonials: [
      { name: "Mike R.", text: "Responded within an hour and fixed the issue fast. Very professional.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "text", "book"],
    palette: { primary: "#1e3a8a", accent: "#fbbf24" },
  },
  plumber: {
    tagline: "Fast, clean plumbing — guaranteed",
    about: "Professional plumbing services for homes and businesses. We solve problems right the first time with upfront pricing and clean workmanship.",
    services: [
      { name: "Drain Cleaning", description: "Same-day service" },
      { name: "Fixture Installation", description: "Faucets, toilets & more" },
      { name: "Water Heater Repair", description: "All brands serviced" },
    ],
    testimonials: [
      { name: "Lisa K.", text: "Fixed our leak in under an hour. Fair price and super professional.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "text", "book"],
  },
  landscaper: {
    tagline: "Transforming outdoor spaces beautifully",
    about: "Creating stunning landscapes that enhance your property's beauty and value. From design to installation and maintenance, we handle it all.",
    services: [
      { name: "Landscape Design", description: "Custom outdoor plans" },
      { name: "Lawn Maintenance", description: "Weekly & seasonal care" },
      { name: "Hardscaping", description: "Patios, walkways & walls" },
    ],
    testimonials: [
      { name: "Tom & Jan S.", text: "They completely transformed our backyard. The neighbors keep asking for their number!", role: "Homeowners" },
    ],
    ctaPriority: ["call", "quote", "book"],
    palette: { primary: "#166534", accent: "#84cc16" },
  },
  painter: {
    tagline: "Flawless finishes, every surface",
    about: "Professional painting services that transform spaces with precision and care. Interior, exterior, and specialty finishes.",
    services: [
      { name: "Interior Painting", description: "Walls, ceilings, trim" },
      { name: "Exterior Painting", description: "Weather-resistant finishes" },
      { name: "Cabinet Refinishing", description: "Like-new results" },
    ],
    testimonials: [
      { name: "Jennifer W.", text: "The attention to detail was amazing. Every edge was perfect.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "quote", "book"],
  },
  // ── Real Estate ──
  realtor: {
    tagline: "Your trusted partner in real estate",
    about: "Helping buyers and sellers navigate the market with confidence. Deep local expertise, strong negotiation skills, and a client-first approach.",
    services: [
      { name: "Buyer Representation", description: "Find your dream home" },
      { name: "Seller Strategy", description: "Maximum value, fast close" },
      { name: "Market Analysis", description: "Know your property's worth" },
    ],
    testimonials: [
      { name: "David & Amy L.", text: "Found us our dream home in three weeks. Incredible negotiation skills.", role: "Homebuyers" },
    ],
    ctaPriority: ["call", "text", "book"],
    palette: { primary: "#1e3a8a", accent: "#3b82f6" },
  },
  "real estate agent": {
    tagline: "Your trusted partner in real estate",
    about: "Helping buyers and sellers navigate the market with confidence. Deep local expertise, strong negotiation skills, and a client-first approach.",
    services: [
      { name: "Buyer Representation", description: "Find your dream home" },
      { name: "Seller Strategy", description: "Maximum value, fast close" },
      { name: "Market Analysis", description: "Know your property's worth" },
    ],
    testimonials: [
      { name: "David & Amy L.", text: "Found us our dream home in three weeks. Incredible negotiation skills.", role: "Homebuyers" },
    ],
    ctaPriority: ["call", "text", "book"],
    palette: { primary: "#1e3a8a", accent: "#3b82f6" },
  },
  // ── Beauty & Wellness ──
  barber: {
    tagline: "Sharp cuts. Clean fades. Walk out confident.",
    about: "Precision cuts and grooming in a relaxed atmosphere. Every client leaves looking and feeling their best.",
    services: [
      { name: "Signature Haircut", description: "Tailored to your style" },
      { name: "Beard Sculpt", description: "Hot towel & precision trim" },
      { name: "Premium Package", description: "Cut, beard & hot towel" },
    ],
    testimonials: [
      { name: "James T.", text: "Best barber I've ever had. Won't go anywhere else.", role: "Regular client" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#111827", accent: "#d4a017" },
  },
  stylist: {
    tagline: "Your best look starts here",
    about: "Creating personalized styles that bring out your natural beauty. Color, cuts, and transformations you'll love.",
    services: [
      { name: "Cut & Style", description: "Precision cutting" },
      { name: "Color Services", description: "Balayage, highlights & more" },
      { name: "Blowout", description: "Sleek & polished finish" },
    ],
    testimonials: [
      { name: "Rachel P.", text: "Finally found someone who gets my hair! Absolutely love it.", role: "Client" },
    ],
    ctaPriority: ["book", "call", "text"],
  },
  "personal trainer": {
    tagline: "Results-driven fitness coaching",
    about: "Personalized training programs designed to help you reach your goals. Whether you're just starting out or pushing past plateaus.",
    services: [
      { name: "1-on-1 Training", description: "Customized workouts" },
      { name: "Group Sessions", description: "Motivating team environment" },
      { name: "Nutrition Coaching", description: "Meal plans & guidance" },
    ],
    testimonials: [
      { name: "Chris M.", text: "Lost 30 pounds and gained so much confidence. Best investment ever.", role: "Client" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#7c3aed", accent: "#06b6d4" },
  },
  // ── Creative ──
  photographer: {
    tagline: "Every frame tells your story",
    about: "Capturing authentic moments with an artistic eye. From weddings to commercial shoots, every session is crafted to perfection.",
    services: [
      { name: "Wedding Coverage", description: "Full-day documentation" },
      { name: "Portrait Sessions", description: "Individual & family" },
      { name: "Commercial Shoots", description: "Products & brands" },
    ],
    testimonials: [
      { name: "Nicole & Ryan", text: "The photos exceeded every expectation. Pure artistry.", role: "Wedding clients" },
    ],
    ctaPriority: ["book", "email", "call"],
    palette: { primary: "#1e293b", accent: "#e11d48" },
  },
  // ── Auto ──
  mechanic: {
    tagline: "Honest auto care you can count on",
    about: "Full-service auto repair with transparent pricing. We treat every vehicle like our own.",
    services: [
      { name: "Oil Change", description: "Synthetic & conventional" },
      { name: "Brake Service", description: "Pads, rotors & fluid" },
      { name: "Diagnostics", description: "Check engine & more" },
    ],
    testimonials: [
      { name: "Steve H.", text: "Finally found a mechanic I trust. Fair prices and honest work.", role: "Customer" },
    ],
    ctaPriority: ["call", "text", "book"],
  },
  "auto detailer": {
    tagline: "Showroom shine, every time",
    about: "Professional auto detailing that restores and protects your vehicle's finish. Interior and exterior packages available.",
    services: [
      { name: "Full Detail", description: "Interior + exterior" },
      { name: "Paint Correction", description: "Remove swirls & scratches" },
      { name: "Ceramic Coating", description: "Long-lasting protection" },
    ],
    testimonials: [
      { name: "Mark D.", text: "My car looks better than when I bought it. Incredible work.", role: "Customer" },
    ],
    ctaPriority: ["call", "text", "book"],
  },
  // ── Consulting ──
  consultant: {
    tagline: "Strategic guidance for growth",
    about: "Helping businesses unlock their full potential through data-driven strategy, operational efficiency, and leadership development.",
    services: [
      { name: "Strategy Session", description: "90-minute deep dive" },
      { name: "Growth Audit", description: "Identify opportunities" },
      { name: "Ongoing Advisory", description: "Monthly retainer" },
    ],
    testimonials: [
      { name: "Alex P.", text: "Doubled our revenue in 6 months following their recommendations.", role: "CEO" },
    ],
    ctaPriority: ["book", "email", "call"],
  },
};

/** Generic fallback for unknown professions */
const GENERIC_DEFAULTS: ProfessionCardDefaults = {
  tagline: "Professional services you can trust",
  about: "Dedicated to delivering exceptional service and results. With years of experience and a commitment to quality, every client receives personalized attention.",
  services: [
    { name: "Consultation", description: "Free initial assessment" },
    { name: "Standard Service", description: "Our most popular option" },
    { name: "Premium Package", description: "Comprehensive solution" },
  ],
  testimonials: [
    { name: "Happy Client", text: "Excellent service from start to finish. Highly recommended!", role: "Client" },
  ],
  ctaPriority: ["call", "book", "email"],
};

/**
 * Get default card content for a profession.
 * Falls back to generic defaults if no exact or partial match.
 */
export function getProfessionCardDefaults(professionName?: string): ProfessionCardDefaults {
  if (!professionName) return GENERIC_DEFAULTS;
  const lower = professionName.toLowerCase();

  // Exact match
  if (DEFAULTS_MAP[lower]) return DEFAULTS_MAP[lower];

  // Partial match
  for (const [key, defaults] of Object.entries(DEFAULTS_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return defaults;
  }

  return GENERIC_DEFAULTS;
}
