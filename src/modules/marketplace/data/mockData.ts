export interface MockBusiness {
  id: string;
  slug: string;
  business_name: string;
  description: string;
  headline: string;
  logo_url: string;
  cover_image_url: string;
  location_city: string;
  location_region: string;
  phone: string;
  email: string;
  website: string;
  avg_rating: number;
  review_count: number;
  categories: string[];
  is_available_today: boolean;
  is_top_rated: boolean;
  is_featured: boolean;
  is_boosted: boolean;
  has_premium_badge: boolean;
  created_at: string;
  services: MockService[];
  reviews: MockReview[];
}

export interface MockService {
  id: string;
  title: string;
  description: string;
  price_type: "fixed" | "starting_at" | "quote_only";
  price_amount: number | null;
  duration_minutes: number | null;
}

export interface MockReview {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export const CATEGORIES = [
  { key: "landscaping", label: "Landscaping", icon: "🌿" },
  { key: "snow-removal", label: "Snow Removal", icon: "❄️" },
  { key: "cleaning", label: "Cleaning", icon: "🧹" },
  { key: "handyman", label: "Handyman", icon: "🔧" },
  { key: "roofing", label: "Roofing", icon: "🏠" },
  { key: "junk-removal", label: "Junk Removal", icon: "🗑️" },
  { key: "moving", label: "Moving", icon: "📦" },
  { key: "lawn-care", label: "Lawn Care", icon: "🌱" },
  { key: "plumbing", label: "Plumbing", icon: "🚿" },
  { key: "electrical", label: "Electrical", icon: "⚡" },
  { key: "painting", label: "Painting", icon: "🎨" },
  { key: "hvac", label: "HVAC", icon: "🌡️" },
  { key: "pest-control", label: "Pest Control", icon: "🐜" },
  { key: "fencing", label: "Fencing", icon: "🏗️" },
  { key: "flooring", label: "Flooring", icon: "🪵" },
  { key: "pressure-washing", label: "Pressure Washing", icon: "💦" },
  { key: "tree-service", label: "Tree Service", icon: "🌳" },
  { key: "garage-door", label: "Garage Doors", icon: "🚪" },
  { key: "appliance-repair", label: "Appliance Repair", icon: "🔌" },
  { key: "locksmith", label: "Locksmith", icon: "🔑" },
  { key: "carpentry", label: "Carpentry", icon: "🪚" },
  { key: "masonry", label: "Masonry", icon: "🧱" },
  { key: "towing", label: "Towing", icon: "🚗" },
  { key: "auto-detailing", label: "Auto Detailing", icon: "✨" },
  { key: "welding", label: "Welding", icon: "🔥" },
  { key: "drywall", label: "Drywall", icon: "🪟" },
  { key: "window-cleaning", label: "Window Cleaning", icon: "🪟" },
  { key: "gutter-cleaning", label: "Gutter Cleaning", icon: "🏡" },
  { key: "pool-service", label: "Pool Service", icon: "🏊" },
  { key: "septic-service", label: "Septic Service", icon: "🚽" },
  { key: "excavation", label: "Excavation", icon: "🚜" },
  { key: "concrete", label: "Concrete", icon: "🏗️" },
  { key: "siding", label: "Siding", icon: "🏘️" },
  { key: "insulation", label: "Insulation", icon: "🧤" },
  { key: "solar", label: "Solar", icon: "☀️" },
  { key: "security-systems", label: "Security Systems", icon: "📹" },
  { key: "home-inspection", label: "Home Inspection", icon: "🔍" },
  { key: "interior-design", label: "Interior Design", icon: "🛋️" },
  { key: "photography", label: "Photography", icon: "📷" },
  { key: "catering", label: "Catering", icon: "🍽️" },
  { key: "event-planning", label: "Event Planning", icon: "🎉" },
  { key: "tutoring", label: "Tutoring", icon: "📚" },
  { key: "pet-care", label: "Pet Care", icon: "🐕" },
  { key: "personal-training", label: "Personal Training", icon: "💪" },
  { key: "massage-therapy", label: "Massage Therapy", icon: "💆" },
  { key: "notary", label: "Notary", icon: "📝" },
  { key: "tax-prep", label: "Tax Preparation", icon: "🧾" },
  { key: "accounting", label: "Accounting", icon: "📊" },
  { key: "web-design", label: "Web Design", icon: "💻" },
  { key: "graphic-design", label: "Graphic Design", icon: "🖌️" },
  { key: "video-production", label: "Video Production", icon: "🎬" },
  { key: "dj-services", label: "DJ Services", icon: "🎧" },
  { key: "music-lessons", label: "Music Lessons", icon: "🎵" },
  { key: "yoga", label: "Yoga & Wellness", icon: "🧘" },
  { key: "childcare", label: "Childcare", icon: "👶" },
  { key: "elderly-care", label: "Elderly Care", icon: "🧓" },
  { key: "dog-walking", label: "Dog Walking", icon: "🐕‍🦺" },
  { key: "pet-grooming", label: "Pet Grooming", icon: "🐩" },
  { key: "veterinary", label: "Veterinary", icon: "🩺" },
  { key: "courier", label: "Courier & Delivery", icon: "🚚" },
  { key: "furniture-assembly", label: "Furniture Assembly", icon: "🪑" },
  { key: "upholstery", label: "Upholstery", icon: "🛏️" },
  { key: "tailoring", label: "Tailoring", icon: "🧵" },
  { key: "shoe-repair", label: "Shoe Repair", icon: "👞" },
  { key: "dry-cleaning", label: "Dry Cleaning", icon: "👔" },
  { key: "laundry", label: "Laundry Service", icon: "🧺" },
  { key: "car-wash", label: "Car Wash", icon: "🚙" },
  { key: "mechanic", label: "Auto Mechanic", icon: "🔩" },
  { key: "tire-service", label: "Tire Service", icon: "🛞" },
  { key: "boat-repair", label: "Boat Repair", icon: "⛵" },
  { key: "small-engine", label: "Small Engine Repair", icon: "⚙️" },
  { key: "snow-plowing", label: "Snow Plowing", icon: "🌨️" },
  { key: "irrigation", label: "Irrigation", icon: "💧" },
  { key: "hardscaping", label: "Hardscaping", icon: "🪨" },
  { key: "deck-building", label: "Deck Building", icon: "🪵" },
  { key: "shed-building", label: "Shed Building", icon: "🛖" },
  { key: "kitchen-remodel", label: "Kitchen Remodel", icon: "🍳" },
  { key: "bathroom-remodel", label: "Bathroom Remodel", icon: "🛁" },
  { key: "basement-finish", label: "Basement Finishing", icon: "🏗️" },
  { key: "chimney", label: "Chimney Service", icon: "🏭" },
  { key: "glass-repair", label: "Glass Repair", icon: "🪞" },
  { key: "signage", label: "Signage & Wraps", icon: "🪧" },
  { key: "printing", label: "Printing Services", icon: "🖨️" },
  { key: "translation", label: "Translation", icon: "🌐" },
  { key: "legal-services", label: "Legal Services", icon: "⚖️" },
  { key: "real-estate", label: "Real Estate", icon: "🏡" },
  { key: "home-staging", label: "Home Staging", icon: "🏠" },
  { key: "cleaning-commercial", label: "Commercial Cleaning", icon: "🏢" },
  { key: "waste-management", label: "Waste Management", icon: "♻️" },
  { key: "land-survey", label: "Land Surveying", icon: "📐" },
  { key: "architecture", label: "Architecture", icon: "📏" },
  { key: "engineering", label: "Engineering", icon: "🔬" },
  { key: "it-support", label: "IT Support", icon: "🖥️" },
  { key: "network-cabling", label: "Network & Cabling", icon: "🔗" },
  { key: "smart-home", label: "Smart Home Setup", icon: "🏠" },
  { key: "drone-services", label: "Drone Services", icon: "🚁" },
  { key: "3d-printing", label: "3D Printing", icon: "🖨️" },
  { key: "asphalt-paving", label: "Asphalt & Paving", icon: "🛣️" },
  { key: "awning", label: "Awning Installation", icon: "⛺" },
  { key: "blinds-shutters", label: "Blinds & Shutters", icon: "🪟" },
  { key: "cabinet-making", label: "Cabinet Making", icon: "🗄️" },
  { key: "carpet-cleaning", label: "Carpet Cleaning", icon: "🧽" },
  { key: "closet-org", label: "Closet Organization", icon: "👗" },
  { key: "countertops", label: "Countertops", icon: "🪨" },
  { key: "demolition", label: "Demolition", icon: "🏚️" },
  { key: "door-install", label: "Door Installation", icon: "🚪" },
  { key: "duct-cleaning", label: "Duct Cleaning", icon: "🌬️" },
  { key: "epoxy-coating", label: "Epoxy Coating", icon: "🎨" },
  { key: "fireplace", label: "Fireplace Service", icon: "🔥" },
  { key: "foundation-repair", label: "Foundation Repair", icon: "🧱" },
  { key: "framing", label: "Framing", icon: "🪵" },
  { key: "generator", label: "Generator Install", icon: "🔋" },
  { key: "grading", label: "Grading & Leveling", icon: "🚜" },
  { key: "greenhouse", label: "Greenhouse Building", icon: "🌱" },
  { key: "gutter-install", label: "Gutter Installation", icon: "🏗️" },
  { key: "home-automation", label: "Home Automation", icon: "📱" },
  { key: "hot-tub", label: "Hot Tub Service", icon: "🛁" },
  { key: "jetting", label: "Hydro Jetting", icon: "💦" },
  { key: "landscape-design", label: "Landscape Design", icon: "🌺" },
  { key: "log-splitting", label: "Log Splitting", icon: "🪓" },
  { key: "mold-remediation", label: "Mold Remediation", icon: "🦠" },
  { key: "mosquito-control", label: "Mosquito Control", icon: "🦟" },
  { key: "muralist", label: "Mural Painting", icon: "🖼️" },
  { key: "organizing", label: "Home Organizing", icon: "📦" },
  { key: "outdoor-kitchen", label: "Outdoor Kitchen", icon: "🍖" },
  { key: "patio", label: "Patio Construction", icon: "🪑" },
  { key: "pergola", label: "Pergola Building", icon: "🏡" },
  { key: "piano-tuning", label: "Piano Tuning", icon: "🎹" },
  { key: "plastering", label: "Plastering", icon: "🧱" },
  { key: "pond-building", label: "Pond Building", icon: "🐟" },
  { key: "radon-testing", label: "Radon Testing", icon: "☢️" },
  { key: "retaining-walls", label: "Retaining Walls", icon: "🧱" },
  { key: "rv-repair", label: "RV Repair", icon: "🚐" },
  { key: "screen-repair", label: "Screen Repair", icon: "🪟" },
  { key: "skylight", label: "Skylight Install", icon: "☀️" },
  { key: "staining", label: "Staining & Sealing", icon: "🪵" },
  { key: "stone-masonry", label: "Stone Masonry", icon: "🪨" },
  { key: "stucco", label: "Stucco", icon: "🏠" },
  { key: "stump-grinding", label: "Stump Grinding", icon: "🌳" },
  { key: "sunroom", label: "Sunroom Addition", icon: "🌤️" },
  { key: "tile-install", label: "Tile Installation", icon: "🔲" },
  { key: "wallpaper", label: "Wallpaper Install", icon: "🎨" },
  { key: "water-heater", label: "Water Heater", icon: "🚿" },
  { key: "water-treatment", label: "Water Treatment", icon: "💧" },
  { key: "waterproofing", label: "Waterproofing", icon: "🌧️" },
  { key: "well-drilling", label: "Well Drilling", icon: "💧" },
  { key: "wildlife-removal", label: "Wildlife Removal", icon: "🦝" },
  { key: "window-install", label: "Window Installation", icon: "🪟" },
  { key: "window-tinting", label: "Window Tinting", icon: "🕶️" },
  { key: "woodworking", label: "Woodworking", icon: "🪚" },
  { key: "wrought-iron", label: "Wrought Iron", icon: "⚒️" },
  { key: "bobcat-service", label: "Bobcat Service", icon: "🚜" },
  { key: "bookkeeping", label: "Bookkeeping", icon: "📒" },
  { key: "bridal-services", label: "Bridal Services", icon: "💍" },
  { key: "cake-decorating", label: "Cake Decorating", icon: "🎂" },
  { key: "calligraphy", label: "Calligraphy", icon: "✒️" },
  { key: "car-audio", label: "Car Audio Install", icon: "🔊" },
  { key: "ceramic-coating", label: "Ceramic Coating", icon: "✨" },
  { key: "computer-repair", label: "Computer Repair", icon: "🖥️" },
  { key: "counseling", label: "Counseling", icon: "🧠" },
  { key: "crane-service", label: "Crane Service", icon: "🏗️" },
  { key: "custom-framing", label: "Custom Framing", icon: "🖼️" },
  { key: "data-recovery", label: "Data Recovery", icon: "💾" },
  { key: "engraving", label: "Engraving", icon: "✏️" },
  { key: "estate-sale", label: "Estate Sales", icon: "🏷️" },
  { key: "farrier", label: "Farrier", icon: "🐴" },
  { key: "fire-safety", label: "Fire Safety", icon: "🧯" },
  { key: "fishing-guide", label: "Fishing Guide", icon: "🎣" },
  { key: "floral-design", label: "Floral Design", icon: "💐" },
  { key: "food-truck", label: "Food Truck", icon: "🍔" },
  { key: "hauling", label: "Hauling", icon: "🛻" },
  { key: "hunting-guide", label: "Hunting Guide", icon: "🦌" },
  { key: "jewelry-repair", label: "Jewelry Repair", icon: "💎" },
  { key: "knife-sharpening", label: "Knife Sharpening", icon: "🔪" },
  { key: "limo-service", label: "Limo Service", icon: "🚗" },
  { key: "makeup-artist", label: "Makeup Artist", icon: "💄" },
  { key: "martial-arts", label: "Martial Arts", icon: "🥋" },
  { key: "party-rental", label: "Party Rentals", icon: "🎈" },
  { key: "phone-repair", label: "Phone Repair", icon: "📱" },
  { key: "private-chef", label: "Private Chef", icon: "👨‍🍳" },
  { key: "property-mgmt", label: "Property Management", icon: "🏘️" },
  { key: "sewing", label: "Sewing & Alterations", icon: "🪡" },
  { key: "spray-foam", label: "Spray Foam", icon: "🫧" },
  { key: "tattoo", label: "Tattoo Artist", icon: "🎨" },
  { key: "tree-planting", label: "Tree Planting", icon: "🌲" },
  { key: "trophy-making", label: "Trophy & Awards", icon: "🏆" },
  { key: "valet-parking", label: "Valet Parking", icon: "🅿️" },
  { key: "vent-cleaning", label: "Vent Cleaning", icon: "🌀" },
  { key: "virtual-assistant", label: "Virtual Assistant", icon: "🤖" },
  { key: "voiceover", label: "Voiceover Artist", icon: "🎙️" },
  { key: "wedding-officiant", label: "Wedding Officiant", icon: "💒" },
  { key: "weed-control", label: "Weed Control", icon: "🌾" },
  { key: "bail-bonds", label: "Bail Bonds", icon: "⚖️" },
  { key: "bartending", label: "Bartending", icon: "🍸" },
  { key: "biohazard", label: "Biohazard Cleanup", icon: "☣️" },
  { key: "boarding-kennel", label: "Boarding & Kennel", icon: "🐾" },
  { key: "body-shop", label: "Body Shop", icon: "🚗" },
  { key: "bounce-house", label: "Bounce House Rental", icon: "🏰" },
  { key: "carpooling", label: "Carpooling Service", icon: "🚌" },
  { key: "chimney-sweep", label: "Chimney Sweep", icon: "🧹" },
  { key: "coin-laundry", label: "Coin Laundry", icon: "🪙" },
  { key: "composting", label: "Composting Service", icon: "🌿" },
  { key: "concrete-cutting", label: "Concrete Cutting", icon: "🪨" },
  { key: "craft-workshop", label: "Craft Workshops", icon: "🧶" },
  { key: "custom-closets", label: "Custom Closets", icon: "🚪" },
  { key: "dance-lessons", label: "Dance Lessons", icon: "💃" },
  { key: "dethatching", label: "Dethatching", icon: "🌾" },
  { key: "dog-training", label: "Dog Training", icon: "🐕" },
  { key: "embroidery", label: "Embroidery", icon: "🧵" },
  { key: "equipment-rental", label: "Equipment Rental", icon: "🔧" },
  { key: "ev-charger", label: "EV Charger Install", icon: "🔌" },
  { key: "fence-staining", label: "Fence Staining", icon: "🏗️" },
  { key: "firewood", label: "Firewood Delivery", icon: "🪵" },
  { key: "floor-polishing", label: "Floor Polishing", icon: "✨" },
  { key: "garage-org", label: "Garage Organization", icon: "🚗" },
  { key: "golf-cart", label: "Golf Cart Repair", icon: "⛳" },
  { key: "grout-repair", label: "Grout Repair", icon: "🔲" },
  { key: "hair-stylist", label: "Hair Stylist", icon: "💇" },
  { key: "handwriting", label: "Handwriting Analysis", icon: "📝" },
  { key: "holiday-decor", label: "Holiday Decorating", icon: "🎄" },
  { key: "home-theater", label: "Home Theater", icon: "🎬" },
  { key: "horse-boarding", label: "Horse Boarding", icon: "🐴" },
  { key: "house-sitting", label: "House Sitting", icon: "🏠" },
  { key: "ice-dam", label: "Ice Dam Removal", icon: "🧊" },
  { key: "junk-car", label: "Junk Car Removal", icon: "🚙" },
  { key: "life-coaching", label: "Life Coaching", icon: "🌟" },
  { key: "lockout", label: "Lockout Service", icon: "🔐" },
  { key: "meal-prep", label: "Meal Prep", icon: "🥗" },
  { key: "metal-roofing", label: "Metal Roofing", icon: "🏠" },
  { key: "mobile-car-wash", label: "Mobile Car Wash", icon: "🧼" },
  { key: "mobile-mechanic", label: "Mobile Mechanic", icon: "🔧" },
  { key: "moss-removal", label: "Moss Removal", icon: "🌿" },
  { key: "moving-labor", label: "Moving Labor", icon: "💪" },
  { key: "mural-removal", label: "Graffiti Removal", icon: "🧽" },
  { key: "oil-change", label: "Oil Change", icon: "🛢️" },
  { key: "paint-removal", label: "Paint Removal", icon: "🖌️" },
  { key: "parking-lot", label: "Parking Lot Striping", icon: "🅿️" },
  { key: "personal-shopper", label: "Personal Shopper", icon: "🛍️" },
  { key: "pest-wildlife", label: "Wildlife Control", icon: "🦊" },
  { key: "photo-booth", label: "Photo Booth Rental", icon: "📸" },
  { key: "pickup-delivery", label: "Pickup & Delivery", icon: "📦" },
  { key: "pilot-car", label: "Pilot Car Service", icon: "🚗" },
  { key: "porta-potty", label: "Portable Toilets", icon: "🚽" },
  { key: "resume-writing", label: "Resume Writing", icon: "📄" },
  { key: "roof-cleaning", label: "Roof Cleaning", icon: "🏠" },
  { key: "salt-delivery", label: "Salt Delivery", icon: "🧂" },
  { key: "sandblasting", label: "Sandblasting", icon: "💨" },
  { key: "satellite-tv", label: "Satellite TV Install", icon: "📡" },
  { key: "scaffold-rental", label: "Scaffold Rental", icon: "🏗️" },
  { key: "sealcoating", label: "Sealcoating", icon: "🛣️" },
  { key: "shingle-repair", label: "Shingle Repair", icon: "🏠" },
  { key: "skip-bin", label: "Skip Bin Rental", icon: "🗑️" },
  { key: "smoke-damage", label: "Smoke Damage", icon: "💨" },
  { key: "snow-blowing", label: "Snow Blowing", icon: "❄️" },
  { key: "sod-install", label: "Sod Installation", icon: "🌿" },
  { key: "stair-building", label: "Stair Building", icon: "🪜" },
  { key: "storage-unit", label: "Storage Units", icon: "📦" },
  { key: "storm-damage", label: "Storm Damage", icon: "⛈️" },
  { key: "sump-pump", label: "Sump Pump Service", icon: "💧" },
  { key: "swimming-lessons", label: "Swimming Lessons", icon: "🏊" },
  { key: "tent-rental", label: "Tent Rental", icon: "⛺" },
  { key: "thermography", label: "Thermography", icon: "🌡️" },
  { key: "trailer-repair", label: "Trailer Repair", icon: "🚛" },
  { key: "tree-trimming", label: "Tree Trimming", icon: "✂️" },
  { key: "trench-digging", label: "Trench Digging", icon: "🚜" },
  { key: "upholstery-clean", label: "Upholstery Cleaning", icon: "🛋️" },
  { key: "vacuum-repair", label: "Vacuum Repair", icon: "🔧" },
  { key: "video-surveillance", label: "Video Surveillance", icon: "📹" },
  { key: "vinyl-wrap", label: "Vinyl Wrapping", icon: "🎨" },
  { key: "water-damage", label: "Water Damage", icon: "🌊" },
  { key: "wiring", label: "Wiring & Rewiring", icon: "⚡" },
  { key: "yard-cleanup", label: "Yard Cleanup", icon: "🍂" },
  { key: "yoga-instructor", label: "Yoga Instructor", icon: "🧘" },
].sort((a, b) => a.label.localeCompare(b.label));

const svc = (id: string, title: string, desc: string, priceType: MockService["price_type"], price: number | null, dur: number | null): MockService => ({
  id, title, description: desc, price_type: priceType, price_amount: price, duration_minutes: dur,
});

const rev = (id: string, name: string, rating: number, text: string, date: string): MockReview => ({
  id, reviewer_name: name, rating, review_text: text, created_at: date,
});

export const MOCK_BUSINESSES: MockBusiness[] = [
  {
    id: "b1", slug: "northstar-landscaping", business_name: "NorthStar Landscaping",
    description: "Professional landscaping, yard cleanups, and garden design for residential and commercial properties.",
    headline: "Your yard, our passion.",
    logo_url: "https://ui-avatars.com/api/?name=NL&background=16a34a&color=fff&size=128",
    cover_image_url: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1200&h=400&fit=crop",
    location_city: "Thunder Bay", location_region: "Ontario",
    phone: "(807) 555-0101", email: "info@northstarlandscaping.ca", website: "https://northstarlandscaping.ca",
    avg_rating: 4.8, review_count: 47, categories: ["landscaping", "lawn-care"],
    is_available_today: true, is_top_rated: true, is_featured: true, is_boosted: true, has_premium_badge: true,
    created_at: "2024-01-15",
    services: [
      svc("s1", "Spring Cleanup", "Complete yard cleanup including debris removal and garden prep", "fixed", 250, 180),
      svc("s2", "Lawn Maintenance", "Weekly mowing, edging, and trimming", "starting_at", 75, 60),
      svc("s3", "Garden Design", "Custom garden design and planting", "quote_only", null, null),
    ],
    reviews: [
      rev("r1", "Sarah M.", 5, "Absolutely amazing work. Our yard has never looked better!", "2024-11-20"),
      rev("r2", "James T.", 5, "Reliable, professional, and fairly priced. Highly recommend.", "2024-10-14"),
      rev("r3", "Linda K.", 4, "Great service, showed up on time and did a thorough job.", "2024-09-05"),
    ],
  },
  {
    id: "b2", slug: "frost-king-snow", business_name: "Frost King Snow Removal",
    description: "24/7 snow removal and de-icing for driveways, parking lots, and commercial properties.",
    headline: "We clear the way, every day.",
    logo_url: "https://ui-avatars.com/api/?name=FK&background=3b82f6&color=fff&size=128",
    cover_image_url: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&h=400&fit=crop",
    location_city: "Thunder Bay", location_region: "Ontario",
    phone: "(807) 555-0202", email: "info@frostking.ca", website: "",
    avg_rating: 4.6, review_count: 32, categories: ["snow-removal"],
    is_available_today: true, is_top_rated: true, is_featured: false, is_boosted: true, has_premium_badge: false,
    created_at: "2024-03-10",
    services: [
      svc("s4", "Residential Snow Removal", "Driveway and walkway clearing", "starting_at", 60, 45),
      svc("s5", "Commercial Snow Removal", "Parking lot and building clearing", "quote_only", null, null),
      svc("s6", "De-icing Service", "Salt and sand application", "fixed", 40, 30),
    ],
    reviews: [
      rev("r4", "Mike R.", 5, "They came at 5am before I even woke up. Driveway was spotless.", "2024-12-15"),
      rev("r5", "Amanda G.", 4, "Good service and reliable. Will use again next winter.", "2024-12-01"),
    ],
  },
  {
    id: "b3", slug: "sparkle-clean-pros", business_name: "Sparkle Clean Pros",
    description: "Residential and commercial cleaning services. Deep cleaning, move-in/out, and recurring packages.",
    headline: "A cleaner space, a happier place.",
    logo_url: "https://ui-avatars.com/api/?name=SC&background=ec4899&color=fff&size=128",
    cover_image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop",
    location_city: "Thunder Bay", location_region: "Ontario",
    phone: "(807) 555-0303", email: "hello@sparkleclean.ca", website: "https://sparkleclean.ca",
    avg_rating: 4.9, review_count: 63, categories: ["cleaning"],
    is_available_today: false, is_top_rated: true, is_featured: true, is_boosted: false, has_premium_badge: true,
    created_at: "2023-11-01",
    services: [
      svc("s7", "Standard Cleaning", "Regular home cleaning — kitchen, bathroom, living areas", "fixed", 150, 120),
      svc("s8", "Deep Cleaning", "Thorough top-to-bottom cleaning", "starting_at", 300, 240),
      svc("s9", "Move-In/Out Cleaning", "Complete cleaning for move-in or move-out", "fixed", 400, 300),
    ],
    reviews: [
      rev("r6", "Emily S.", 5, "The best cleaning service I've ever used. My house is spotless!", "2024-11-25"),
      rev("r7", "David P.", 5, "Professional, thorough, and so friendly. 10/10.", "2024-10-30"),
      rev("r8", "Karen W.", 5, "I use them monthly and they never disappoint.", "2024-09-12"),
    ],
  },
  {
    id: "b4", slug: "handyman-hub", business_name: "Handyman Hub",
    description: "General repairs, installations, and maintenance for homes and small businesses.",
    headline: "Fix it right, the first time.",
    logo_url: "https://ui-avatars.com/api/?name=HH&background=f59e0b&color=fff&size=128",
    cover_image_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&h=400&fit=crop",
    location_city: "Thunder Bay", location_region: "Ontario",
    phone: "(807) 555-0404", email: "jobs@handymanhub.ca", website: "",
    avg_rating: 4.5, review_count: 21, categories: ["handyman"],
    is_available_today: true, is_top_rated: false, is_featured: false, is_boosted: false, has_premium_badge: false,
    created_at: "2024-06-20",
    services: [
      svc("s10", "General Repairs", "Drywall, plumbing, electrical basics", "starting_at", 85, 60),
      svc("s11", "Furniture Assembly", "Assemble any flat-pack furniture", "fixed", 75, 60),
      svc("s12", "TV Mounting", "Wall-mount your TV with cable management", "fixed", 120, 45),
    ],
    reviews: [
      rev("r9", "Tom B.", 5, "Fixed my leaky faucet in 20 minutes. Great guy.", "2024-08-22"),
      rev("r10", "Nancy L.", 4, "Good work, fair price. Would call again.", "2024-07-15"),
    ],
  },
  {
    id: "b5", slug: "apex-roofing", business_name: "Apex Roofing Solutions",
    description: "Full-service roofing company — inspections, repairs, and full replacements.",
    headline: "Protecting what matters most.",
    logo_url: "https://ui-avatars.com/api/?name=AR&background=ef4444&color=fff&size=128",
    cover_image_url: "https://images.unsplash.com/photo-1632759145023-0af740bd5e31?w=1200&h=400&fit=crop",
    location_city: "Thunder Bay", location_region: "Ontario",
    phone: "(807) 555-0505", email: "quotes@apexroofing.ca", website: "https://apexroofing.ca",
    avg_rating: 4.7, review_count: 18, categories: ["roofing"],
    is_available_today: false, is_top_rated: false, is_featured: false, is_boosted: false, has_premium_badge: false,
    created_at: "2024-08-01",
    services: [
      svc("s13", "Roof Inspection", "Complete roof assessment with written report", "fixed", 199, 90),
      svc("s14", "Roof Repair", "Patch leaks, replace shingles, fix flashing", "quote_only", null, null),
      svc("s15", "Full Roof Replacement", "Complete tear-off and new installation", "quote_only", null, null),
    ],
    reviews: [
      rev("r11", "Greg H.", 5, "Professional crew, excellent workmanship. Roof looks brand new.", "2024-09-30"),
      rev("r12", "Diane F.", 5, "Honest assessment — they actually saved me money by recommending a repair instead of replacement.", "2024-09-10"),
    ],
  },
  {
    id: "b6", slug: "quick-haul-junk", business_name: "Quick Haul Junk Removal",
    description: "Fast, eco-friendly junk removal. We recycle and donate whenever possible.",
    headline: "Gone in 60 minutes.",
    logo_url: "https://ui-avatars.com/api/?name=QH&background=8b5cf6&color=fff&size=128",
    cover_image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&h=400&fit=crop",
    location_city: "Thunder Bay", location_region: "Ontario",
    phone: "(807) 555-0606", email: "book@quickhaul.ca", website: "",
    avg_rating: 4.4, review_count: 15, categories: ["junk-removal"],
    is_available_today: true, is_top_rated: false, is_featured: false, is_boosted: false, has_premium_badge: false,
    created_at: "2024-09-01",
    services: [
      svc("s16", "Single Item Pickup", "One large item removal", "fixed", 50, 30),
      svc("s17", "Half Truck Load", "Fill half our truck with your junk", "fixed", 250, 60),
      svc("s18", "Full Truck Load", "Full truck — garage cleanouts, estate clearing", "fixed", 450, 120),
    ],
    reviews: [
      rev("r13", "Paul M.", 4, "Quick, friendly, and didn't damage anything. Happy customer.", "2024-10-20"),
    ],
  },
];

export function getBusinessBySlug(slug: string): MockBusiness | undefined {
  return MOCK_BUSINESSES.find((b) => b.slug === slug);
}

export function getBusinessesByCategory(category: string): MockBusiness[] {
  return MOCK_BUSINESSES.filter((b) => b.categories.includes(category));
}

export function getFeaturedBusinesses(): MockBusiness[] {
  return MOCK_BUSINESSES.filter((b) => b.is_featured).slice(0, 6);
}

export function getBoostedBusinesses(): MockBusiness[] {
  return MOCK_BUSINESSES.filter((b) => b.is_boosted);
}

export function getTopRatedBusinesses(): MockBusiness[] {
  return [...MOCK_BUSINESSES].sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 6);
}

export function getRecentBusinesses(): MockBusiness[] {
  return [...MOCK_BUSINESSES].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
}
