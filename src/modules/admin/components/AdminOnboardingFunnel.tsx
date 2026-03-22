import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowDown } from "lucide-react";

interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

export default function AdminOnboardingFunnel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-onboarding-funnel"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Total signups
      const { count: totalUsers } = await (supabase as any)
        .from("profiles")
        .select("id", { count: "exact", head: true });

      // Onboarding completed
      const { count: onboarded } = await (supabase as any)
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("onboarding_completed", true);

      // Published card
      const { count: publishedCards } = await (supabase as any)
        .from("cards")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "published");

      // Users with at least 1 lead
      const { data: leadUsers } = await (supabase as any)
        .from("leads")
        .select("user_id");
      const uniqueLeadUsers = new Set((leadUsers || []).map((l: any) => l.user_id)).size;

      // Users with at least 1 booking
      const { data: bookingUsers } = await (supabase as any)
        .from("bookings")
        .select("user_id");
      const uniqueBookingUsers = new Set((bookingUsers || []).map((b: any) => b.user_id)).size;

      // Users with at least 1 estimate
      const { data: estimateUsers } = await (supabase as any)
        .from("estimates")
        .select("user_id");
      const uniqueEstimateUsers = new Set((estimateUsers || []).map((e: any) => e.user_id)).size;

      return {
        totalUsers: totalUsers || 0,
        onboarded: onboarded || 0,
        publishedCards: publishedCards || 0,
        withLeads: uniqueLeadUsers,
        withBookings: uniqueBookingUsers,
        withEstimates: uniqueEstimateUsers,
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const steps: FunnelStep[] = [
    { label: "Signed Up", count: data?.totalUsers || 0, color: "bg-primary" },
    { label: "Onboarding Complete", count: data?.onboarded || 0, color: "bg-blue-500" },
    { label: "Card Published", count: data?.publishedCards || 0, color: "bg-emerald-500" },
    { label: "First Lead", count: data?.withLeads || 0, color: "bg-amber-500" },
    { label: "First Booking", count: data?.withBookings || 0, color: "bg-violet-500" },
    { label: "First Estimate", count: data?.withEstimates || 0, color: "bg-pink-500" },
  ];

  const maxCount = steps[0].count || 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">User Onboarding Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {steps.map((step, i) => {
            const pct = Math.round((step.count / maxCount) * 100);
            const dropoff = i > 0 ? steps[i - 1].count - step.count : 0;
            const dropPct = i > 0 && steps[i - 1].count > 0 ? Math.round((dropoff / steps[i - 1].count) * 100) : 0;

            return (
              <div key={step.label}>
                {i > 0 && (
                  <div className="flex items-center gap-2 py-1 pl-4">
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {dropoff > 0 ? `−${dropoff} dropped (${dropPct}%)` : "No dropoff"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-36 text-xs font-medium truncate">{step.label}</div>
                  <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                    <div
                      className={`h-full ${step.color} rounded-md transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold mix-blend-difference text-white">
                      {step.count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Conversion rates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Signup → Onboarded", from: data?.totalUsers, to: data?.onboarded },
          { label: "Onboarded → Card", from: data?.onboarded, to: data?.publishedCards },
          { label: "Card → Lead", from: data?.publishedCards, to: data?.withLeads },
          { label: "Lead → Booking", from: data?.withLeads, to: data?.withBookings },
          { label: "Lead → Estimate", from: data?.withLeads, to: data?.withEstimates },
        ].map((c) => {
          const rate = c.from && c.from > 0 ? Math.round(((c.to || 0) / c.from) * 100) : 0;
          return (
            <Card key={c.label}>
              <CardContent className="pt-4 pb-3">
                <p className="text-[10px] text-muted-foreground">{c.label}</p>
                <p className={`text-xl font-bold ${rate >= 50 ? "text-green-600" : rate >= 20 ? "text-amber-600" : "text-destructive"}`}>
                  {rate}%
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
