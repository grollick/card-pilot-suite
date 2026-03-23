import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye, UserPlus, CalendarCheck, Gift, TrendingUp, ArrowUpRight, Share2, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { subDays, startOfDay } from "date-fns";

function useGrowthStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["growth-stats"],
    enabled: !!user,
    refetchInterval: 120_000,
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const sixtyDaysAgo = subDays(now, 60).toISOString();

      const [
        { data: currentViews },
        { data: prevViews },
        { count: currentLeads },
        { count: prevLeads },
        { count: currentBookings },
        { count: prevBookings },
        { count: referrals },
        { data: profile },
      ] = await Promise.all([
        supabase.from("analytics_events").select("id").gte("created_at", thirtyDaysAgo),
        supabase.from("analytics_events").select("id").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", user!.id),
        supabase.from("profiles").select("handle, referral_code").eq("id", user!.id).single(),
      ]);

      const calcTrend = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

      const cv = currentViews?.length ?? 0;
      const pv = prevViews?.length ?? 0;
      const cl = currentLeads ?? 0;
      const pl = prevLeads ?? 0;
      const cb = currentBookings ?? 0;
      const pb = prevBookings ?? 0;

      return {
        cardViews: cv,
        cardViewsTrend: calcTrend(cv, pv),
        leadsGenerated: cl,
        leadsTrend: calcTrend(cl, pl),
        bookingsReceived: cb,
        bookingsTrend: calcTrend(cb, pb),
        referralsSent: referrals ?? 0,
        handle: profile?.handle,
        referralCode: profile?.referral_code,
      };
    },
  });
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function GrowthDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useGrowthStats();
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const cardUrl = data?.handle ? `${window.location.origin}/${data.handle}` : "";
  const refLink = data?.referralCode ? `${window.location.origin}/auth?ref=${data.referralCode}` : "";

  const copyUrl = (url: string, type: "card" | "ref") => {
    navigator.clipboard.writeText(url);
    toast.success(type === "card" ? "Card link copied!" : "Referral link copied!");
    if (type === "card") { setCopiedCard(true); setTimeout(() => setCopiedCard(false), 2000); }
    else { setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2000); }
  };

  const metrics = [
    { label: "Card Views", value: data?.cardViews ?? 0, trend: data?.cardViewsTrend ?? 0, icon: Eye, color: "text-primary" },
    { label: "Leads Generated", value: data?.leadsGenerated ?? 0, trend: data?.leadsTrend ?? 0, icon: UserPlus, color: "text-success" },
    { label: "Bookings", value: data?.bookingsReceived ?? 0, trend: data?.bookingsTrend ?? 0, icon: CalendarCheck, color: "text-warning" },
    { label: "Referrals Sent", value: data?.referralsSent ?? 0, trend: 0, icon: Gift, color: "text-accent" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Growth Dashboard</span></h1>
        <p className="text-muted-foreground text-sm mt-1">Track how your card drives leads, bookings, and referrals</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} {...fadeUp} transition={{ delay: i * 0.04 }}
            className="dash-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center`}>
                <m.icon className={`h-4.5 w-4.5 ${m.color}`} />
              </div>
              {m.trend !== 0 && (
                <Badge variant={m.trend > 0 ? "default" : "secondary"} className="text-2xs gap-0.5">
                  <TrendingUp className={`h-3 w-3 ${m.trend < 0 ? "rotate-180" : ""}`} />
                  {Math.abs(m.trend)}%
                </Badge>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{m.value.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            <p className="text-2xs text-muted-foreground/70 mt-0.5">Last 30 days</p>
          </motion.div>
        ))}
      </div>

      {/* Share Your Card */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}
        className="dash-card border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Share Your Card</h2>
          </div>
          <p className="text-sm text-muted-foreground">The more you share, the more leads you generate. Share your card everywhere.</p>

          {cardUrl && (
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-lg bg-muted/50 text-sm text-muted-foreground truncate font-mono">
                {cardUrl.replace(/^https?:\/\//, "")}
              </div>
              <Button variant="outline" onClick={() => copyUrl(cardUrl, "card")} className="gap-1.5 shrink-0">
                {copiedCard ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedCard ? "Copied" : "Copy"}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/app/card/qr")}>Download QR Code</Button>
            <Button variant="outline" size="sm"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cardUrl)}`, "_blank")}>
              Share to Facebook
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`, "_blank")}>
              Share to LinkedIn
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Referral Program */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}
        className="dash-card">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Gift className="h-5 w-5 text-accent" />
              <h2 className="font-semibold">Referral Program</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/referrals")}>
              Manage <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <div className="text-3xl font-bold mb-1">3</div>
              <p className="text-sm text-muted-foreground mb-2">referrals</p>
              <Badge variant="secondary">1 month Pro</Badge>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <div className="text-3xl font-bold mb-1">10</div>
              <p className="text-sm text-muted-foreground mb-2">referrals</p>
              <Badge variant="secondary">6 months Pro</Badge>
            </div>
          </div>

          {refLink && (
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-lg bg-muted/50 text-sm text-muted-foreground truncate font-mono">
                {refLink.replace(/^https?:\/\//, "")}
              </div>
              <Button variant="outline" onClick={() => copyUrl(refLink, "ref")} className="gap-1.5 shrink-0">
                {copiedRef ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedRef ? "Copied" : "Copy"}
              </Button>
            </div>
          )}

          {!refLink && (
            <p className="text-sm text-muted-foreground">
              Generate your referral code on the{" "}
              <button onClick={() => navigate("/app/referrals")} className="text-primary hover:underline">
                Referrals page
              </button>
            </p>
          )}
        </div>
      </motion.div>

      {/* Project Showcase */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}
        className="dash-card">
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Project Showcase</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/projects")}>
              Manage <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share your project cards to attract new leads. Each project includes a "Powered by guzzl.pro" footer that helps grow the platform organically.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/app/projects")}>
            View Projects
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
