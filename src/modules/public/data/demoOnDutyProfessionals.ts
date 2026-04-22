import type { OnDutyProfessional } from "@/hooks/useOnDutyMap";

/**
 * TEMPORARY demo on-duty contractors injected into the map.
 * One per mapped category so users can preview the icon system.
 * Remove this file (and its import in OnDutyMapPage) when real
 * on-duty professionals exist in production.
 */

interface DemoSeed {
  name: string;
  company: string;
  profession_name: string;
  rating: number;
  reviews: number;
  /** offset in degrees from the anchor (lat, lng) */
  dLat: number;
  dLng: number;
}

const DEMO_SEEDS: DemoSeed[] = [
  { name: "Marco Rossi", company: "Rossi Plumbing Co.", profession_name: "Plumber", rating: 4.9, reviews: 142, dLat: 0.012, dLng: 0.018 },
  { name: "Sarah Chen", company: "Voltage Electric", profession_name: "Electrician", rating: 4.8, reviews: 98, dLat: -0.009, dLng: 0.022 },
  { name: "Dave Thompson", company: "Arctic HVAC Services", profession_name: "HVAC Technician", rating: 4.7, reviews: 64, dLat: 0.018, dLng: -0.011 },
  { name: "Luis Hernandez", company: "Peak Roofing", profession_name: "Roofer", rating: 4.9, reviews: 187, dLat: -0.021, dLng: -0.014 },
  { name: "Emma Walker", company: "Walker & Sons Painting", profession_name: "Painter", rating: 4.8, reviews: 76, dLat: 0.025, dLng: 0.008 },
  { name: "Tom O'Brien", company: "Smooth Wall Drywall", profession_name: "Drywall Installer", rating: 4.6, reviews: 41, dLat: -0.015, dLng: 0.027 },
  { name: "Priya Patel", company: "Sole Floors", profession_name: "Flooring Installer", rating: 4.9, reviews: 112, dLat: 0.008, dLng: -0.024 },
  { name: "Jamal Wright", company: "Mosaic Tile Works", profession_name: "Tile Setter", rating: 4.7, reviews: 53, dLat: -0.027, dLng: 0.012 },
  { name: "Roberto Silva", company: "Solid Foundation Concrete", profession_name: "Concrete Contractor", rating: 4.8, reviews: 89, dLat: 0.030, dLng: 0.024 },
  { name: "Kyle Mitchell", company: "Backyard Decks Co.", profession_name: "Deck Builder", rating: 4.9, reviews: 67, dLat: -0.011, dLng: -0.029 },
  { name: "Ahmed Hassan", company: "Iron Gate Fencing", profession_name: "Fence Installer", rating: 4.7, reviews: 38, dLat: 0.020, dLng: 0.032 },
  { name: "Mike Bauer", company: "Bauer Handyman Services", profession_name: "Handyman", rating: 4.8, reviews: 156, dLat: -0.024, dLng: 0.003 },
  { name: "Lisa Tran", company: "Renew Renovations", profession_name: "Renovation Contractor", rating: 4.9, reviews: 94, dLat: 0.016, dLng: -0.019 },
  { name: "James Kowalski", company: "Kowalski General Contracting", profession_name: "General Contractor", rating: 4.9, reviews: 211, dLat: -0.005, dLng: 0.014 },
  { name: "Nora Greenfield", company: "Greenfield Landscaping", profession_name: "Landscaper", rating: 4.8, reviews: 73, dLat: 0.027, dLng: -0.026 },
  { name: "Alex Romano", company: "Spotlight Entertainment", profession_name: "Actor / Performer", rating: 4.7, reviews: 29, dLat: -0.018, dLng: -0.022 },
];

// Toronto fallback if user location isn't available yet
const FALLBACK_ANCHOR: [number, number] = [43.6532, -79.3832];

export function getDemoOnDutyProfessionals(
  anchor: { lat: number; lng: number } | null
): OnDutyProfessional[] {
  const [aLat, aLng] = anchor ? [anchor.lat, anchor.lng] : FALLBACK_ANCHOR;
  const now = new Date().toISOString();

  return DEMO_SEEDS.map((seed, i) => ({
    id: `demo-${i}-${seed.profession_name.toLowerCase().replace(/\W+/g, "-")}`,
    name: seed.name,
    handle: `demo-${i}`,
    avatar_url: null,
    company: seed.company,
    city: null,
    profession_name: seed.profession_name,
    service_area: null,
    avg_rating: seed.rating,
    review_count: seed.reviews,
    avg_response_minutes: 15 + (i % 4) * 10,
    status: "available" as const,
    went_on_duty_at: now,
    badges: ["On Duty", "Demo"],
    lat: aLat + seed.dLat,
    lng: aLng + seed.dLng,
  }));
}
