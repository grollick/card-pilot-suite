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
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, name, handle, avatar_url, company, city, bio, professions(name, category)")
        .not("handle", "is", null)
        .not("name", "is", null)
        .order("name");

      const { data, error } = await query;
      if (error) throw error;

      let listings: MarketplaceListing[] = (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        avatar_url: p.avatar_url,
        company: p.company,
        city: p.city,
        bio: p.bio,
        profession_name: p.professions?.name ?? null,
        profession_category: p.professions?.category ?? null,
      }));

      // Client-side filtering for flexibility
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
          (l) => l.city?.toLowerCase().includes(city)
        );
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        listings = listings.filter(
          (l) =>
            l.name?.toLowerCase().includes(s) ||
            l.company?.toLowerCase().includes(s) ||
            l.profession_name?.toLowerCase().includes(s) ||
            l.city?.toLowerCase().includes(s)
        );
      }

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
