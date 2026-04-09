import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { MapPin, List, ArrowRight, Map, ArrowLeft, Star, Radio } from "lucide-react";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { useOnDutyProfessionals } from "@/hooks/useOnDutyMap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CATEGORIES } from "@/modules/marketplace/data/mockData";
import { useMarketplaceSearch, type MarketplaceResult } from "@/modules/marketplace/hooks/useMarketplaceSearch";
import { useUserLocation } from "@/modules/marketplace/hooks/useUserLocation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ── token config ── */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "pk.eyJ1IjoiZ3JvbGxpY2siLCJhIjoiY21uODFjNjY0MDZpcTMxcTRhZGVjcGZleiJ9.NVS5tdI_TZRyZv0299LCqQ";
const HAS_TOKEN = Boolean(MAPBOX_TOKEN.trim());

const STATIC_CENTER: [number, number] = [-98.5795, 39.8283];

type MapStatus = "idle" | "loading" | "ready" | "error" | "no-token";

export default function OnDutyMapPage() {
  const navigate = useNavigate();
  const { data: professionals = [], isLoading } = useOnDutyProfessionals();
  const [activeTab, setActiveTab] = useState("list");
  const { location } = useUserLocation();

  const { data: featuredData, isLoading: featuredLoading } = useMarketplaceSearch({
    city: location.city,
    lat: location.lat,
    lon: location.lon,
    limit: 8,
  });

  const featured = (featuredData?.results || []).filter((b) => b.is_featured || b.avg_rating >= 4.0).slice(0, 6);

  return (
    <div className="min-h-screen w-full bg-background">
      <Helmet>
        <title>Marketplace — Find Local Professionals | guzzl.pro</title>
        <meta name="description" content="Find available professionals near you. Browse categories, view ratings, and book services." />
      </Helmet>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 space-y-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight"><GuzzlLogo to={null} size="lg" suffix="Marketplace" /></h1>
        </div>

        {/* On Duty Section */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            Available Now
          </h2>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="gap-1.5">
                <List className="h-4 w-4" /> List View
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1.5">
                <Map className="h-4 w-4" /> Map View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <ProfessionalList professionals={professionals} isLoading={isLoading} navigate={navigate} />
            </TabsContent>

            <TabsContent value="map">
              <MapPanel professionals={professionals} onSwitchToList={() => setActiveTab("list")} navigate={navigate} />
              <div className="mt-8">
                <ProfessionalList professionals={professionals} isLoading={isLoading} navigate={navigate} />
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Browse by Category */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => navigate(`/marketplace/category/${cat.key}`)}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured / Top Rated Providers */}
        {(featuredLoading || featured.length > 0) && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">⭐ Top Rated Providers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-24 mb-2" />
                      <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                  ))
                : featured.map((biz) => (
                    <div
                      key={biz.business_id}
                      className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/marketplace/${biz.slug}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={biz.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.business_name.slice(0, 2))}&background=6366f1&color=fff&size=128`}
                          alt={biz.business_name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">{biz.business_name}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {biz.location_city}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="text-sm font-medium">{Number(biz.avg_rating).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({biz.review_count} reviews)</span>
                      </div>
                      {biz.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{biz.description}</p>
                      )}
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <section className="pb-6">
          <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-8 sm:p-12 text-center text-primary-foreground">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Are you a service provider?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Get discovered by local customers and grow your business with guzzl.pro
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="font-semibold"
              onClick={() => navigate("/auth")}
            >
              Create Your Free Card <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── LIST VIEW ── */
function ProfessionalList({
  professionals,
  isLoading,
  navigate,
}: {
  professionals: any[];
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
        <Radio className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-base font-medium text-foreground">No professionals are on duty right now</p>
        <p className="mt-1 text-sm text-muted-foreground">Check back soon — professionals go on duty throughout the day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {professionals.map((pro) => (
        <div
          key={pro.id}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
        >
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-green-500/30">
            <AvatarImage src={pro.avatar_url ?? undefined} alt={pro.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {pro.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{pro.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[pro.profession_name, pro.company, pro.city].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-green-500/15 text-green-700 dark:text-green-400 border-0 font-medium">
                ● On Duty
              </Badge>
              {pro.avg_rating !== null && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  ★ {pro.avg_rating}
                </Badge>
              )}
              {pro.badges?.includes("Fast Responder") && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  ⚡ Fast
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
              View <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── MAP PANEL ── */
function MapPanel({
  professionals,
  onSwitchToList,
  navigate,
}: {
  professionals: any[];
  onSwitchToList: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>("idle");
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!HAS_TOKEN) {
      console.warn("[Map] no token — skipping init");
      setMapStatus("no-token");
      return;
    }
    if (!mapContainerRef.current || mapRef.current) return;

    setMapStatus("loading");
    let timeoutId: ReturnType<typeof setTimeout>;

    try {
      const styleUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_TOKEN}`;
      console.info("[Map] init with token, style:", styleUrl.slice(0, 70) + "…");

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: STATIC_CENTER,
        zoom: 4,
        attributionControl: false,
      });

      timeoutId = setTimeout(() => {
        if (mapStatus === "loading") {
          console.error("[Map] timed out 15s");
          setMapError("Map timed out — style may have failed.");
          setMapStatus("error");
        }
      }, 15000);

      map.on("load", () => {
        clearTimeout(timeoutId);
        console.info("[Map] ✓ loaded");

        // Add markers for on-duty professionals
        const pts = professionals.length > 0 ? professionals : [{ lat: STATIC_CENTER[1], lng: STATIC_CENTER[0], name: "Test Pin" }];
        pts.forEach((p) => {
          new maplibregl.Marker({ color: "#22c55e" })
            .setLngLat([p.lng, p.lat])
            .setPopup(new maplibregl.Popup().setHTML(`<b>${p.name ?? "Professional"}</b>`))
            .addTo(map);
        });

        setMapStatus("ready");
      });

      map.on("error", (e) => {
        clearTimeout(timeoutId);
        const msg = e.error?.message ?? "Unknown";
        console.error("[Map] error:", msg);
        setMapError(`Provider error: ${msg}`);
        setMapStatus("error");
      });

      mapRef.current = map;
    } catch (err: any) {
      console.error("[Map] init exception:", err);
      setMapError(`Init failed: ${err?.message}`);
      setMapStatus("error");
    }

    return () => {
      clearTimeout(timeoutId!);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const showFallback = mapStatus === "no-token" || mapStatus === "error";

  return (
    <section className="relative w-full rounded-xl border border-border bg-muted/30 overflow-hidden" style={{ minHeight: 400 }}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: 400, display: showFallback ? "none" : "block" }}
      />

      {/* Loading overlay */}
      {mapStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded">Loading map…</p>
        </div>
      )}

      {/* Fallback */}
      {showFallback && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Map unavailable right now</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Use List View to see available professionals.
            </p>
            {mapError && (
              <p className="mt-2 max-w-md text-[10px] text-muted-foreground/60 font-mono break-all">{mapError}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onSwitchToList}>
            <List className="mr-2 h-4 w-4" />
            Switch to List View
          </Button>
        </div>
      )}
    </section>
  );
}
