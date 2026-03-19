import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Copy, Check, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ReferralWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: referralCode } = useQuery({
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

  const { data: stats } = useQuery({
    queryKey: ["referral-stats-summary"],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("referral-system", {
        body: { action: "get_stats" },
      });
      return data as { total: number; completed: number; total_reward_days: number } | null;
    },
  });

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

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gift className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Invite & Earn Pro</h3>
            <p className="text-xs text-muted-foreground">Both get 14 days Pro free</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => navigate("/app/referrals")}
        >
          Details <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {!referralCode ? (
        <Button size="sm" onClick={() => generateCode.mutate()} disabled={generateCode.isPending}>
          Generate Referral Link
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="bg-muted/50 text-xs h-8" />
          <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}

      {stats && (stats.total > 0 || stats.completed > 0) && (
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {stats.total} invited
          </span>
          <span>{stats.completed} activated</span>
          {stats.total_reward_days > 0 && (
            <span className="text-primary font-medium">+{stats.total_reward_days}d earned</span>
          )}
        </div>
      )}
    </div>
  );
}
