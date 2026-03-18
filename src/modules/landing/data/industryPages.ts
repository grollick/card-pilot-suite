import { getDemoCardBySlug, type DemoCard } from "@/lib/demoCards";

export interface IndustryPageData {
  slug: string;
  profession: string;
  demoSlug: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  ctaSubtext: string;
  problemHeadline: string;
  problems: { icon: string; title: string; description: string }[];
  solutionHeadline: string;
  solutionPoints: { title: string; description: string }[];
  howItWorks: { step: string; title: string; description: string }[];
  features: { title: string; description: string; icon: string }[];
  testimonialIntro: string;
  focusAreas: string[];
}

export const INDUSTRY_PAGES: Record<string, IndustryPageData> = {
  contractors: {
    slug: "contractors",
    profession: "Contractor",
    demoSlug: "demo-contractor",
    heroHeadline: "The Digital Business Card Built for Contractors",
    heroSubheadline: "Stop losing leads to voicemail. Get a professional digital card that captures quote requests, showcases your projects, and books jobs — 24/7.",
    ctaText: "Create Your Free Contractor Card",
    ctaSubtext: "No credit card required · Takes 30 seconds",
    problemHeadline: "Sound Familiar?",
    problems: [
      { icon: "📞", title: "Missed calls = missed jobs", description: "You're on a job site and can't pick up. That lead just called your competitor instead." },
      { icon: "📋", title: "No easy way to share your work", description: "You've got amazing projects, but sharing them means digging through your phone for photos." },
      { icon: "💸", title: "Quotes disappear into email chains", description: "Potential clients request estimates but never follow up because the process is clunky." },
    ],
    solutionHeadline: "One Card. More Leads. Less Hassle.",
    solutionPoints: [
      { title: "Instant Quote Requests", description: "Clients tap your card, fill out a quick form, and you get the lead instantly — even while you're swinging a hammer." },
      { title: "Project Showcase", description: "Display your best before-and-after photos, completed builds, and client testimonials right on your card." },
      { title: "Automated Follow-ups", description: "Never forget to follow up on a quote. CardPilot sends reminders automatically so leads don't go cold." },
    ],
    howItWorks: [
      { step: "1", title: "Create Your Card", description: "Enter your trade, services, and upload project photos. AI fills in the rest." },
      { step: "2", title: "Share Everywhere", description: "Hand out your QR code on job sites, add it to invoices, or text it to potential clients." },
      { step: "3", title: "Capture & Close", description: "Leads come in automatically. Follow up, send estimates, and book more jobs." },
    ],
    features: [
      { title: "Lead Capture Forms", icon: "📥", description: "Built-in forms that capture name, phone, project details, and budget." },
      { title: "Project Gallery", icon: "🖼️", description: "Showcase completed work with before/after photos and descriptions." },
      { title: "Service Menu & Pricing", icon: "💲", description: "List your services with estimated pricing so clients know what to expect." },
      { title: "Instant Estimates", icon: "📄", description: "Generate professional PDF estimates and send them from your phone." },
      { title: "Review Collection", icon: "⭐", description: "Automatically ask happy clients for Google reviews after job completion." },
      { title: "QR Code & NFC", icon: "📱", description: "Share your card via QR stickers on your truck, hard hat, or business cards." },
    ],
    testimonialIntro: "Contractors across the country trust CardPilot",
    focusAreas: ["Lead Generation", "Quote Requests", "Project Showcases"],
  },
  barbers: {
    slug: "barbers",
    profession: "Barber",
    demoSlug: "demo-barber",
    heroHeadline: "The Digital Business Card Built for Barbers",
    heroSubheadline: "Fill your chair, not your voicemail. A smart digital card that books appointments, builds loyalty, and showcases your best cuts.",
    ctaText: "Start Getting More Bookings",
    ctaSubtext: "Free forever · Set up in 30 seconds",
    problemHeadline: "Tired of This?",
    problems: [
      { icon: "📵", title: "Clients DM you at midnight", description: "You're juggling Instagram DMs, texts, and walk-ins with no system to keep track." },
      { icon: "🪑", title: "Empty chairs on slow days", description: "Some days are packed, others are dead — and you have no way to fill last-minute slots." },
      { icon: "🔄", title: "Repeat clients forget to rebook", description: "They loved the cut but life got busy. Without a reminder, they go to whoever's closest." },
    ],
    solutionHeadline: "Your Chair. Always Full.",
    solutionPoints: [
      { title: "Online Booking", description: "Clients book their own appointments from your card. No DMs, no phone tag." },
      { title: "Repeat Client System", description: "Automatic reminders bring clients back every 2–4 weeks. Build loyalty on autopilot." },
      { title: "Work Gallery", description: "Show off your fades, beard work, and transformations right on your digital card." },
    ],
    howItWorks: [
      { step: "1", title: "Build Your Card", description: "Add your services, prices, and upload your best work. AI writes your bio." },
      { step: "2", title: "Share Your Link", description: "Put your QR code at your station, in your Instagram bio, or on your mirror." },
      { step: "3", title: "Get Booked", description: "Clients book directly. You get notified instantly and your calendar stays full." },
    ],
    features: [
      { title: "Online Booking", icon: "📅", description: "Clients pick a service, choose a time, and book — no phone calls needed." },
      { title: "Service Menu", icon: "✂️", description: "Display your cuts, prices, and duration so clients know exactly what to expect." },
      { title: "Before/After Gallery", icon: "📸", description: "Showcase transformations that make new clients say 'I want that.'" },
      { title: "Loyalty Reminders", icon: "🔔", description: "Automatic rebooking reminders keep your regulars coming back." },
      { title: "Review Requests", icon: "⭐", description: "After every cut, prompt satisfied clients to leave a Google review." },
      { title: "QR at Your Station", icon: "📱", description: "Print a QR code for your mirror — clients scan and book their next visit." },
    ],
    testimonialIntro: "Barbers are growing their clientele with CardPilot",
    focusAreas: ["Booking Appointments", "Repeat Customers", "Work Gallery"],
  },
  realtors: {
    slug: "realtors",
    profession: "Realtor",
    demoSlug: "demo-realtor",
    heroHeadline: "The Digital Business Card Built for Realtors",
    heroSubheadline: "Capture more buyer and seller leads with a professional digital card that showcases your listings, collects inquiries, and books consultations.",
    ctaText: "Capture More Clients Today",
    ctaSubtext: "Free plan available · No credit card required",
    problemHeadline: "Losing Leads?",
    problems: [
      { icon: "🏠", title: "Open house visitors vanish", description: "You meet 20 people at an open house but only get 3 contact cards. The rest are gone forever." },
      { icon: "📇", title: "Paper cards end up in the trash", description: "You hand out hundreds of business cards a year. Most get tossed before they leave the parking lot." },
      { icon: "⏳", title: "Slow follow-up kills deals", description: "By the time you manually enter leads and send emails, they've already talked to another agent." },
    ],
    solutionHeadline: "Never Lose a Lead Again.",
    solutionPoints: [
      { title: "Instant Lead Capture", description: "Visitors tap your card, enter their info, and you get an instant notification with their details." },
      { title: "Property Showcases", description: "Feature your active listings with photos, details, and virtual tour links right on your card." },
      { title: "Consultation Booking", description: "Let buyers and sellers book a free consultation directly from your digital card." },
    ],
    howItWorks: [
      { step: "1", title: "Create Your Card", description: "Add your headshot, specialties, and featured listings. AI writes your agent bio." },
      { step: "2", title: "Share at Every Touchpoint", description: "Open houses, networking events, email signatures, yard signs — your card goes everywhere." },
      { step: "3", title: "Capture & Convert", description: "Leads flow in automatically. Follow up fast and close more deals." },
    ],
    features: [
      { title: "Lead Capture Forms", icon: "📥", description: "Capture buyer/seller details with smart forms that ask the right questions." },
      { title: "Listing Showcase", icon: "🏡", description: "Feature your active properties with photos, pricing, and tour links." },
      { title: "Consultation Booking", icon: "📅", description: "Prospects book free consultations directly from your card." },
      { title: "Market Reports", icon: "📊", description: "Share neighborhood market data to position yourself as the local expert." },
      { title: "Automated Follow-ups", icon: "📧", description: "Send personalized follow-up emails automatically after lead capture." },
      { title: "QR for Open Houses", icon: "📱", description: "Print QR codes for sign-in sheets, yard signs, and flyers." },
    ],
    testimonialIntro: "Top-producing agents choose CardPilot",
    focusAreas: ["Lead Capture", "Property Showcases", "Consultations"],
  },
  photographers: {
    slug: "photographers",
    profession: "Photographer",
    demoSlug: "demo-photographer",
    heroHeadline: "The Digital Business Card Built for Photographers",
    heroSubheadline: "Let your work speak for itself. A stunning digital card that showcases your portfolio, books sessions, and captures client inquiries.",
    ctaText: "Showcase Your Work Today",
    ctaSubtext: "Free plan available · Beautiful by default",
    problemHeadline: "Relatable?",
    problems: [
      { icon: "🌐", title: "Your website is beautiful but invisible", description: "You spent hours on your portfolio site, but nobody finds it on Google." },
      { icon: "💬", title: "Inquiries get lost in DMs", description: "Potential clients reach out on 5 different platforms. Half slip through the cracks." },
      { icon: "📆", title: "Booking is a back-and-forth nightmare", description: "Scheduling a session takes 10 emails. By then, the client books someone else." },
    ],
    solutionHeadline: "One Link. All Your Best Work.",
    solutionPoints: [
      { title: "Portfolio on Your Card", description: "Display your best shots in a gorgeous gallery that loads instantly on any device." },
      { title: "Session Booking", description: "Clients pick a session type, choose a date, and book — all from your card." },
      { title: "Inquiry Forms", description: "Capture event details, dates, and budgets with smart forms that qualify leads for you." },
    ],
    howItWorks: [
      { step: "1", title: "Build Your Card", description: "Upload your best photos, list your packages, and let AI write your bio." },
      { step: "2", title: "Share Your Link", description: "Add it to your Instagram bio, email signature, and printed materials." },
      { step: "3", title: "Get Booked", description: "Clients inquire and book directly. No more back-and-forth DMs." },
    ],
    features: [
      { title: "Portfolio Gallery", icon: "🖼️", description: "A beautiful, fast-loading gallery that showcases your best work." },
      { title: "Session Booking", icon: "📅", description: "Clients choose a package and book a date — no emails needed." },
      { title: "Inquiry Forms", icon: "📝", description: "Smart forms capture event type, date, location, and budget." },
      { title: "Package Display", icon: "💎", description: "Show your pricing packages with what's included in each tier." },
      { title: "Client Testimonials", icon: "⭐", description: "Display glowing reviews from past clients to build trust." },
      { title: "Social Links", icon: "📱", description: "Connect your Instagram, TikTok, and portfolio site in one place." },
    ],
    testimonialIntro: "Photographers are booking more sessions with CardPilot",
    focusAreas: ["Portfolio", "Bookings", "Client Inquiries"],
  },
  landscapers: {
    slug: "landscapers",
    profession: "Landscaper",
    demoSlug: "demo-landscaper",
    heroHeadline: "The Digital Business Card Built for Landscapers",
    heroSubheadline: "Win more yard jobs with a digital card that showcases before & after transformations, captures quote requests, and promotes seasonal deals.",
    ctaText: "Grow Your Landscaping Business",
    ctaSubtext: "Free plan available · Set up in 30 seconds",
    problemHeadline: "Sound Like Your Week?",
    problems: [
      { icon: "📞", title: "Missed calls while mowing", description: "You can't answer the phone when you're behind a mower. That lead just called the next guy on Google." },
      { icon: "📷", title: "Amazing work, zero proof", description: "You do incredible transformations but have no organized way to show them off." },
      { icon: "❄️", title: "Slow seasons hurt", description: "Winter and late fall bring crickets. You need a way to promote seasonal services year-round." },
    ],
    solutionHeadline: "Your Best Work. Always Selling.",
    solutionPoints: [
      { title: "Before & After Gallery", description: "Show dramatic transformations that make homeowners say 'I need that for my yard.'" },
      { title: "Instant Quote Requests", description: "Clients describe their project and request a quote — even when you're on a job." },
      { title: "Seasonal Promotions", description: "Promote spring cleanups, fall leaf removal, and holiday lighting right on your card." },
    ],
    howItWorks: [
      { step: "1", title: "Create Your Card", description: "Add your services, upload before/after photos, and set your service area." },
      { step: "2", title: "Share with Clients", description: "Leave QR cards at completed jobs, add to your truck, and share via text." },
      { step: "3", title: "Win More Jobs", description: "Quote requests flow in. Follow up fast and close more maintenance contracts." },
    ],
    features: [
      { title: "Before & After Slider", icon: "🔄", description: "Interactive sliders that show dramatic yard transformations." },
      { title: "Quote Request Forms", icon: "📋", description: "Capture property size, service type, and photos from potential clients." },
      { title: "Seasonal Promos", icon: "🍂", description: "Promote seasonal services with eye-catching banners on your card." },
      { title: "Service Area Map", icon: "📍", description: "Show exactly which neighborhoods and zip codes you serve." },
      { title: "Maintenance Plans", icon: "📆", description: "Display recurring plan options to lock in steady monthly revenue." },
      { title: "Review Collection", icon: "⭐", description: "Automatically request reviews after completing a landscaping project." },
    ],
    testimonialIntro: "Landscapers are growing faster with CardPilot",
    focusAreas: ["Before/After Projects", "Quote Requests", "Seasonal Promotions"],
  },
};

export function getIndustryPage(slug: string): IndustryPageData | undefined {
  return INDUSTRY_PAGES[slug];
}

export function getIndustryDemoCard(page: IndustryPageData): DemoCard | undefined {
  return getDemoCardBySlug(page.demoSlug);
}
