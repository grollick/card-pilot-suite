// ── Static demo card data for 5 professions ──
// These are rendered on the landing page and demo preview pages
// without needing real database records.

import mikeImg from "@/assets/demo/mike-reynolds.jpg";
import marcusImg from "@/assets/demo/marcus-cole.jpg";
import sarahImg from "@/assets/demo/sarah-chen.jpg";
import elenaImg from "@/assets/demo/elena-vasquez.jpg";
import alexImg from "@/assets/demo/alex-greenfield.jpg";
import projectKitchen from "@/assets/demo/project-kitchen.jpg";
import projectDeck from "@/assets/demo/project-deck.jpg";
import coverBarbershop from "@/assets/demo/cover-barbershop.jpg";
import projectBarberFade from "@/assets/demo/project-barber-fade.jpg";
import coverRealtor from "@/assets/demo/cover-realtor.jpg";
import projectRealtorInterior from "@/assets/demo/project-realtor-interior.jpg";
import projectOceanview from "@/assets/demo/project-oceanview.jpg";
import coverPhotographer from "@/assets/demo/cover-photographer.jpg";
import projectWedding from "@/assets/demo/project-wedding.jpg";
import projectPhotographerHeadshots from "@/assets/demo/project-photographer-headshots.jpg";
import coverLandscaper from "@/assets/demo/cover-landscaper.jpg";
import projectBackyard from "@/assets/demo/project-backyard.jpg";
import projectLandscaperFrontyard from "@/assets/demo/project-landscaper-frontyard.jpg";
import jessicaImg from "@/assets/demo/jessica-martinez.jpg";
import coverTrainer from "@/assets/demo/cover-trainer.jpg";
import projectTrainerGroup from "@/assets/demo/project-trainer-group.jpg";
import projectTrainerNutrition from "@/assets/demo/project-trainer-nutrition.jpg";

export interface DemoTestimonial {
  name: string;
  text: string;
  rating: number;
}

export interface DemoProject {
  title: string;
  description: string;
  services: string;
  imageUrl?: string;
}

export interface DemoCard {
  slug: string;
  avatarUrl: string;
  coverUrl: string;
  name: string;
  profession: string;
  company: string;
  tagline: string;
  phone: string;
  email: string;
  city: string;
  bio: string;
  services: { name: string; price: string; duration: string }[];
  testimonials: DemoTestimonial[];
  projects: DemoProject[];
  promoTitle: string;
  promoText: string;
  accentColor: string;
}

