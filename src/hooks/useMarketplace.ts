import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceListing {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  company: string | null;
  city: string | null;
  bio: string | null;
  profession_name: string | null;
  profession_category: string | null;
  service_area: string | null;
  featured: boolean;
  avg_rating: number | null;
  review_count: number;
  services: { name: string; price: number | null }[];
  updated_at: string;
  available_for_work: boolean;
  avg_response_minutes: number | null;
  profile_completeness: number;
  conversion_score: number;
  is_on_duty: boolean;
}

interface MarketplaceFilters {
  profession?: string;
  city?: string;
  search?: string;
  service?: string;
  intent?: "quote" | "book" | "available_now" | "on_duty";
}

function calcProfileCompleteness(p: any): number {
  let score = 0;
  if (p.name) score += 15;
  if (p.avatar_url) score += 20;
  if (p.bio) score += 15;
  if (p.company) score += 10;
  if (p.city) score += 10;
  if (p.service_area) score += 10;
  if (p.professions?.name) score += 10;
  return Math.min(score, 100);
}

export function useMarketplaceListings(filters: MarketplaceFilters) {
  return useQuery({
    queryKey: ["marketplace", filters],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MarketplaceListing[]> => {
      const query = supabase
        .from("profiles")
        .select("id, name, handle, avatar_url, company, city, bio, service_area, featured, featured_until, marketplace_enabled, updated_at, available_for_work, avg_response_minutes, professions(name, category)" as any)
        .not("handle", "is", null)
        .not("name", "is", null)
        .order("name");

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      const enabledProfiles = (profilesData ?? []).filter((p: any) => p.marketplace_enabled);
      const userIds = enabledProfiles.map((p: any) => p.id);
      if (userIds.length === 0) return [];

      // Fetch ratings, services, lead counts & duty status in parallel
      const [ratingsResult, servicesResult, leadsResult, dutyResult] = await Promise.all([
        supabase
          .from("reviews")
          .select("user_id, rating")
          .eq("is_public", true)
          .in("user_id", userIds),
        supabase
          .from("booking_services")
          .select("user_id, name, price")
          .eq("active", true)
          .in("user_id", userIds),
        supabase
          .from("marketplace_lead_credits")
          .select("user_id")
          .in("user_id", userIds),
        supabase
          .from("estimate_duty_status")
          .select("user_id, is_on_duty")
          .eq("is_on_duty", true),
      ]);

      // Build ratings map
      const ratingsMap: Record<string, { avg: number; count: number }> = {};
      if (ratingsResult.data) {
        const grouped: Record<string, number[]> = {};
        ratingsResult.data.forEach((r: any) => {
          if (!grouped[r.user_id]) grouped[r.user_id] = [];
          grouped[r.user_id].push(r.rating);
        });
        for (const [uid, ratings] of Object.entries(grouped)) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          ratingsMap[uid] = { avg: Math.round(avg * 10) / 10, count: ratings.length };
        }
      }

      // Build services map
      const servicesMap: Record<string, { name: string; price: number | null }[]> = {};
      if (servicesResult.data) {
        servicesResult.data.forEach((s: any) => {
          if (!servicesMap[s.user_id]) servicesMap[s.user_id] = [];
          servicesMap[s.user_id].push({ name: s.name, price: s.price });
        });
      }

      // Build lead counts for conversion scoring
      const leadCounts: Record<string, number> = {};
      if (leadsResult.data) {
        leadsResult.data.forEach((l: any) => {
          leadCounts[l.user_id] = (leadCounts[l.user_id] ?? 0) + 1;
        });
      }

      // Build on-duty set
      const onDutySet = new Set<string>();
      if (dutyResult.data) {
        dutyResult.data.forEach((d: any) => onDutySet.add(d.user_id));
      }

      const now = new Date();
      const threeDaysAgoMs = now.getTime() - 3 * 24 * 60 * 60 * 1000;
      const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

      let listings: MarketplaceListing[] = enabledProfiles.map((p: any) => {
        const featuredUntil = p.featured_until ? new Date(p.featured_until) : null;
        const isFeatured = p.featured || (featuredUntil && featuredUntil > now);
        const reviewData = ratingsMap[p.id];
        const services = servicesMap[p.id] ?? [];
        const completeness = calcProfileCompleteness(p);
        const leads = leadCounts[p.id] ?? 0;
        const isOnDuty = onDutySet.has(p.id);

        // ── Velocity multipliers ──
        let velocityBoost = 1.0;
        const respMin = p.avg_response_minutes ?? 999;
        if (respMin < 60) velocityBoost *= 1.3;
        else if (respMin < 240) velocityBoost *= 1.1;

        const profileUpdatedAt = p.updated_at ? new Date(p.updated_at).getTime() : 0;
        if (profileUpdatedAt > threeDaysAgoMs) velocityBoost *= 1.2;
        if (profileUpdatedAt > sevenDaysAgoMs) velocityBoost *= 1.1;

        // On Duty boost
        if (isOnDuty) velocityBoost *= 1.4;

        const baseConversion =
          (reviewData ? reviewData.avg * reviewData.count : 0) * 2 +
          (respMin < 60 ? 30 : respMin < 240 ? 15 : 0) +
          Math.min(leads * 5, 50) +
          completeness * 0.3;

        const conversionScore = baseConversion * velocityBoost;

        return {
          id: p.id,
          name: p.name,
          handle: p.handle,
          avatar_url: p.avatar_url,
          company: p.company,
          city: p.city,
          bio: p.bio,
          profession_name: p.professions?.name ?? null,
          profession_category: p.professions?.category ?? null,
          service_area: p.service_area ?? null,
          featured: isFeatured ?? false,
          avg_rating: reviewData?.avg ?? null,
          review_count: reviewData?.count ?? 0,
          services,
          updated_at: p.updated_at,
          available_for_work: p.available_for_work ?? true,
          avg_response_minutes: p.avg_response_minutes ?? null,
          profile_completeness: completeness,
          conversion_score: conversionScore,
          is_on_duty: isOnDuty,
        };
      });

      // Intent filters
      if (filters.intent === "available_now") {
        listings = listings.filter((l) => l.available_for_work);
      }
      if (filters.intent === "book") {
        listings = listings.filter((l) => l.services.length > 0);
      }
      if (filters.intent === "on_duty") {
        listings = listings.filter((l) => l.is_on_duty);
      }

      // Filter by profession
      if (filters.profession) {
        const prof = filters.profession.toLowerCase().replace(/-/g, " ");
        listings = listings.filter(
          (l) =>
            l.profession_name?.toLowerCase().includes(prof) ||
            l.profession_category?.toLowerCase().includes(prof)
        );
      }

      // Filter by city
      if (filters.city) {
        const city = filters.city.toLowerCase().replace(/-/g, " ");
        listings = listings.filter(
          (l) =>
            l.city?.toLowerCase().includes(city) ||
            l.service_area?.toLowerCase().includes(city)
        );
      }

      // Filter by service
      if (filters.service) {
        const svc = filters.service.toLowerCase().replace(/-/g, " ");
        listings = listings.filter((l) =>
          l.services.some((s) => s.name.toLowerCase().includes(svc))
        );
      }

      // Full-text search
      if (filters.search) {
        const s = filters.search.toLowerCase();
        listings = listings.filter(
          (l) =>
            l.name?.toLowerCase().includes(s) ||
            l.company?.toLowerCase().includes(s) ||
            l.profession_name?.toLowerCase().includes(s) ||
            l.city?.toLowerCase().includes(s) ||
            l.service_area?.toLowerCase().includes(s) ||
            l.services.some((svc) => svc.name.toLowerCase().includes(s))
        );
      }

      // Smart ranking: featured → conversion_score → rating → activity → name
      const nowMs = Date.now();
      listings.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        // On Duty gets priority
        if (a.is_on_duty !== b.is_on_duty) return a.is_on_duty ? -1 : 1;
        // Available for work gets a slight boost
        if (a.available_for_work !== b.available_for_work) return a.available_for_work ? -1 : 1;
        // Conversion score (composite)
        if (b.conversion_score !== a.conversion_score) return b.conversion_score - a.conversion_score;
        const ratingA = a.avg_rating ?? 0;
        const ratingB = b.avg_rating ?? 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        const activeA = nowMs - new Date(a.updated_at).getTime();
        const activeB = nowMs - new Date(b.updated_at).getTime();
        if (activeA !== activeB) return activeA - activeB;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });

      return listings;
    },
  });
}

/** All unique services offered across marketplace listings */
export function useMarketplaceServices() {
  return useQuery({
    queryKey: ["marketplace-services"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_services")
        .select("name, user_id")
        .eq("active", true);
      if (error) throw error;

      const serviceMap = new Map<string, number>();
      (data ?? []).forEach((s: any) => {
        const key = s.name.trim();
        serviceMap.set(key, (serviceMap.get(key) ?? 0) + 1);
      });

      return Array.from(serviceMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    },
  });
}

export function useMarketplaceProfessions() {
  return useQuery({
    queryKey: ["marketplace-professions"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professions")
        .select("name, category")
        .order("category")
        .order("name");
      if (error) throw error;

      const categories = new Map<string, string[]>();
      (data ?? []).forEach((p) => {
        const arr = categories.get(p.category) ?? [];
        arr.push(p.name);
        categories.set(p.category, arr);
      });

      return { professions: data ?? [], categories };
    },
  });
}
