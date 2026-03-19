import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInMinutes } from "date-fns";

export interface LeadPerformanceData {
  totalMatches: number;
  totalResponded: number;
  totalWon: number;
  responseRate: number;
  winRate: number;
  avgResponseMinutes: number | null;
  badges: PerformanceBadge[];
  insights: PerformanceInsight[];
}

export interface PerformanceBadge {
  key: string;
  label: string;
  description: string;
  earned: boolean;
  icon: "zap" | "trophy" | "star" | "clock";
}

export interface PerformanceInsight {
  type: "success" | "warning" | "tip";
  message: string;
}

export function useLeadPerformance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lead-performance", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<LeadPerformanceData> => {
      // Fetch all matches for this user
      const { data: matches } = await (supabase as any)
        .from("estimate_matches")
        .select("status, created_at, responded_at")
        .eq("user_id", user!.id);

      // Fetch responses for timing
      const { data: responses } = await (supabase as any)
        .from("job_request_responses")
        .select("created_at, estimate_request_id")
        .eq("user_id", user!.id);

      const allMatches = matches || [];
      const allResponses = responses || [];
      const totalMatches = allMatches.length;
      const totalResponded = allMatches.filter((m: any) => m.status === "responded" || m.status === "accepted").length;
      const totalWon = allMatches.filter((m: any) => m.status === "accepted").length;
      const responseRate = totalMatches > 0 ? Math.round((totalResponded / totalMatches) * 100) : 0;
      const winRate = totalResponded > 0 ? Math.round((totalWon / totalResponded) * 100) : 0;

      // Calculate avg response time
      let avgResponseMinutes: number | null = null;
      const responseTimes: number[] = [];
      for (const match of allMatches) {
        if (match.responded_at && match.created_at) {
          const mins = differenceInMinutes(new Date(match.responded_at), new Date(match.created_at));
          if (mins >= 0 && mins < 10080) responseTimes.push(mins); // cap at 1 week
        }
      }
      if (responseTimes.length > 0) {
        avgResponseMinutes = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      }

      // Determine badges
      const badges: PerformanceBadge[] = [
        {
          key: "fast_responder",
          label: "Fast Responder",
          description: "Average response under 30 minutes",
          earned: avgResponseMinutes !== null && avgResponseMinutes <= 30,
          icon: "clock",
        },
        {
          key: "top_responder",
          label: "Top Responder",
          description: "Response rate above 80%",
          earned: responseRate >= 80 && totalMatches >= 3,
          icon: "zap",
        },
        {
          key: "high_win_rate",
          label: "High Closer",
          description: "Win rate above 40%",
          earned: winRate >= 40 && totalResponded >= 3,
          icon: "trophy",
        },
        {
          key: "active_pro",
          label: "Active Pro",
          description: "Responded to 10+ requests",
          earned: totalResponded >= 10,
          icon: "star",
        },
      ];

      // Generate insights
      const insights: PerformanceInsight[] = [];
      if (totalMatches === 0) {
        insights.push({ type: "tip", message: "Complete your profile and go On Duty to start receiving job requests." });
      } else {
        if (responseRate >= 80) {
          insights.push({ type: "success", message: `Great response rate of ${responseRate}%! This keeps you visible to customers.` });
        } else if (responseRate < 50 && totalMatches >= 3) {
          insights.push({ type: "warning", message: `Your response rate is ${responseRate}%. Respond to more requests to improve your ranking.` });
        }

        if (avgResponseMinutes !== null && avgResponseMinutes <= 30) {
          insights.push({ type: "success", message: `Avg response time of ${avgResponseMinutes} min — customers love fast replies!` });
        } else if (avgResponseMinutes !== null && avgResponseMinutes > 120) {
          insights.push({ type: "warning", message: `Average response time is ${Math.round(avgResponseMinutes / 60)}h. Faster replies win more leads.` });
        }

        if (winRate >= 40 && totalResponded >= 3) {
          insights.push({ type: "success", message: `${winRate}% win rate — you're converting leads well.` });
        } else if (winRate < 20 && totalResponded >= 5) {
          insights.push({ type: "tip", message: "Try including a price estimate and clear availability in your responses to improve conversions." });
        }

        if (totalResponded > 0 && totalResponded < 5) {
          insights.push({ type: "tip", message: "Keep responding to requests — consistency builds trust and improves your ranking." });
        }
      }

      return {
        totalMatches,
        totalResponded,
        totalWon,
        responseRate,
        winRate,
        avgResponseMinutes,
        badges,
        insights,
      };
    },
    refetchInterval: 120_000,
  });
}
