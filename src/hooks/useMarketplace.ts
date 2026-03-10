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
}

interface MarketplaceFilters {
  profession?: string;
  city?: string;
  search?: string;
}

export function useMarketplaceListings(filters: MarketplaceFilters) {
  return useQuery({
    queryKey: ["marketplace", filters],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MarketplaceListing[]> => {
      // Fetch profiles with marketplace_enabled
      const query = supabase
        .from("profiles")
        .select("id, name, handle, avatar_url, company, city, bio, service_area, featured, marketplace_enabled, professions(name, category)" as any)
        .not("handle", "is", null)
        .not("name", "is", null)
        .order("name");

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Fetch avg ratings for all users in one query
      const userIds = (profilesData ?? []).map((p: any) => p.id);
      let ratingsMap: Record<string, { avg: number; count: number }> = {};

      if (userIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("user_id, rating")
          .eq("is_public", true)
          .in("user_id", userIds);

        if (reviewsData) {
          const grouped: Record<string, number[]> = {};
          reviewsData.forEach((r: any) => {
            if (!grouped[r.user_id]) grouped[r.user_id] = [];
            grouped[r.user_id].push(r.rating);
          });
          for (const [uid, ratings] of Object.entries(grouped)) {
            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            ratingsMap[uid] = { avg: Math.round(avg * 10) / 10, count: ratings.length };
          }
        }
      }

      let listings: MarketplaceListing[] = (profilesData ?? []).map((p: any) => ({
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
        featured: p.featured ?? false,
        avg_rating: ratingsMap[p.id]?.avg ?? null,
        review_count: ratingsMap[p.id]?.count ?? 0,
      }));

      // Client-side filtering
      if (filters.profession) {
        const prof = filters.profession.toLowerCase().replace(/-/g, " ");
        listings = listings.filter(
          (l) =>
            l.profession_name?.toLowerCase().includes(prof) ||
            l.profession_category?.toLowerCase().includes(prof)
        );
      }

      if (filters.city) {
        const city = filters.city.toLowerCase().replace(/-/g, " ");
        listings = listings.filter(
          (l) =>
            l.city?.toLowerCase().includes(city) ||
            l.service_area?.toLowerCase().includes(city)
        );
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        listings = listings.filter(
          (l) =>
            l.name?.toLowerCase().includes(s) ||
            l.company?.toLowerCase().includes(s) ||
            l.profession_name?.toLowerCase().includes(s) ||
            l.city?.toLowerCase().includes(s) ||
            l.service_area?.toLowerCase().includes(s)
        );
      }

      // Sort: featured first, then by rating, then name
      listings.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if ((b.avg_rating ?? 0) !== (a.avg_rating ?? 0)) return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
        return (a.name ?? "").localeCompare(b.name ?? "");
      });

      return listings;
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