export const DEMO_CARDS: DemoCard[] = [
  {
    slug: "demo-contractor",
    avatarUrl: mikeImg,
    coverUrl: projectKitchen,
    name: "Mike Reynolds",
    profession: "Contractor",
    company: "Reynolds Construction",
    tagline: "Quality builds. On time. On budget.",
    phone: "(555) 234-5678",
    email: "mike@reynoldsconstruction.com",
    city: "Toronto, ON",
    bio: "Licensed general contractor with 15 years of experience in residential remodeling, custom builds, and commercial renovations. Fully insured and bonded.",
    services: [
      { name: "Kitchen Remodel", price: "$15,000+", duration: "3–6 weeks" },
      { name: "Bathroom Renovation", price: "$8,000+", duration: "2–4 weeks" },
      { name: "Deck & Patio Build", price: "$5,000+", duration: "1–2 weeks" },
      { name: "Basement Finishing", price: "$12,000+", duration: "4–8 weeks" },
      { name: "Home Addition", price: "$25,000+", duration: "6–12 weeks" },
    ],
    testimonials: [
      { name: "Jennifer M.", text: "Mike transformed our outdated kitchen into a modern masterpiece. On time, on budget, and the attention to detail was incredible. Highly recommend!", rating: 5 },
      { name: "David & Lisa P.", text: "We hired Reynolds Construction for a full basement finish. The craftsmanship was top-notch and the crew was professional every single day.", rating: 5 },
    ],
    projects: [
      { title: "Modern Farmhouse Kitchen", description: "Complete kitchen gut-renovation with custom cabinetry, quartz countertops, and a 12-foot island. Project completed in 5 weeks.", services: "Kitchen Remodel", imageUrl: projectKitchen },
      { title: "Cedar Deck & Pergola", description: "Built a 400 sq ft composite deck with a custom cedar pergola and built-in LED lighting. Perfect outdoor entertaining space.", services: "Deck & Patio Build", imageUrl: projectDeck },
    ],
    promoTitle: "🔨 Spring Special",
    promoText: "Book a kitchen remodel this month and get a free backsplash upgrade ($1,500 value).",
    accentColor: "hsl(25, 95%, 53%)",
  },
  {
    slug: "demo-barber",
    avatarUrl: marcusImg,
    coverUrl: coverBarbershop,
    name: "Marcus Cole",
    profession: "Barber",
    company: "Fresh Cuts Studio",
    tagline: "Sharp looks. Sharp confidence.",
    phone: "(555) 345-6789",
    email: "book@freshcutsstudio.com",
    city: "Vancouver, BC",
    bio: "Master barber specializing in fades, beard sculpting, and modern men's grooming. Walk-ins welcome, appointments preferred.",
    services: [
      { name: "Classic Haircut", price: "$35", duration: "30 min" },
      { name: "Skin Fade", price: "$45", duration: "45 min" },
      { name: "Beard Trim & Shape", price: "$20", duration: "20 min" },
      { name: "Hot Towel Shave", price: "$30", duration: "30 min" },
      { name: "Kids Cut (12 & under)", price: "$25", duration: "25 min" },
    ],
    testimonials: [
      { name: "Chris T.", text: "Marcus is the only barber I trust. My fade is always crispy and the shop has an amazing vibe. Been going for 3 years.", rating: 5 },
      { name: "Andre W.", text: "Booked online, walked in, got the best haircut of my life. The hot towel shave is an experience. 10/10.", rating: 5 },
    ],
    projects: [
      { title: "Wedding Party Grooming", description: "Styled 6 groomsmen with custom fades and beard shaping for a black-tie wedding. On-location service at the hotel.", services: "Skin Fade, Beard Trim", imageUrl: coverBarbershop },
      { title: "Before & After Transformation", description: "Full transformation from grown-out hair to a clean mid-fade with a hard part. Client's first professional haircut in 6 months.", services: "Skin Fade", imageUrl: projectBarberFade },
    ],
    promoTitle: "✂️ First Visit Special",
    promoText: "New clients get 20% off their first haircut. Book online today!",
    accentColor: "hsl(262, 83%, 58%)",
  },
  {
    slug: "demo-realtor",
    avatarUrl: sarahImg,
    coverUrl: coverRealtor,
    name: "Sarah Chen",
    profession: "Realtor",
    company: "Chen Realty Group",
    tagline: "Your home journey starts here.",
    phone: "(555) 456-7890",
    email: "sarah@chenrealtygroup.com",
    city: "San Diego, CA",
    bio: "Top-producing real estate agent with $50M+ in sales. Specializing in coastal San Diego properties. Certified Luxury Home Marketing Specialist.",
    services: [
      { name: "Home Buying Consultation", price: "Free", duration: "60 min" },
      { name: "Listing & Market Analysis", price: "Free", duration: "45 min" },
      { name: "Investment Property Advisory", price: "Custom", duration: "60 min" },
      { name: "Relocation Assistance", price: "Custom", duration: "Ongoing" },
    ],
    testimonials: [
      { name: "The Rodriguez Family", text: "Sarah found us our dream home in La Jolla after just 3 weeks of searching. Her market knowledge is unmatched and she negotiated $40K below asking.", rating: 5 },
      { name: "Tom & Karen B.", text: "We sold our condo in 6 days above asking price. Sarah's staging recommendations and marketing strategy made all the difference.", rating: 5 },
    ],
    projects: [
      { title: "Oceanview Townhome — Sold in 5 Days", description: "Listed at $1.2M, sold for $1.28M. Professional staging, drone photography, and targeted social media campaign generated 22 showings.", services: "Listing & Market Analysis", imageUrl: projectOceanview },
      { title: "First-Time Buyer Success", description: "Helped a young couple navigate a competitive market and secure a 3BR home in North Park with a VA loan — $15K under budget.", services: "Home Buying Consultation", imageUrl: projectRealtorInterior },
    ],
    promoTitle: "🏡 Free Home Valuation",
    promoText: "Curious what your home is worth? Get a free, no-obligation market analysis today.",
    accentColor: "hsl(152, 69%, 40%)",
  },
  {
    slug: "demo-photographer",
    avatarUrl: elenaImg,
    coverUrl: coverPhotographer,
    name: "Elena Vasquez",
    profession: "Photographer",
    company: "Lens & Light Studio",
    tagline: "Capturing moments that last forever.",
    phone: "(555) 567-8901",
    email: "hello@lensandlight.com",
    city: "Calgary, AB",
    bio: "Award-winning photographer specializing in weddings, portraits, and commercial work. Published in Denver Life Magazine. Natural light enthusiast.",
    services: [
      { name: "Wedding Photography", price: "$3,500+", duration: "8 hours" },
      { name: "Portrait Session", price: "$350", duration: "90 min" },
      { name: "Family Session", price: "$450", duration: "60 min" },
      { name: "Headshots", price: "$250", duration: "45 min" },
      { name: "Event Coverage", price: "$2,000+", duration: "4 hours" },
    ],
    testimonials: [
      { name: "Rachel & James K.", text: "Elena captured our wedding beautifully. Every emotion, every detail — she didn't miss a single moment. We cried looking through the gallery.", rating: 5 },
      { name: "Samantha D.", text: "My headshots look so natural and professional. Elena made me feel completely comfortable and the results exceeded my expectations.", rating: 5 },
    ],
    projects: [
      { title: "Mountain Wedding at Red Rocks", description: "Golden hour ceremony with 200 guests at Red Rocks Amphitheatre. 600+ edited photos delivered in 3 weeks with a custom leather-bound album.", services: "Wedding Photography", imageUrl: projectWedding },
      { title: "Corporate Headshot Day", description: "Shot professional headshots for a 40-person law firm in one day. Consistent lighting and branding across all portraits.", services: "Headshots", imageUrl: projectPhotographerHeadshots },
    ],
    promoTitle: "📸 Mini Session Special",
    promoText: "Book a 30-minute mini portrait session for just $199 (normally $350). Limited slots available!",
    accentColor: "hsl(340, 82%, 52%)",
  },
  {
    slug: "demo-landscaper",
    avatarUrl: alexImg,
    coverUrl: coverLandscaper,
    name: "Alex Greenfield",
    profession: "Landscaper",
    company: "Greenfield Landscapes",
    tagline: "Transform your outdoor space.",
    phone: "(555) 678-9012",
    email: "alex@greenfieldlandscapes.com",
    city: "Portland, OR",
    bio: "Full-service landscaping company with 10 years of experience. From design to installation to maintenance — we handle it all. Licensed, bonded, and insured.",
    services: [
      { name: "Landscape Design", price: "$500+", duration: "Consultation" },
      { name: "Lawn Installation", price: "$2,500+", duration: "2–5 days" },
      { name: "Hardscaping & Patios", price: "$5,000+", duration: "1–3 weeks" },
      { name: "Weekly Maintenance", price: "$150/mo", duration: "Ongoing" },
      { name: "Irrigation Install", price: "$1,500+", duration: "1–2 days" },
    ],
    testimonials: [
      { name: "Patricia N.", text: "Alex completely transformed our backyard. The stone patio and native plant garden are stunning. Neighbors can't stop complimenting us!", rating: 5 },
      { name: "Greg & Amy H.", text: "Reliable, creative, and reasonably priced. Our weekly maintenance keeps the yard looking magazine-worthy year-round.", rating: 5 },
    ],
    projects: [
      { title: "Backyard Oasis Renovation", description: "Complete backyard overhaul: removed old lawn, installed a flagstone patio with fire pit, native drought-resistant plantings, and landscape lighting.", services: "Hardscaping & Patios, Landscape Design", imageUrl: projectBackyard },
      { title: "Front Yard Curb Appeal", description: "Replaced overgrown shrubs with a modern low-maintenance design. Added a stone walkway, decorative boulders, and drip irrigation system.", services: "Landscape Design, Irrigation Install", imageUrl: projectLandscaperFrontyard },
    ],
    promoTitle: "🌿 Spring Cleanup Special",
    promoText: "Get a full spring cleanup + first month of maintenance free when you sign up for a yearly plan.",
    accentColor: "hsl(142, 71%, 45%)",
  },
  {
    slug: "demo-trainer",
    avatarUrl: jessicaImg,
    coverUrl: coverTrainer,
    name: "Jessica Martinez",
    profession: "Personal Trainer",
    company: "FitLife Coaching",
    tagline: "Stronger every day.",
    phone: "(555) 789-0123",
    email: "jess@fitlifecoaching.com",
    city: "Montreal, QC",
    bio: "NASM-certified personal trainer and nutrition coach with 8 years of experience. Specializing in body recomposition, strength training, and sustainable lifestyle changes.",
    services: [
      { name: "1-on-1 Training", price: "$85/session", duration: "60 min" },
      { name: "Group Fitness Class", price: "$25/class", duration: "45 min" },
      { name: "Nutrition Coaching", price: "$200/mo", duration: "Ongoing" },
      { name: "Online Program", price: "$150/mo", duration: "Ongoing" },
      { name: "Body Comp Assessment", price: "Free", duration: "30 min" },
    ],
    testimonials: [
      { name: "Maria L.", text: "Jessica helped me lose 30 lbs and completely changed my relationship with food. Her programs are challenging but realistic. Best investment I've made.", rating: 5 },
      { name: "Derek S.", text: "I've tried other trainers but Jess actually listens and adjusts. Down 4 inches on my waist and deadlifting 315 now. She's the real deal.", rating: 5 },
    ],
    projects: [
      { title: "Outdoor Boot Camp Series", description: "12-week community fitness program at Bayfront Park. 40+ participants across 3 weekly sessions with progressive difficulty and team challenges.", services: "Group Fitness Class", imageUrl: projectTrainerGroup },
      { title: "Custom Meal Prep Program", description: "Designed a 90-day nutrition plan for a client prepping for a physique competition. Macros, meal timing, and weekly check-ins included.", services: "Nutrition Coaching", imageUrl: projectTrainerNutrition },
    ],
    promoTitle: "💪 Free Trial Session",
    promoText: "Book your first 1-on-1 training session completely free. No commitment, just results.",
    accentColor: "hsl(199, 89%, 48%)",
  },
];

export function getDemoCardBySlug(slug: string): DemoCard | undefined {
  return DEMO_CARDS.find((c) => c.slug === slug);
}
