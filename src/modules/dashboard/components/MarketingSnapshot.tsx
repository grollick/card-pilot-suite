import { useNavigate } from "react-router-dom";
import { Share2, ArrowUpRight, BarChart3, Users, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth } from "date-fns";

export default function MarketingSnapshot() {
  const navigate = useNavigate();
  const { data: posts = [], isLoading: postsLoading } = useSocialPosts();

  const { data: marketingData, isLoading: dataLoading } = useQuery({
    queryKey: ["marketing-snapshot"],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date()).toISOString();

      const [{ count: referrals }, { count: qrScans }] = await Promise.all([
        supabase.from("referrals").select("*", { count: "exact", head: true })
          .gte("created_at", monthStart),
        supabase.from("qr_scans").select("*", { count: "exact", head: true })
          .gte("created_at", monthStart),
      ]);

      return { referrals: referrals ?? 0, qrScans: qrScans ?? 0 };
    },
    refetchInterval: 120_000,
  });

  const isLoading = postsLoading || dataLoading;
  const scheduledPosts = posts.filter(p => p.status === "scheduled" || p.approval_status === "scheduled").length;
  const publishedPosts = posts.filter(p => p.status === "published" || p.approval_status === "published").length;

  const metrics = [
    { label: "Scheduled", value: scheduledPosts, icon: Share2 },
    { label: "Published", value: publishedPosts, icon: Megaphone },
    { label: "QR Scans", value: marketingData?.qrScans ?? 0, icon: BarChart3 },
    { label: "Referrals", value: marketingData?.referrals ?? 0, icon: Users },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-accent" />
          </div>
          <h2 className="font-semibold text-sm">Marketing</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/social")}>
          Open <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body">
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="text-center py-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center mx-auto mb-1.5">
                <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {isLoading ? (
                <Skeleton className="h-5 w-8 mx-auto" />
              ) : (
                <p className="text-base font-bold tabular-nums">{m.value}</p>
              )}
              <p className="text-2xs text-muted-foreground mt-0.5 font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
