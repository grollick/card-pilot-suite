import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { MapPin, List, Radio, ArrowRight } from "lucide-react";
import { useOnDutyProfessionals } from "@/hooks/useOnDutyMap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/* ───────────────────────────────────────────
   ENV TOKEN CONFIG
   Expected variable: VITE_MAPTILER_KEY
   Fallback check:    VITE_MAPBOX_TOKEN
   ─────────────────────────────────────────── */
function readMapToken() {
  const env = import.meta.env as Record<string, string | undefined>;
  const candidates = [
    { key: "VITE_MAPTILER_KEY", value: env.VITE_MAPTILER_KEY },
    { key: "VITE_MAPBOX_TOKEN", value: env.VITE_MAPBOX_TOKEN },
  ];
  const found = candidates.find((c) => Boolean(c.value?.trim()));
  return { key: found?.key ?? null, value: found?.value?.trim() ?? "" };
}

export default function OnDutyMapPage() {
  const token = useMemo(() => readMapToken(), []);
  const hasToken = Boolean(token.value);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  const { data: professionals = [], isLoading } = useOnDutyProfessionals();

  useEffect(() => {
    setMounted(true);
    if (import.meta.env.DEV) {
      console.info("[Map] client mounted");
      console.info(`[Map] token ${hasToken ? "found" : "missing"} (source: ${token.key ?? "none"})`);
      console.info(`[Map] map init ${hasToken ? "allowed" : "skipped — no token"}`);
    }
  }, [hasToken, token.key]);

  return (
    <div className="min-h-screen w-full bg-background">
      <Helmet>
        <title>On Duty Professionals | CardPilot</title>
        <meta name="description" content="Find available professionals near you who are on duty right now." />
      </Helmet>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
        <div className="flex items-center gap-2 mb-6">
          <Radio className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Available Now Near You</h1>
        </div>

        {/* ── Map area: render map OR fallback ── */}
        <section className="w-full min-h-[400px] rounded-xl border border-border bg-muted/30 overflow-hidden mb-8">
          {!mounted ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : !hasToken ? (
            /* ── TOKEN MISSING FALLBACK ── */
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Map unavailable right now</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Map setup is not complete yet. Use the list view below to see available professionals.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("on-duty-list");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <List className="mr-2 h-4 w-4" />
                Switch to List View
              </Button>
            </div>
          ) : (
            /* ── MAP WOULD RENDER HERE once token is configured ── */
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-muted-foreground">Map loading…</p>
            </div>
          )}
        </section>

        {/* ── LIST VIEW (always works) ── */}
        <section id="on-duty-list">
          <div className="flex items-center gap-2 mb-4">
            <List className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">On Duty Professionals</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted/40" />
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">No professionals are on duty right now. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {professionals.map((pro) => (
                <div
                  key={pro.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={pro.avatar_url ?? undefined} alt={pro.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {pro.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{pro.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[pro.profession_name, pro.company, pro.city].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/15 text-green-700 border-0">
                        On Duty
                      </Badge>
                      {pro.avg_rating !== null && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          ★ {pro.avg_rating}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => navigate(`/site/${pro.handle}`)}
                    >
                      View
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
