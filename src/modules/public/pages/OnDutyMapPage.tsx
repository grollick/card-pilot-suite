import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { MapPin, List, Radio, ArrowRight } from "lucide-react";
import { useOnDutyProfessionals } from "@/hooks/useOnDutyMap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ── token config ── */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";
const HAS_TOKEN = Boolean(MAPBOX_TOKEN.trim());

/* ── static test data ── */
const STATIC_CENTER: [number, number] = [-98.5795, 39.8283]; // lng, lat — center US
const STATIC_PIN = { lng: -98.5795, lat: 39.8283 };

type MapStatus = "loading" | "ready" | "error" | "no-token";

export default function OnDutyMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: professionals = [], isLoading } = useOnDutyProfessionals();

  /* ── mount guard ── */
  useEffect(() => {
    setMounted(true);
    console.info("[Map] client mounted");
    console.info(`[Map] token ${HAS_TOKEN ? "found (VITE_MAPBOX_TOKEN)" : "missing"}`);
  }, []);

  /* ── map init ── */
  useEffect(() => {
    if (!mounted) return;
    if (!HAS_TOKEN) {
      setMapStatus("no-token");
      console.warn("[Map] init skipped — no token");
      return;
    }
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // already initialized

    try {
      console.info("[Map] initializing Mapbox via maplibre-gl…");
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_TOKEN}`,
        center: STATIC_CENTER,
        zoom: 4,
        attributionControl: false,
      });

      map.on("load", () => {
        console.info("[Map] ✓ provider loaded & map initialized");

        // static test marker
        new maplibregl.Marker({ color: "#22c55e" })
          .setLngLat([STATIC_PIN.lng, STATIC_PIN.lat])
          .setPopup(new maplibregl.Popup().setHTML("<b>Test Pin</b><br/>Static marker"))
          .addTo(map);

        console.info("[Map] ✓ static test marker rendered");
        setMapStatus("ready");
      });

      map.on("error", (e) => {
        console.error("[Map] map error:", e);
        setMapError(e.error?.message ?? "Unknown map error");
        setMapStatus("error");
      });

      mapRef.current = map;
    } catch (err: any) {
      console.error("[Map] init failed:", err);
      setMapError(err?.message ?? "Failed to initialize map");
      setMapStatus("error");
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mounted]);

  const scrollToList = useCallback(() => {
    document.getElementById("on-duty-list")?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

        {/* ── Map area ── */}
        <section className="relative w-full rounded-xl border border-border bg-muted/30 overflow-hidden mb-8"
                 style={{ minHeight: 500 }}>

          {/* Map container — always in DOM so maplibre can attach */}
          <div
            ref={mapContainerRef}
            className="absolute inset-0 w-full h-full"
            style={{ minHeight: 500, display: HAS_TOKEN ? "block" : "none" }}
          />

          {/* Overlays based on status */}
          {!mounted && (
            <div className="flex min-h-[500px] items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading map…</p>
            </div>
          )}

          {mounted && mapStatus === "no-token" && (
            <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Map unavailable right now</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Use the list view to see available professionals.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={scrollToList}>
                <List className="mr-2 h-4 w-4" />
                Switch to List View
              </Button>
            </div>
          )}

          {mounted && mapStatus === "error" && (
            <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <MapPin className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Map could not be loaded</p>
                {mapError && (
                  <p className="mt-1 max-w-md text-xs text-muted-foreground font-mono break-all">{mapError}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={scrollToList}>
                <List className="mr-2 h-4 w-4" />
                Switch to List View
              </Button>
            </div>
          )}

          {mounted && mapStatus === "loading" && HAS_TOKEN && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <p className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded">Map loading…</p>
            </div>
          )}
        </section>

        {/* ── LIST VIEW ── */}
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
