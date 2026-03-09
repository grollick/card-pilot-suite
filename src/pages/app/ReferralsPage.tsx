import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Copy, Users, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

const REWARD_TIERS = [
  { count: 3, reward: "1 month Pro", unlocked: false },
  { count: 10, reward: "6 months Pro", unlocked: false },
];

function useReferralData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["referral-data"],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: profile }, { data: referrals }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user!.id).single(),
        supabase.from("referrals").select("*").eq("referrer_id", user!.id).order("created_at", { ascending: false }),
      ]);
      return { referralCode: profile?.referral_code, referrals: referrals ?? [] };
    },
  });
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useReferralData();
  const [copied, setCopied] = useState(false);

  const generateCode = useMutation({
    mutationFn: async () => {
      const code = `CP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase.from("profiles").update({ referral_code: code }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-data"] });
      toast.success("Referral code generated!");
    },
  });

  const completedReferrals = data?.referrals.filter(r => r.status === "completed").length ?? 0;
  const referralLink = data?.referralCode ? `${window.location.origin}/auth?ref=${data.referralCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Program</h1>
        <p className="text-muted-foreground text-sm mt-1">Invite others to CardPilot and earn Pro rewards</p>
      </div>

      {/* Referral Code */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Your Referral Link</h2>
        </div>
        {!data?.referralCode ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Generate your unique referral code to start earning rewards.</p>
            <Button onClick={() => generateCode.mutate()} disabled={generateCode.isPending}>
              {generateCode.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Referral Code
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-muted/50" />
            <Button variant="outline" onClick={copyLink} className="shrink-0 gap-1.5">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Reward Tiers */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Reward Tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REWARD_TIERS.map(tier => {
            const unlocked = completedReferrals >= tier.count;
            return (
              <div key={tier.count}
                className={`rounded-lg border p-4 text-center ${unlocked ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="text-3xl font-bold mb-1">{tier.count}</div>
                <p className="text-sm text-muted-foreground mb-2">referrals</p>
                <Badge variant={unlocked ? "default" : "secondary"}>{tier.reward}</Badge>
                {unlocked && <p className="text-xs text-primary mt-2 font-medium">✓ Unlocked!</p>}
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You have <span className="font-semibold text-foreground">{completedReferrals}</span> completed referral{completedReferrals !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Referral History</h2>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (data?.referrals ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No referrals yet. Share your link to get started!</p>
        ) : (
          <div className="space-y-2">
            {(data?.referrals ?? []).map(ref => (
              <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{ref.referred_email}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(ref.created_at), "MMM d, yyyy")}</p>
                </div>
                <Badge variant={ref.status === "completed" ? "default" : "secondary"}>
                  {ref.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
