import { useNavigate } from "react-router-dom";
import { MapPin, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface OnDutyProvider {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  handle: string | null;
  company: string | null;
}

function useOnDutyProviders(city?: string | null) {
  return useQuery<OnDutyProvider[]>({
    queryKey: ["on-duty-near", city],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("id, name, avatar_url, city, handle, company")
        .eq("is_on_duty", true)
        .not("handle", "is", null)
        .limit(8);

      if (city) {
        q = q.ilike("city", `%${city}%`);
      }

      const { data, error } = await q.order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as OnDutyProvider[];
    },
  });
}

export default function AvailableNearYou({ city }: { city?: string | null }) {
  const navigate = useNavigate();
  const { data: providers = [], isLoading } = useOnDutyProviders(city);

  if (!isLoading && providers.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="h-5 w-5 text-green-500" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Available Now Near You</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/marketplace/search?duty=on")}>
          See all <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {providers.map((p, i) => {
            const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent((p.name || "?").slice(0, 2))}&background=22c55e&color=fff&size=96`;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="min-w-[180px] max-w-[200px] flex-shrink-0 rounded-xl border border-green-200 dark:border-green-900/40 bg-card p-4 text-center hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => p.handle && navigate(`/${p.handle}`)}
              >
                <Badge className="absolute top-2 right-2 bg-green-500 text-white text-[10px] gap-1 px-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  On Duty
                </Badge>
                <img
                  src={p.avatar_url || fallback}
                  alt={p.name || "Provider"}
                  className="w-14 h-14 rounded-full object-cover mx-auto mb-2 ring-2 ring-green-500/30"
                />
                <p className="text-sm font-semibold truncate">{p.name || "Pro"}</p>
                {p.company && (
                  <p className="text-[11px] text-muted-foreground truncate">{p.company}</p>
                )}
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  {p.city || "Local"}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
