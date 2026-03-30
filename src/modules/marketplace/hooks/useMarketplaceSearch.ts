import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceResult {
  business_id: string;
  slug: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  location_city: string | null;
  location_region: string | null;
  phone: string | null;
  email: string | null;
  avg_rating: number;
  review_count: number;
  marketplace_score: number;
  is_featured: boolean;
  is_boosted: boolean;
  has_premium_badge: boolean;
  categories: string[];
  total_count: number;
}

interface SearchParams {
  city?: string | null;
  keyword?: string | null;
  category?: string | null;
  minRating?: number;
  limit?: number;
  offset?: number;
}

export function useMarketplaceSearch(params: SearchParams) {
  return useQuery({
    queryKey: ["marketplace-search", params],
    queryFn: async (): Promise<{ results: MarketplaceResult[]; totalCount: number }> => {
      const { data, error } = await supabase.rpc("search_marketplace", {
        p_city: params.city || null,
        p_keyword: params.keyword || null,
        p_category: params.category || null,
        p_min_rating: params.minRating ?? 0,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0,
      });

      if (error) throw error;

      const results = (data || []) as unknown as MarketplaceResult[];
      const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;

      return { results, totalCount };
    },
    staleTime: 30_000,
  });
}
