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
}

interface MarketplaceFilters {
  profession?: string;
  city?: string;
  search?: string;
  service?: string;
}

export function useMarketplaceListings(filters: MarketplaceFilters) {
  return useQuery({
    queryKey: ["marketplace", filters],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MarketplaceListing[]> => {
      const query = supabase
        .from("profiles")
        .select("id, name, handle, avatar_url, company, city, bio, service_area, featured, featured_until, marketplace_enabled, updated_at, professions(name, category)" as any)
        .not("handle", "is", null)
        .not("name", "is", null)
        .order("name");

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      const enabledProfiles = (profilesData ?? []).filter((p: any) => p.marketplace_enabled);
      const userIds = enabledProfiles.map((p: any) => p.id);
      if (userIds.length === 0) return [];

      // Fetch ratings & services in parallel
      const [ratingsResult, servicesResult] = await Promise.all([
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

      const now = new Date();
      let listings: MarketplaceListing[] = enabledProfiles.map((p: any) => {
        const featuredUntil = p.featured_until ? new Date(p.featured_until) : null;
        const isFeatured = p.featured || (featuredUntil && featuredUntil > now);
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
          avg_rating: ratingsMap[p.id]?.avg ?? null,
          review_count: ratingsMap[p.id]?.count ?? 0,
          services: servicesMap[p.id] ?? [],
          updated_at: p.updated_at,
        };
      });

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

      // Full-text search (includes services)
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

      // Ranking: featured → high-rated → active → name
      const nowMs = Date.now();
      listings.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
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

      // Deduplicate service names and count providers
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
