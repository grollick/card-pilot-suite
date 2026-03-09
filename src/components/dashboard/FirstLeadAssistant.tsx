import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/useCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface ChecklistItem {
  key: string;
  label: string;
  route: string;
  done: boolean;
}

export default function FirstLeadAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: checklist = [] } = useQuery({
    queryKey: ["first-lead-checklist", user?.id],
    enabled: !!user && !!profile,
    staleTime: 30_000,
    queryFn: async (): Promise<ChecklistItem[]> => {
      const uid = user!.id;

      const [cardRes, serviceRes, leadRes, reviewRes] = await Promise.all([
        supabase.from("cards").select("id, status").eq("user_id", uid).limit(1).maybeSingle(),
        supabase.from("booking_services").select("id").eq("user_id", uid).eq("active", true).limit(1),
        supabase.from("leads").select("id").eq("user_id", uid).limit(1),
        supabase.from("reviews" as any).select("id").eq("user_id", uid).limit(1),
      ]);

      const hasPublishedCard = cardRes.data?.status === "published";
      const hasServices = (serviceRes.data?.length ?? 0) > 0;
      const hasHandle = !!profile?.handle;
      const hasLead = (leadRes.data?.length ?? 0) > 0;
      const hasReview = (reviewRes.data?.length ?? 0) > 0;

      return [
        { key: "handle", label: "Set your handle", route: "/app/settings", done: hasHandle },
        { key: "card", label: "Publish your card", route: "/app/card", done: hasPublishedCard },
        { key: "services", label: "Add services", route: "/app/bookings", done: hasServices },
        { key: "share", label: "Share your card", route: "/app/card", done: hasLead },
        { key: "review", label: "Get your first review", route: "/app/reviews", done: hasReview },
      ];
    },
  });

  const completedCount = checklist.filter(c => c.done).length;
  const allDone = completedCount === checklist.length && checklist.length > 0;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  // Hide once all done
  if (allDone) return null;

  const nextItem = checklist.find(c => !c.done);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">Get Your First Lead</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">{completedCount}/{checklist.length}</span>
      </div>

      <Progress value={progress} className="h-1.5 mb-4" />

      <div className="space-y-2">
        {checklist.map((item) => (
          <button
            key={item.key}
            onClick={() => !item.done && navigate(item.route)}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
              item.done
                ? "text-muted-foreground line-through opacity-60"
                : "hover:bg-muted/50 cursor-pointer"
            }`}
            disabled={item.done}
          >
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className="flex-1">{item.label}</span>
            {!item.done && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </button>
        ))}
      </div>

      {nextItem && (
        <Button
          size="sm"
          className="mt-4 shadow-glow gap-1.5 w-full"
          onClick={() => navigate(nextItem.route)}
        >
          {nextItem.label} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  );
}
