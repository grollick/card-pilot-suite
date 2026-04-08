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
      { name: "Deck & Patio", description: "Outdoor living spaces" },
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
      { name: "EV Charger Install", description: "Level 2 home charging" },
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
      { name: "Pipe Repair", description: "Leak detection & fix" },
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
      { name: "Irrigation Systems", description: "Efficient water management" },
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
      { name: "Drywall Repair", description: "Patch & texture matching" },
    ],
    testimonials: [
      { name: "Jennifer W.", text: "The attention to detail was amazing. Every edge was perfect.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "quote", "book"],
  },
  hvac: {
    tagline: "Comfort you can count on, year-round",
    about: "Heating and cooling experts keeping your home comfortable in every season. Fast response for emergencies, honest pricing for all jobs.",
    services: [
      { name: "AC Repair", description: "Same-day cooling fixes" },
      { name: "Furnace Service", description: "Tune-ups & repairs" },
      { name: "System Installation", description: "New HVAC systems" },
      { name: "Duct Cleaning", description: "Improved air quality" },
    ],
    testimonials: [
      { name: "Carlos R.", text: "AC went out on the hottest day of the year. They were here in 2 hours.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "text", "book"],
    palette: { primary: "#0c4a6e", accent: "#38bdf8" },
  },
  roofer: {
    tagline: "A roof you'll never worry about",
    about: "Expert roofing services from inspection to installation. We protect what matters most — your home and family.",
    services: [
      { name: "Roof Replacement", description: "Shingle, tile & metal" },
      { name: "Storm Damage Repair", description: "Insurance claim assistance" },
      { name: "Leak Detection", description: "Find & fix fast" },
      { name: "Gutter Installation", description: "Seamless aluminum" },
    ],
    testimonials: [
      { name: "Dave P.", text: "Handled our insurance claim and got the roof done in two days. Outstanding.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "quote", "book"],
    palette: { primary: "#78350f", accent: "#f59e0b" },
  },
  "pest control": {
    tagline: "Pests out. Peace of mind in.",
    about: "Thorough pest elimination and prevention using family-safe methods. We don't just treat the problem — we make sure it doesn't come back.",
    services: [
      { name: "General Pest Control", description: "Ants, roaches, spiders" },
      { name: "Termite Treatment", description: "Inspection & elimination" },
      { name: "Rodent Control", description: "Trapping & exclusion" },
      { name: "Mosquito Treatment", description: "Yard barrier sprays" },
    ],
    testimonials: [
      { name: "Amy T.", text: "Haven't seen a single bug since they treated our home. Worth every penny.", role: "Homeowner" },
    ],
    ctaPriority: ["call", "text", "book"],
  },
  cleaner: {
    tagline: "A spotless home without lifting a finger",
    about: "Reliable, thorough house cleaning you can trust. We treat your home like our own — with care, attention, and eco-friendly products.",
    services: [
      { name: "Deep Clean", description: "Top-to-bottom detail" },
      { name: "Weekly Service", description: "Consistent maintenance" },
      { name: "Move-In/Out Clean", description: "Get your deposit back" },
      { name: "Office Cleaning", description: "Professional workspaces" },
    ],
    testimonials: [
      { name: "Sandra L.", text: "I come home to a sparkling house every week. Best decision I've made.", role: "Client" },
    ],
    ctaPriority: ["call", "text", "book"],
    palette: { primary: "#0e7490", accent: "#67e8f9" },
  },
  // ── Real Estate ──
  realtor: {
    tagline: "Your trusted partner in real estate",
    about: "Helping buyers and sellers navigate the market with confidence. Deep local expertise, strong negotiation skills, and a client-first approach.",
    services: [
      { name: "Buyer Representation", description: "Find your dream home" },
      { name: "Seller Strategy", description: "Maximum value, fast close" },
      { name: "Market Analysis", description: "Know your property's worth" },
      { name: "Investment Advisory", description: "Smart property investments" },
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
      { name: "Investment Advisory", description: "Smart property investments" },
    ],
    testimonials: [
      { name: "David & Amy L.", text: "Found us our dream home in three weeks. Incredible negotiation skills.", role: "Homebuyers" },
    ],
    ctaPriority: ["call", "text", "book"],
    palette: { primary: "#1e3a8a", accent: "#3b82f6" },
  },
  "mortgage broker": {
    tagline: "Best rates. Smooth closings. Zero stress.",
    about: "Connecting you with the best mortgage rates from top lenders. We handle the paperwork so you can focus on finding your dream home.",
    services: [
      { name: "Rate Shopping", description: "Compare 20+ lenders" },
      { name: "Pre-Approval", description: "Fast, reliable letters" },
      { name: "Refinancing", description: "Lower your payments" },
      { name: "First-Time Buyer Help", description: "Step-by-step guidance" },
    ],
    testimonials: [
      { name: "Kevin & Marie", text: "Got us a rate we didn't think was possible. Closed in 3 weeks.", role: "Homebuyers" },
    ],
    ctaPriority: ["call", "book", "email"],
    palette: { primary: "#1e3a5f", accent: "#10b981" },
  },
  "insurance agent": {
    tagline: "The right coverage at the right price",
    about: "Protecting what matters most with personalized insurance solutions. We shop the market to find you the best coverage at the best price.",
    services: [
      { name: "Home Insurance", description: "Complete property protection" },
      { name: "Auto Insurance", description: "Competitive rates" },
      { name: "Life Insurance", description: "Family financial security" },
      { name: "Business Insurance", description: "Liability & property" },
    ],
    testimonials: [
      { name: "Rachel T.", text: "Saved us $200/month on bundled coverage. Wish we'd switched sooner.", role: "Client" },
    ],
    ctaPriority: ["call", "book", "email"],
  },
  // ── Beauty & Wellness ──
  barber: {
    tagline: "Sharp cuts. Clean fades. Walk out confident.",
    about: "Precision cuts and grooming in a relaxed atmosphere. Every client leaves looking and feeling their best.",
    services: [
      { name: "Signature Haircut", description: "Tailored to your style" },
      { name: "Beard Sculpt", description: "Hot towel & precision trim" },
      { name: "Premium Package", description: "Cut, beard & hot towel" },
      { name: "Kids' Cut", description: "Ages 12 and under" },
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
      { name: "Extensions", description: "Natural-looking volume" },
    ],
    testimonials: [
      { name: "Rachel P.", text: "Finally found someone who gets my hair! Absolutely love it.", role: "Client" },
    ],
    ctaPriority: ["book", "call", "text"],
  },
  esthetician: {
    tagline: "Glow from the inside out",
    about: "Customized skincare treatments that target your unique concerns. From facials to peels, every session is tailored to reveal your best skin.",
    services: [
      { name: "Custom Facial", description: "Personalized to your skin" },
      { name: "Chemical Peel", description: "Brighten & resurface" },
      { name: "Microdermabrasion", description: "Deep exfoliation" },
      { name: "Lash Extensions", description: "Natural to dramatic" },
    ],
    testimonials: [
      { name: "Priya S.", text: "My skin has never looked this good. She really knows what she's doing.", role: "Client" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#831843", accent: "#f9a8d4" },
  },
  "nail technician": {
    tagline: "Nails that are a work of art",
    about: "Creative, long-lasting nail designs using premium products. From classic manicures to custom nail art, your hands are in expert care.",
    services: [
      { name: "Gel Manicure", description: "Chip-free for 2+ weeks" },
      { name: "Acrylic Full Set", description: "Custom shape & length" },
      { name: "Nail Art", description: "Hand-painted designs" },
      { name: "Spa Pedicure", description: "Relaxing foot treatment" },
    ],
    testimonials: [
      { name: "Jessica M.", text: "My nails always get compliments. She's incredibly talented.", role: "Client" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#7c2d12", accent: "#fb923c" },
  },
  "personal trainer": {
    tagline: "Results-driven fitness coaching",
    about: "Personalized training programs designed to help you reach your goals. Whether you're just starting out or pushing past plateaus.",
    services: [
      { name: "1-on-1 Training", description: "Customized workouts" },
      { name: "Group Sessions", description: "Motivating team environment" },
      { name: "Nutrition Coaching", description: "Meal plans & guidance" },
      { name: "Online Programming", description: "Train anywhere" },
    ],
    testimonials: [
      { name: "Chris M.", text: "Lost 30 pounds and gained so much confidence. Best investment ever.", role: "Client" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#7c3aed", accent: "#06b6d4" },
  },
  "massage therapist": {
    tagline: "Leave feeling renewed",
    about: "Therapeutic massage tailored to your body's needs. Whether you need deep tissue relief or relaxation, every session is designed to restore you.",
    services: [
      { name: "Deep Tissue", description: "Targeted muscle relief" },
      { name: "Swedish Massage", description: "Full-body relaxation" },
      { name: "Sports Massage", description: "Recovery & performance" },
      { name: "Couples Massage", description: "Shared relaxation" },
    ],
    testimonials: [
      { name: "Diane K.", text: "The best massage I've ever had. My chronic back pain is finally manageable.", role: "Client" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#5b21b6", accent: "#a78bfa" },
  },
  therapist: {
    tagline: "A safe space to grow and heal",
    about: "Evidence-based therapy in a warm, judgment-free environment. Together we'll work through challenges and build the life you want.",
    services: [
      { name: "Individual Therapy", description: "1-on-1 sessions" },
      { name: "Couples Counseling", description: "Strengthen your relationship" },
      { name: "Anxiety & Stress", description: "Coping strategies" },
      { name: "Trauma Recovery", description: "EMDR & talk therapy" },
    ],
    testimonials: [
      { name: "Anonymous", text: "Changed my life. I finally feel like myself again.", role: "Client" },
    ],
    ctaPriority: ["book", "email", "call"],
    palette: { primary: "#4c1d95", accent: "#8b5cf6" },
  },
  // ── Creative & Media ──
  photographer: {
    tagline: "Every frame tells your story",
    about: "Capturing authentic moments with an artistic eye. From weddings to commercial shoots, every session is crafted to perfection.",
    services: [
      { name: "Wedding Coverage", description: "Full-day documentation" },
      { name: "Portrait Sessions", description: "Individual & family" },
      { name: "Commercial Shoots", description: "Products & brands" },
      { name: "Event Photography", description: "Corporate & social" },
    ],
    testimonials: [
      { name: "Nicole & Ryan", text: "The photos exceeded every expectation. Pure artistry.", role: "Wedding clients" },
    ],
    ctaPriority: ["book", "email", "call"],
    palette: { primary: "#1e293b", accent: "#e11d48" },
  },
  "graphic designer": {
    tagline: "Designs that stand out and convert",
    about: "Creating visual identities and marketing materials that make brands unforgettable. From logos to full brand systems, every pixel is intentional.",
    services: [
      { name: "Logo Design", description: "Memorable brand marks" },
      { name: "Brand Identity", description: "Complete visual system" },
      { name: "Marketing Materials", description: "Print & digital" },
      { name: "Social Media Graphics", description: "Scroll-stopping content" },
    ],
    testimonials: [
      { name: "Alex F.", text: "Our rebrand tripled our engagement. Worth every penny.", role: "Business owner" },
    ],
    ctaPriority: ["email", "book", "call"],
    palette: { primary: "#1e293b", accent: "#f43f5e" },
  },
  "web developer": {
    tagline: "Websites that work as hard as you do",
    about: "Building fast, responsive websites that drive leads and sales. Clean code, modern design, and results you can measure.",
    services: [
      { name: "Website Design", description: "Custom, responsive sites" },
      { name: "E-Commerce", description: "Online stores that sell" },
      { name: "SEO Optimization", description: "Rank higher on Google" },
      { name: "Maintenance", description: "Updates & support" },
    ],
    testimonials: [
      { name: "Marcus J.", text: "Our new site generates 3x more leads. Best business investment we've made.", role: "Business owner" },
    ],
    ctaPriority: ["email", "book", "call"],
    palette: { primary: "#0f172a", accent: "#06b6d4" },
  },
  dj: {
    tagline: "The party doesn't start until I press play",
    about: "High-energy DJ sets that keep the dance floor packed. Professional sound, seamless mixing, and a vibe that matches your event perfectly.",
    services: [
      { name: "Wedding DJ", description: "Ceremony to last dance" },
      { name: "Corporate Events", description: "Professional atmosphere" },
      { name: "Private Parties", description: "Birthday, house, milestone" },
      { name: "Club Events", description: "EDM, hip-hop, house" },
    ],
    testimonials: [
      { name: "Vanessa & Chris", text: "Everyone is STILL talking about how amazing the music was at our wedding.", role: "Newlyweds" },
    ],
    ctaPriority: ["book", "call", "email"],
    palette: { primary: "#1e1b4b", accent: "#a855f7" },
  },
  // ── Auto ──
  mechanic: {
    tagline: "Honest auto care you can count on",
    about: "Full-service auto repair with transparent pricing. We treat every vehicle like our own.",
    services: [
      { name: "Oil Change", description: "Synthetic & conventional" },
      { name: "Brake Service", description: "Pads, rotors & fluid" },
      { name: "Diagnostics", description: "Check engine & more" },
      { name: "Tire Service", description: "Rotation, balance & replace" },
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
      { name: "Interior Deep Clean", description: "Leather, fabric & carpet" },
    ],
    testimonials: [
      { name: "Mark D.", text: "My car looks better than when I bought it. Incredible work.", role: "Customer" },
    ],
    ctaPriority: ["call", "text", "book"],
  },
  // ── Professional Services ──
  consultant: {
    tagline: "Strategic guidance for growth",
    about: "Helping businesses unlock their full potential through data-driven strategy, operational efficiency, and leadership development.",
    services: [
      { name: "Strategy Session", description: "90-minute deep dive" },
      { name: "Growth Audit", description: "Identify opportunities" },
      { name: "Ongoing Advisory", description: "Monthly retainer" },
      { name: "Workshop Facilitation", description: "Team alignment sessions" },
    ],
    testimonials: [
      { name: "Alex P.", text: "Doubled our revenue in 6 months following their recommendations.", role: "CEO" },
    ],
    ctaPriority: ["book", "email", "call"],
  },
  lawyer: {
    tagline: "Fighting for your best outcome",
    about: "Experienced legal representation with a track record of results. We make the complex simple and advocate fiercely for our clients.",
    services: [
      { name: "Free Consultation", description: "Discuss your case" },
      { name: "Contract Review", description: "Protect your interests" },
      { name: "Business Formation", description: "LLC, Corp & more" },
      { name: "Litigation", description: "Courtroom advocacy" },
    ],
    testimonials: [
      { name: "Robert K.", text: "Got me a settlement I never thought possible. Truly exceptional representation.", role: "Client" },
    ],
    ctaPriority: ["call", "book", "email"],
    palette: { primary: "#1e293b", accent: "#ca8a04" },
  },
  accountant: {
    tagline: "Your money. Managed smarter.",
    about: "Proactive financial guidance that saves you money and keeps you compliant. From tax strategy to bookkeeping, we handle the numbers so you can focus on growth.",
    services: [
      { name: "Tax Preparation", description: "Personal & business" },
      { name: "Bookkeeping", description: "Monthly reconciliation" },
      { name: "Tax Planning", description: "Year-round strategy" },
      { name: "Business Advisory", description: "Financial insights" },
    ],
    testimonials: [
      { name: "Michelle B.", text: "Saved me $8,000 on taxes last year. Worth every dollar.", role: "Small business owner" },
    ],
    ctaPriority: ["book", "call", "email"],
    palette: { primary: "#1e3a5f", accent: "#10b981" },
  },
  // ── Education ──
  tutor: {
    tagline: "Watch your child's confidence soar",
    about: "Patient, personalized tutoring that meets students where they are. We build understanding, not just grades.",
    services: [
      { name: "Math Tutoring", description: "All levels K-12" },
      { name: "Reading & Writing", description: "Comprehension & composition" },
      { name: "Test Prep", description: "SAT, ACT & state exams" },
      { name: "Study Skills", description: "Organization & time management" },
    ],
    testimonials: [
      { name: "Karen & Tom", text: "Our son went from C's to A's. More importantly, he actually likes learning now.", role: "Parents" },
    ],
    ctaPriority: ["book", "call", "email"],
    palette: { primary: "#1e40af", accent: "#fbbf24" },
  },
  // ── Food & Events ──
  chef: {
    tagline: "Unforgettable meals, made for you",
    about: "Private chef services bringing restaurant-quality dining to your home. Fresh ingredients, creative menus, and an experience your guests won't forget.",
    services: [
      { name: "Private Dinner", description: "Multi-course at your home" },
      { name: "Event Catering", description: "Parties & celebrations" },
      { name: "Meal Prep", description: "Weekly custom meals" },
      { name: "Cooking Classes", description: "Learn from a pro" },
    ],
    testimonials: [
      { name: "Linda & Mark", text: "Best dinner party we've ever hosted. Our guests were blown away.", role: "Clients" },
    ],
    ctaPriority: ["book", "call", "email"],
    palette: { primary: "#7c2d12", accent: "#ef4444" },
  },
  "wedding planner": {
    tagline: "Your dream day. Zero stress.",
    about: "Full-service wedding planning that turns your vision into reality. Every detail handled with care so you can enjoy every moment.",
    services: [
      { name: "Full Planning", description: "Concept to cleanup" },
      { name: "Day-Of Coordination", description: "Seamless execution" },
      { name: "Venue Selection", description: "Perfect location match" },
      { name: "Vendor Management", description: "Top-tier team assembly" },
    ],
    testimonials: [
      { name: "Emma & Jake", text: "She made our wedding absolutely magical. We didn't worry about a single thing.", role: "Couple" },
    ],
    ctaPriority: ["book", "call", "email"],
    palette: { primary: "#831843", accent: "#f9a8d4" },
  },
  // ── Pet Services ──
  "dog trainer": {
    tagline: "A well-behaved dog starts here",
    about: "Positive, reward-based dog training that builds a strong bond between you and your pup. From puppies to problem behaviors, we get results.",
    services: [
      { name: "Puppy Training", description: "Foundation skills" },
      { name: "Obedience Program", description: "Basic to advanced" },
      { name: "Behavior Modification", description: "Aggression, anxiety & more" },
      { name: "Group Classes", description: "Socialization & skills" },
    ],
    testimonials: [
      { name: "Sarah & Max", text: "Our dog is like a different animal. Walks are actually enjoyable now!", role: "Dog owner" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#713f12", accent: "#84cc16" },
  },
  // ── Moving ──
  "moving company": {
    tagline: "Your stuff. Handled with care.",
    about: "Professional moving services that take the stress out of relocation. Careful handling, on-time delivery, and transparent pricing.",
    services: [
      { name: "Local Moving", description: "Same-day available" },
      { name: "Long Distance", description: "State-to-state moves" },
      { name: "Packing Services", description: "We pack, you relax" },
      { name: "Storage", description: "Short & long term" },
    ],
    testimonials: [
      { name: "Jake R.", text: "Not a single scratch on anything. These guys are pros.", role: "Customer" },
    ],
    ctaPriority: ["call", "quote", "book"],
    palette: { primary: "#1e3a5f", accent: "#f59e0b" },
  },
  // ── Fitness ──
  "fitness instructor": {
    tagline: "Fun workouts. Real results.",
    about: "High-energy fitness classes that make getting in shape enjoyable. Every class is designed to challenge you while keeping you coming back for more.",
    services: [
      { name: "Group Fitness", description: "HIIT, yoga & more" },
      { name: "Private Sessions", description: "One-on-one coaching" },
      { name: "Virtual Classes", description: "Train from home" },
      { name: "Corporate Wellness", description: "Office fitness programs" },
    ],
    testimonials: [
      { name: "Tina M.", text: "I actually look forward to working out now. Her energy is contagious!", role: "Member" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#be185d", accent: "#f43f5e" },
  },
  // ── Health ──
  dentist: {
    tagline: "A dentist you'll actually want to visit",
    about: "Gentle, modern dental care in a comfortable setting. We use the latest technology to make every visit quick, painless, and stress-free.",
    services: [
      { name: "Cleaning & Exam", description: "Preventive care" },
      { name: "Teeth Whitening", description: "Professional results" },
      { name: "Dental Implants", description: "Permanent restoration" },
      { name: "Emergency Care", description: "Same-day appointments" },
    ],
    testimonials: [
      { name: "Paula J.", text: "First time I've ever left the dentist smiling. Truly painless experience.", role: "Patient" },
    ],
    ctaPriority: ["book", "call", "text"],
    palette: { primary: "#0e7490", accent: "#22d3ee" },
  },
  // ── Sales ──
  "sales representative": {
    tagline: "Connecting you with the right solutions",
    about: "Client-focused sales professional who listens first and recommends second. Building lasting relationships through trust and results.",
    services: [
      { name: "Product Demo", description: "See it in action" },
      { name: "Custom Quote", description: "Tailored to your needs" },
      { name: "Account Management", description: "Ongoing partnership" },
      { name: "Consultation", description: "Needs assessment" },
    ],
    testimonials: [
      { name: "Brian T.", text: "No pressure, just genuine help finding the right solution. Refreshing.", role: "Client" },
    ],
    ctaPriority: ["call", "email", "book"],
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
