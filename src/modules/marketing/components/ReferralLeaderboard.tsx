import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Crown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  referrer_id: string;
  referrer_name: string | null;
  avatar_url: string | null;
  total_referrals: number;
  completed_referrals: number;
  total_reward_days: number;
}

function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["referral-leaderboard"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("referral_leaderboard")
        .select("*")
        .limit(10);
      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    },
  });
}

const RANK_ICONS = [Crown, Trophy, Medal];
const RANK_COLORS = ["text-yellow-500", "text-primary", "text-amber-600"];

export default function ReferralLeaderboard() {
  const { data: leaders = [], isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No referrals yet. Be the first on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Top Referrers</h2>
      </div>
      <div className="divide-y divide-border">
        {leaders.map((entry, i) => {
          const RankIcon = RANK_ICONS[i] || Award;
          const rankColor = RANK_COLORS[i] || "text-muted-foreground";
          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent((entry.referrer_name || "?").slice(0, 2))}&background=3B82F6&color=fff&size=80`;

          return (
            <motion.div
              key={entry.referrer_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="w-7 flex justify-center">
                <RankIcon className={`h-4 w-4 ${rankColor}`} />
              </div>
              <img
                src={entry.avatar_url || fallback}
                alt={entry.referrer_name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {entry.referrer_name || "Anonymous"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {entry.completed_referrals} activated · {entry.total_reward_days} days earned
                </p>
              </div>
              <Badge variant={i === 0 ? "default" : "secondary"} className="text-xs shrink-0">
                {entry.total_referrals} invites
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
