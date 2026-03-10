import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IndustryInsights {
  professionName: string;
  peerCount: number;
  message?: string;
  benchmarks: {
    avgJobValue: number;
    lowRange: number;
    highRange: number;
    totalEstimates: number;
  } | null;
  trendingServices: { name: string; popularity: number }[];
  bestTimes: {
    bestBookingHour: string | null;
    bestBookingDay: string | null;
    bestPostDay: string | null;
  };
  topSources: { source: string; count: number; pct: number }[];
  industryAverages: {
    leadConversion: number;
    bookingRate: number;
    estimateApproval: number;
    avgJobValue: number;
  };
  userComparison: {
    leadConversion: number;
    bookingRate: number;
    estimateApproval: number;
    avgJobValue: number;
  };
  weeklyTrend: { week: string; leads: number; converted: number }[];
}

export function useIndustryInsights() {
  return useQuery({
    queryKey: ["industry-insights"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("industry-insights");
      if (error) throw error;
      return data?.insights as IndustryInsights | null;
    },
    staleTime: 1000 * 60 * 15, // 15 min
    retry: 1,
  });
}
