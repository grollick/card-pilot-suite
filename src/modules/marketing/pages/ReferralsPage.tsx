import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Gift, Copy, Users, Check, Loader2, Share2, Trophy, Shield,
  ChevronRight, Sparkles, Target, Crown, MessageSquare, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

const REWARD_TIERS = [
  { count: 1, reward: "14 days Pro free (both!)", days: 14, icon: "🎁" },
  { count: 3, reward: "1 month Pro free", days: 30, icon: "🚀" },
  { count: 5, reward: "2 months Pro free", days: 60, icon: "⭐" },
  { count: 10, reward: "6 months Pro free", days: 180, icon: "👑" },
];

interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  flagged: number;
  total_reward_days: number;
  referrals: Array<{
    id: string;
    referred_email: string;
    status: string;
    created_at: string;
    activated_at: string | null;
    reward_days: number;
    rewarded: boolean;
  }>;
}

function useReferralCode() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["referral-code"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user!.id)
        .single();
      return data?.referral_code as string | null;
    },
  });
}

function useReferralStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["referral-stats"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("referral-system", {
        body: { action: "get_stats" },
      });
      if (error) throw error;
      return data as ReferralStats;
    },
  });
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: referralCode, isLoading: codeLoading } = useReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const generateCode = useMutation({
    mutationFn: async () => {
      const code = `CP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase
        .from("profiles")
        .update({ referral_code: code })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-code"] });
      toast.success("Referral code generated!");
    },
  });

  const referralLink = referralCode
    ? `${window.location.origin}/ref/${referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join guzzl.pro",
          text: "Create your digital business card and start getting more leads. Use my referral link:",
          url: referralLink,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  const completedCount = stats?.completed ?? 0;
  const nextTier = REWARD_TIERS.find(t => t.count > completedCount);
  const currentTier = [...REWARD_TIERS].reverse().find(t => t.count <= completedCount);
  const progressToNext = nextTier
    ? (completedCount / nextTier.count) * 100
    : 100;

  const isLoading = codeLoading || statsLoading;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Program</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invite professionals to guzzl.pro — you both earn rewards
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Invites Sent", value: stats?.total ?? 0, icon: Users },
          { label: "Activated", value: stats?.completed ?? 0, icon: Target },
          { label: "Pending", value: stats?.pending ?? 0, icon: Loader2 },
          { label: "Days Earned", value: stats?.total_reward_days ?? 0, icon: Trophy },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <stat.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Your Referral Link</h2>
        </div>
        {!referralCode ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Generate your unique referral link to start inviting others.
            </p>
            <Button onClick={() => generateCode.mutate()} disabled={generateCode.isPending}>
              {generateCode.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Referral Link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="bg-muted/50 text-xs" />
              <Button variant="outline" onClick={copyLink} className="shrink-0 gap-1.5">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={shareLink} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const subject = encodeURIComponent("Join guzzl.pro — digital business cards for pros");
                  const body = encodeURIComponent(
                    `Hey!\n\nI've been using guzzl.pro to get more leads with a digital business card. Check it out:\n\n${referralLink}\n\nYou'll get a free Pro trial when you sign up!`
                  );
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const text = encodeURIComponent(
                    `Check out guzzl.pro — the smart business card that gets you more leads: ${referralLink}`
                  );
                  window.open(`sms:?body=${text}`);
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Text
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border bg-card p-6"
      >
        <h2 className="font-semibold mb-4">How Referrals Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: 1, title: "Share your link", desc: "Send your unique link to colleagues and fellow pros" },
            { step: 2, title: "They sign up & activate", desc: "They create a card and get their first lead or estimate" },
            { step: 3, title: "You both get 14 days Pro", desc: "Both you and your friend earn 14 days of Pro access instantly" },
          ].map((s) => (
            <div key={s.step} className="text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto">
                {s.step}
              </div>
              <p className="font-medium text-sm">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reward Tiers + Progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border bg-card p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Reward Tiers</h2>
          {currentTier && (
            <Badge variant="default" className="gap-1">
              {currentTier.icon} {currentTier.reward}
            </Badge>
          )}
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} / {nextTier.count} referrals to next reward
              </span>
              <span className="font-medium text-primary">{nextTier.reward}</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {REWARD_TIERS.map((tier) => {
            const unlocked = completedCount >= tier.count;
            return (
              <div
                key={tier.count}
                className={`rounded-lg border p-3 text-center transition-all ${
                  unlocked
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="text-2xl mb-1">{tier.icon}</div>
                <div className="text-xl font-bold">{tier.count}</div>
                <p className="text-[10px] text-muted-foreground mb-1">referrals</p>
                <Badge variant={unlocked ? "default" : "secondary"} className="text-[10px]">
                  {tier.reward}
                </Badge>
                {unlocked && (
                  <p className="text-[10px] text-primary mt-1 font-medium">✓ Unlocked</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Fraud Prevention Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-xl border bg-muted/30 p-4 flex items-start gap-3"
      >
        <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Fair Play Policy</p>
          <p className="text-xs text-muted-foreground mt-1">
            Referrals are only counted when the referred user creates a card and gets their first lead or sends an estimate.
            Self-referrals and suspicious patterns are automatically detected.
          </p>
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border bg-card p-6"
      >
        <h2 className="font-semibold mb-4">Referral History</h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (stats?.referrals ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No referrals yet. Share your link to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {(stats?.referrals ?? []).map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div>
                  <p className="text-sm font-medium">{ref.referred_email}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ref.created_at), "MMM d, yyyy")}
                    {ref.activated_at && (
                      <span className="text-primary ml-2">
                        · Activated {format(new Date(ref.activated_at), "MMM d")}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {ref.rewarded && ref.reward_days > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Trophy className="h-3 w-3" /> +{ref.reward_days}d
                    </Badge>
                  )}
                  <Badge
                    variant={
                      ref.status === "completed"
                        ? "default"
                        : ref.status === "flagged"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {ref.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
