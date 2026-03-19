import { getDemoCardBySlug, type DemoCard } from "@/lib/demoCards";

export interface IndustryPageData {
  slug: string;
  profession: string;
  demoSlug: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  secondaryCtaText?: string;
  ctaSubtext: string;
  problemHeadline: string;
  problems: { icon: string; title: string; description: string }[];
  problemClosing?: string;
  solutionHeadline: string;
  solutionDescription?: string;
  solutionBullets?: string[];
  solutionPoints: { title: string; description: string }[];
  howItWorks: { step: string; title: string; description: string }[];
  productPreview?: {
    headline: string;
    highlights: string[];
    caption: string;
  };
  features: { title: string; description: string; icon: string }[];
  featuresHeadline?: string;
  socialProof?: { quote: string; attribution: string };
  testimonialIntro: string;
  demoSection?: { headline: string; buttonText: string };
  pricingPreview?: {
    headline: string;
    plans: { name: string; description: string }[];
  };
  finalCtaHeadline?: string;
  finalCtaSubheadline?: string;
  footerNote?: string;
  focusAreas: string[];
}

export const INDUSTRY_PAGES: Record<string, IndustryPageData> = {
  contractors: {
    slug: "contractors",
    profession: "Contractor",
    demoSlug: "demo-contractor",
    heroHeadline: "Get More Renovation Leads and Book Jobs from One Link",
    heroSubheadline: "Show your projects, capture quote requests, and let customers book consultations — all from a single smart business card.",
    ctaText: "Create Your Free Contractor Card",
    secondaryCtaText: "View Example Contractor Card",
    ctaSubtext: "No credit card required",
    problemHeadline: "Most contractors lose jobs before they even get a chance to quote.",
    problems: [
      { icon: "📞", title: "Customers don't know how to reach you quickly", description: "You're on a job site and can't pick up. That lead just called your competitor." },
      { icon: "📋", title: "Your work isn't showcased properly", description: "You've done amazing renovations, but nobody sees them when it matters." },
      { icon: "💬", title: "Leads get lost in texts and calls", description: "Messages pile up across different channels and things slip through the cracks." },
      { icon: "🔄", title: "Follow-ups don't happen consistently", description: "You mean to follow up on quotes, but busy days turn into busy weeks." },
    ],
    problemClosing: "Every missed message is a missed job.",
    solutionHeadline: "Turn your work into a lead-generating machine.",
    solutionDescription: "guzzl.pro gives you one simple link that shows your work, captures leads, and lets customers book with you instantly.",
    solutionBullets: [
      "Show your before-and-after projects",
      "Let customers request quotes",
      "Allow instant booking for consultations",
      "Keep all leads organized in one place",
    ],
    solutionPoints: [
      { title: "Show your before-and-after projects", description: "Display your best work front and center so prospects trust your craftsmanship." },
      { title: "Let customers request quotes", description: "Clients fill out a quick form and you get the lead instantly." },
      { title: "Allow instant booking for consultations", description: "Customers pick a time that works — no phone tag required." },
      { title: "Keep all leads organized in one place", description: "Every inquiry, quote request, and booking in a single dashboard." },
    ],
    howItWorks: [
      { step: "1", title: "Create your card", description: "Add your services, photos, and contact info." },
      { step: "2", title: "Share your link", description: "Send it to customers or post it online." },
      { step: "3", title: "Get leads and bookings", description: "Customers contact you and request quotes instantly." },
    ],
    productPreview: {
      headline: "Everything you need to win more jobs",
      highlights: [
        "Project showcase (before & after)",
        "Quote request form",
        "Booking calendar",
        "Business card scanner",
        "Lead tracking dashboard",
      ],
      caption: "See exactly how many leads and bookings you're getting.",
    },
    featuresHeadline: "Built for contractors who want more jobs",
    features: [
      { title: "Get More Leads", icon: "📥", description: "Capture quote requests from your card." },
      { title: "Show Your Work", icon: "🖼️", description: "Display before-and-after projects to build trust." },
      { title: "Book Consultations", icon: "📅", description: "Let customers schedule time with you." },
      { title: "Scan Business Cards", icon: "📸", description: "Scan physical cards at job sites to add contacts instantly." },
      { title: "Stay Organized", icon: "📊", description: "Manage all your leads and jobs in one dashboard." },
    ],
    socialProof: {
      quote: "I shared my card and got 3 renovation leads in the first week.",
      attribution: "Local Contractor",
    },
    testimonialIntro: "Contractors across the country trust guzzl.pro",
    demoSection: {
      headline: "See a real contractor card",
      buttonText: "View Example Card",
    },
    pricingPreview: {
      headline: "Start free. Upgrade when you're ready.",
      plans: [
        { name: "Free", description: "Basic card, lead capture, booking" },
        { name: "Pro", description: "Automation, unlimited services, advanced features" },
        { name: "Pro Plus", description: "Full business tools and customization" },
      ],
    },
    finalCtaHeadline: "Start getting more leads today.",
    finalCtaSubheadline: "Set up your contractor card in minutes and start booking more jobs.",
    footerNote: "Built for contractors, renovators, and construction professionals.",
    focusAreas: ["Lead Generation", "Quote Requests", "Card Scanning", "Project Showcases"],
  },
  barbers: {
    slug: "barbers",
    profession: "Barber",
    demoSlug: "demo-barber",
    heroHeadline: "Fill Your Chair and Get More Bookings with One Link",
    heroSubheadline: "Show your cuts, let clients book instantly, and keep your schedule full — all from one smart business card.",
    ctaText: "Create Your Free Barber Card",
    secondaryCtaText: "View Example Barber Card",
    ctaSubtext: "No credit card required",
    problemHeadline: "Empty time slots = lost money.",
    problems: [
      { icon: "📅", title: "Clients forget to book", description: "They loved the cut but never schedule the next one. You lose repeat revenue." },
      { icon: "💬", title: "DMs and texts get messy", description: "Messages pile up across platforms and bookings slip through the cracks." },
      { icon: "📷", title: "No easy way to show your work", description: "Your best fades and styles are buried in your camera roll." },
      { icon: "❌", title: "Last-minute cancellations leave gaps", description: "Empty slots with no way to fill them fast means lost income." },
    ],
    problemClosing: "If your chair isn't full, you're losing money.",
    solutionHeadline: "Turn your profile into a booking machine.",
    solutionDescription: "guzzl.pro gives you one link that shows your work and lets clients book instantly.",
    solutionBullets: [
      "Show your best cuts and styles",
      "Let clients book appointments in seconds",
      "Send customers directly to your schedule",
      "Keep everything organized in one place",
    ],
    solutionPoints: [
      { title: "Show your best cuts and styles", description: "Display your work in a stunning gallery." },
      { title: "Let clients book appointments in seconds", description: "No DMs, no phone tag — just instant booking." },
      { title: "Send customers directly to your schedule", description: "One link to your availability." },
      { title: "Keep everything organized in one place", description: "All bookings and clients in one dashboard." },
    ],
    howItWorks: [
      { step: "1", title: "Create your card", description: "Add your services, photos, and availability." },
      { step: "2", title: "Share your link", description: "Put it in your Instagram bio or send it to clients." },
      { step: "3", title: "Get booked", description: "Clients choose a time and lock it in." },
    ],
    productPreview: {
      headline: "Everything you need to stay fully booked",
      highlights: [
        "Booking calendar",
        "Haircut gallery",
        "Service menu",
        "Client tracking dashboard",
      ],
      caption: "Know exactly who booked and when.",
    },
    featuresHeadline: "Built for barbers who want a full schedule",
    features: [
      { title: "Get More Bookings", icon: "📅", description: "Clients can book instantly from your link." },
      { title: "Show Your Work", icon: "✂️", description: "Display your best fades, cuts, and styles." },
      { title: "Scan to Save", icon: "📸", description: "Let walk-ins scan their card to become a contact — no typing needed." },
      { title: "Stay Organized", icon: "📊", description: "Track appointments and clients easily." },
      { title: "Bring Clients Back", icon: "🔔", description: "Encourage repeat bookings and loyalty." },
    ],
    socialProof: {
      quote: "I added my link to Instagram and filled my week in 3 days.",
      attribution: "Local Barber",
    },
    testimonialIntro: "Barbers are growing their clientele with guzzl.pro",
    demoSection: {
      headline: "See a real barber card",
      buttonText: "View Example Barber Card",
    },
    pricingPreview: {
      headline: "Start free. Upgrade when you're ready.",
      plans: [
        { name: "Free", description: "Basic card and booking" },
        { name: "Pro", description: "Unlimited services, automation, analytics" },
        { name: "Pro Plus", description: "Advanced tools and full customization" },
      ],
    },
    finalCtaHeadline: "Start filling your schedule today.",
    finalCtaSubheadline: "Create your barber card in minutes and start getting booked instantly.",
    footerNote: "Built for barbers, stylists, and grooming professionals.",
    focusAreas: ["Bookings", "Haircut Gallery", "Client Loyalty"],
  },
  realtors: {
    slug: "realtors",
    profession: "Realtor",
    demoSlug: "demo-realtor",
    heroHeadline: "Capture More Clients and Close More Deals from One Link",
    heroSubheadline: "Show your listings, capture buyer and seller leads, and book consultations — all from one smart business card.",
    ctaText: "Create Your Free Realtor Card",
    secondaryCtaText: "View Example Realtor Card",
    ctaSubtext: "No credit card required",
    problemHeadline: "Most realtors lose leads before they ever connect.",
    problems: [
      { icon: "📞", title: "Buyers don't know how to reach you quickly", description: "They saw your listing but can't find a fast way to contact you." },
      { icon: "💬", title: "Seller inquiries get lost in messages", description: "Emails, DMs, and texts pile up — and hot leads go cold." },
      { icon: "🏠", title: "No central place to showcase listings", description: "Your properties are scattered across platforms with no single link." },
      { icon: "🔄", title: "Follow-ups are inconsistent", description: "You mean to follow up but busy days turn into missed opportunities." },
    ],
    problemClosing: "Every missed lead could be a missed commission.",
    solutionHeadline: "Turn every visitor into a potential client.",
    solutionDescription: "guzzl.pro gives you one simple link that captures leads and showcases your listings professionally.",
    solutionBullets: [
      "Capture buyer and seller inquiries",
      "Showcase featured listings",
      "Book consultations instantly",
      "Keep all leads organized",
    ],
    solutionPoints: [
      { title: "Capture buyer and seller inquiries", description: "Smart forms collect the right details instantly." },
      { title: "Showcase featured listings", description: "Display your properties with photos and details." },
      { title: "Book consultations instantly", description: "Clients pick a time that works — no phone tag." },
      { title: "Keep all leads organized", description: "Every inquiry in one dashboard." },
    ],
    howItWorks: [
      { step: "1", title: "Create your card", description: "Add listings, services, and contact info." },
      { step: "2", title: "Share your link", description: "Use it in ads, social media, and messages." },
      { step: "3", title: "Capture leads and book clients", description: "Buyers and sellers reach you instantly." },
    ],
    productPreview: {
      headline: "Everything you need to win more clients",
      highlights: [
        "Listing showcase",
        "Lead capture forms",
        "Consultation booking",
        "CRM dashboard",
      ],
      caption: "Never lose a lead again.",
    },
    featuresHeadline: "Built for realtors who want more clients",
    features: [
      { title: "Capture Leads", icon: "📥", description: "Get buyer and seller inquiries instantly." },
      { title: "Show Listings", icon: "🏡", description: "Display featured properties in one place." },
      { title: "Book Consultations", icon: "📅", description: "Let clients schedule time with you." },
      { title: "Scan Business Cards", icon: "📸", description: "Scan cards at open houses to instantly add contacts to your CRM." },
      { title: "Stay Organized", icon: "📊", description: "Track all leads and conversations." },
    ],
    socialProof: {
      quote: "I started getting more serious buyer inquiries within days.",
      attribution: "Local Realtor",
    },
    testimonialIntro: "Top-producing agents choose guzzl.pro",
    demoSection: {
      headline: "See a real realtor card",
      buttonText: "View Example Realtor Card",
    },
    pricingPreview: {
      headline: "Start free. Upgrade when you're ready.",
      plans: [
        { name: "Free", description: "Basic card and lead capture" },
        { name: "Pro", description: "Automation, analytics, unlimited features" },
        { name: "Pro Plus", description: "Full business tools and customization" },
      ],
    },
    finalCtaHeadline: "Start capturing more clients today.",
    finalCtaSubheadline: "Create your realtor card in minutes and never miss another opportunity.",
    footerNote: "Built for real estate agents, brokers, and property professionals.",
    focusAreas: ["Lead Capture", "Listing Showcase", "Consultations"],
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
      { title: "Business Card Scanner", icon: "📸", description: "Scan client cards at events and networking mixers to grow your contact list." },
      { title: "Package Display", icon: "💎", description: "Show your pricing packages with what's included in each tier." },
      { title: "Client Testimonials", icon: "⭐", description: "Display glowing reviews from past clients to build trust." },
      { title: "Social Links", icon: "📱", description: "Connect your Instagram, TikTok, and portfolio site in one place." },
    ],
    testimonialIntro: "Photographers are booking more sessions with guzzl.pro",
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
    testimonialIntro: "Landscapers are growing faster with guzzl.pro",
    focusAreas: ["Before/After Projects", "Quote Requests", "Seasonal Promotions"],
  },
};

export function getIndustryPage(slug: string): IndustryPageData | undefined {
  return INDUSTRY_PAGES[slug];
}

export function getIndustryDemoCard(page: IndustryPageData): DemoCard | undefined {
  return getDemoCardBySlug(page.demoSlug);
}
