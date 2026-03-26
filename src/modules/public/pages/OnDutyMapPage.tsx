import { useState, useCallback, useEffect, useRef, forwardRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import MapGL, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useOnDutyProfessionals, useUserLocation, type OnDutyProfessional } from "@/hooks/useOnDutyMap";
import { useOnDutyRealtime } from "@/hooks/useOnDutyRealtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin, List, Map as MapIcon, Star, Clock, Zap, Shield,
  MessageSquare, Eye, Radio, Loader2, ArrowLeft, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import InstantConnectPanel from "@/modules/public/components/InstantConnectPanel";

/* ─── Map style: pure OSM raster (no token needed) ─── */
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/* ─── Static test pin (Kansas, center of US) ─── */
const STATIC_TEST_PIN = { lat: 39.8283, lng: -98.5795, name: "Test Pin" };
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };

const MAX_PINS = 50;

function hasValidCoordinates(pro: OnDutyProfessional) {
  return Number.isFinite(pro.lat)
    && Number.isFinite(pro.lng)
    && Math.abs(pro.lat) <= 90
    && Math.abs(pro.lng) <= 180;
}

function formatResponseTime(min: number | null) {
  if (!min) return null;
  if (min < 60) return `${Math.round(min)}m`;
  return `${Math.round(min / 60)}h`;
}

function hasWebGLSupport() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext
      && (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ── Live activity toast ──
function LiveActivityToast({
  professional, onClose, onSelect,
}: {
  professional: OnDutyProfessional | null;
  onClose: () => void;
  onSelect: (p: OnDutyProfessional) => void;
}) {
  useEffect(() => {
    if (!professional) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [professional, onClose]);

  if (!professional) return null;

  return (
    <motion.div
      key={professional.id}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] max-w-sm w-full px-4"
    >
      <button
        onClick={() => onSelect(professional)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-success/30 shadow-lg shadow-success/10 hover:bg-accent/30 transition-colors text-left"
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-success/40 ring-offset-1 ring-offset-background">
            <AvatarImage src={professional.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-semibold bg-success/10 text-success">
              {professional.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success border border-background" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{professional.name}</p>
          <p className="text-xs text-muted-foreground">is now available nearby</p>
        </div>
        <Badge className="shrink-0 text-[10px] bg-success/10 text-success border-success/20 gap-1">
          <Radio className="h-2.5 w-2.5" /> Live
        </Badge>
      </button>
    </motion.div>
  );
}

// ── Map Pin Component ──
const DutyPin = forwardRef<HTMLButtonElement, {
  pro: OnDutyProfessional;
  isBursting: boolean;
  onClick: () => void;
}>(function DutyPin({ pro, isBursting, onClick }, ref) {
  const isAvailable = pro.status === "available";
  const size = isBursting ? 28 : isAvailable ? 24 : 20;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="relative group cursor-pointer"
      style={{ width: size, height: size, transform: "translate(-50%, -50%)" }}
      aria-label={`${pro.name} - ${pro.status}`}
    >
      {isAvailable && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: "hsl(var(--success))",
            opacity: 0.3,
            animationDuration: isBursting ? "1s" : "2s",
          }}
        />
      )}
      <span
        className="absolute inset-0 rounded-full border-2 border-background shadow-lg"
        style={{
          backgroundColor: isAvailable ? "hsl(var(--success))" : "hsl(var(--warning))",
          boxShadow: isAvailable
            ? "0 0 12px hsl(var(--success) / 0.5)"
            : "0 0 8px hsl(var(--warning) / 0.4)",
        }}
      />
    </button>
  );
});

DutyPin.displayName = "DutyPin";

// ── Professional card (list view) ──
const ProfessionalListCard = forwardRef<HTMLDivElement, { pro: OnDutyProfessional; onSelect: (p: OnDutyProfessional) => void }>(
  function ProfessionalListCard({ pro, onSelect }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
        onClick={() => onSelect(pro)}
      >
        <Avatar className="h-11 w-11 ring-2 ring-offset-1 ring-offset-background ring-success/40 shrink-0">
          <AvatarImage src={pro.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs font-semibold bg-muted">
            {pro.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm truncate">{pro.name}</p>
            <span className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
          </div>
          {pro.profession_name && (
            <p className="text-xs text-muted-foreground truncate">{pro.profession_name}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {pro.badges.map((b) => (
              <Badge key={b} variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 font-normal">
                {b === "Fast Responder" && <Zap className="h-2 w-2 text-warning" />}
                {b === "Highly Rated" && <Star className="h-2 w-2 text-warning" />}
                {b === "On Duty" && <Radio className="h-2 w-2 text-success" />}
                {b}
              </Badge>
            ))}
            {pro.avg_rating && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 font-normal">
                <Star className="h-2 w-2 text-warning fill-warning" />
                {pro.avg_rating} ({pro.review_count})
              </Badge>
            )}
            {pro.avg_response_minutes && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 font-normal">
                <Clock className="h-2 w-2" />
                {formatResponseTime(pro.avg_response_minutes)} avg
              </Badge>
            )}
          </div>
          <div className="flex gap-1.5 mt-2">
            <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Link to={`/${pro.handle}`}>
                <Eye className="h-3 w-3" /> Profile
              </Link>
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); onSelect(pro); }}>
              <MessageSquare className="h-3 w-3" /> Connect
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }
);

ProfessionalListCard.displayName = "ProfessionalListCard";

/* ─── Standalone map wrapper that renders only client-side ─── */
function OnDutyMapView({
  professionals,
  burstingIds,
  onSelect,
  userLocation,
}: {
  professionals: OnDutyProfessional[];
  burstingIds: Set<string>;
  onSelect: (p: OnDutyProfessional) => void;
  userLocation: { lat: number; lng: number } | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const errorCountRef = useRef(0);

  // Only render map after client mount (prevents SSR/hydration issues)
  useEffect(() => {
    console.log("[OnDutyMap] Component mounted, preparing to render map");
    setMounted(true);
  }, []);

  const center = userLocation ?? DEFAULT_CENTER;

  const visibleProfessionals = useMemo(() => {
    const valid = professionals.filter((p) => hasValidCoordinates(p));
    const sorted = [...valid].sort((a, b) => {
      if (a.status === "available" && b.status !== "available") return -1;
      if (a.status !== "available" && b.status === "available") return 1;
      return 0;
    });
    return sorted.slice(0, MAX_PINS);
  }, [professionals]);

  const handleLoad = useCallback(() => {
    console.log("[OnDutyMap] ✅ Map initialized successfully");
    console.log("[OnDutyMap] ✅ Provider loaded: OSM raster tiles");
    setMapLoaded(true);
    errorCountRef.current = 0;
  }, []);

  const handleError = useCallback((event: any) => {
    errorCountRef.current += 1;
    const msg = event?.error?.message ?? "unknown";
    console.error("[OnDutyMap] Map error:", { count: errorCountRef.current, message: msg });

    // Only fail after many consecutive errors
    if (errorCountRef.current >= 10) {
      console.error("[OnDutyMap] Too many errors, showing fallback");
      setMapError(true);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="w-full flex items-center justify-center bg-muted/30" style={{ minHeight: 400, height: "calc(100vh - 140px)" }}>
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Preparing map…</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className="w-full flex items-center justify-center bg-muted/30 border border-border rounded-lg"
        style={{ minHeight: 400, height: "calc(100vh - 140px)" }}
      >
        <div className="text-center p-6 max-w-xs">
          <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-3" />
          <p className="text-base font-semibold mb-1">Map could not be loaded</p>
          <p className="text-xs text-muted-foreground mb-4">
            There was a problem rendering the map. Please try the list view instead.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setMapError(false);
              setMapLoaded(false);
              errorCountRef.current = 0;
            }}
          >
            Retry Map
          </Button>
        </div>
      </div>
    );
  }

  console.log("[OnDutyMap] Rendering MapGL component", {
    center,
    pinCount: visibleProfessionals.length,
    testPin: STATIC_TEST_PIN,
  });

  return (
    <div
      className="w-full relative"
      style={{ minHeight: 400, height: "calc(100vh - 140px)" }}
    >
      <MapGL
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: userLocation ? 11 : 4,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={OSM_STYLE as any}
        attributionControl={true}
        onLoad={handleLoad}
        onError={handleError}
      >
        <NavigationControl position="top-right" />

        {/* Static test pin — always visible for debugging */}
        <Marker
          longitude={STATIC_TEST_PIN.lng}
          latitude={STATIC_TEST_PIN.lat}
          anchor="center"
        >
          <div
            className="rounded-full border-2 border-background shadow-lg"
            style={{
              width: 16,
              height: 16,
              backgroundColor: "hsl(var(--primary))",
              boxShadow: "0 0 8px hsl(var(--primary) / 0.5)",
            }}
            title="Static test pin"
          />
        </Marker>

        {/* Live professional pins */}
        {visibleProfessionals.map((pro) => (
          <Marker
            key={pro.id}
            longitude={pro.lng}
            latitude={pro.lat}
            anchor="center"
          >
            <DutyPin
              pro={pro}
              isBursting={burstingIds.has(pro.id)}
              onClick={() => onSelect(pro)}
            />
          </Marker>
        ))}
      </MapGL>

      {!mapLoaded && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-[500] rounded-lg bg-card/95 border border-border px-3 py-2 shadow-sm flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading map tiles…
        </div>
      )}

      {mapLoaded && (
        <div className="absolute right-2 bottom-2 z-[500] rounded bg-card/80 border border-border px-2 py-1 text-[10px] text-muted-foreground">
          {visibleProfessionals.length} pins + 1 test pin
        </div>
      )}
    </div>
  );
}

export default function OnDutyMapPage() {
  const webGLAvailable = useMemo(() => hasWebGLSupport(), []);
  const [view, setView] = useState<"map" | "list">(webGLAvailable ? "map" : "list");
  const [selectedPro, setSelectedPro] = useState<OnDutyProfessional | null>(null);
  const { data: professionals, isLoading } = useOnDutyProfessionals();
  const { location: userLocation } = useUserLocation();
  const { latestEvent, clearEvent } = useOnDutyRealtime();

  const [burstingIds, setBurstingIds] = useState<Set<string>>(new Set());
  const [toastPro, setToastPro] = useState<OnDutyProfessional | null>(null);
  const [professionFilter, setProfessionFilter] = useState<string | null>(null);

  // Debug: log WebGL support
  useEffect(() => {
    console.log("[OnDutyMap] WebGL available:", webGLAvailable);
    console.log("[OnDutyMap] Initial view:", webGLAvailable ? "map" : "list");
  }, [webGLAvailable]);

  const professionNames = useMemo(() => {
    if (!professionals) return [];
    const names = new Set(professionals.map((p) => p.profession_name).filter(Boolean) as string[]);
    return [...names].sort();
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    if (!professionals) return [];
    if (!professionFilter) return professionals;
    return professionals.filter((p) => p.profession_name === professionFilter);
  }, [professionals, professionFilter]);

  // Debug logging
  useEffect(() => {
    if (professionals) {
      const withCoords = professionals.filter((p) => hasValidCoordinates(p));
      console.log(`[OnDutyMap] Fetched: ${professionals.length} users, ${withCoords.length} with valid coords`);
    }
  }, [professionals]);

  // Realtime events
  useEffect(() => {
    if (!professionals || !latestEvent) return;
    if (!latestEvent.isOnDuty) return;

    const newPro = professionals.find((p) => p.id === latestEvent.userId);
    if (newPro) {
      setBurstingIds((prev) => new Set(prev).add(newPro.id));
      setToastPro(newPro);
      setTimeout(() => {
        setBurstingIds((prev) => {
          const next = new Set(prev);
          next.delete(newPro.id);
          return next;
        });
      }, 4000);
    }
    clearEvent();
  }, [professionals, latestEvent, clearEvent]);

  const availableCount = professionals?.length ?? 0;
  const handleSelect = useCallback((pro: OnDutyProfessional) => {
    setSelectedPro(pro);
    setToastPro(null);
  }, []);
  const handleClose = useCallback(() => setSelectedPro(null), []);
  const handleToastClose = useCallback(() => setToastPro(null), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>On-Duty Professionals Near You | CardPilot</title>
        <meta name="description" content="Find available professionals near you right now. See who's on duty and ready to help." />
      </Helmet>

      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                <Radio className="h-4 w-4 text-success animate-pulse" />
                On-Duty Map
                <Badge className="text-[9px] h-4 px-1.5 bg-success/10 text-success border-success/20 font-medium gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                  </span>
                  Live
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Loading..." : `${availableCount} on duty now`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("map")}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                  view === "map" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapIcon className="h-3 w-3" /> Map
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                  view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3 w-3" /> List
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" /> On Duty now
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Tap a pin to connect instantly
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map…</p>
          </div>
        </div>
      ) : view === "map" ? (
        <div className="flex-1 relative">
          <OnDutyMapView
            professionals={professionals ?? []}
            burstingIds={burstingIds}
            onSelect={handleSelect}
            userLocation={userLocation}
          />

          <LiveActivityToast
            professional={toastPro}
            onClose={handleToastClose}
            onSelect={handleSelect}
          />

          {(professionals ?? []).filter(hasValidCoordinates).length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-card border border-border rounded-xl p-4 shadow-lg text-center max-w-xs">
              <MapPin className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">No active users yet</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later or browse the directory.</p>
              <Button asChild size="sm" className="mt-3" variant="outline">
                <Link to="/discover">Browse Directory</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Available Near You Right Now</h2>
            <p className="text-xs text-muted-foreground">
              Tap any professional to instantly connect.
            </p>
          </div>

          {professionNames.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setProfessionFilter(null)}
                className={`filter-chip ${!professionFilter ? "filter-chip-active" : ""}`}
              >
                All
              </button>
              {professionNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setProfessionFilter(professionFilter === name ? null : name)}
                  className={`filter-chip ${professionFilter === name ? "filter-chip-active" : ""}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-success/20 bg-success/5 p-3 mb-4 flex items-start gap-2.5">
            <Zap className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Why choose on-duty professionals?</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                On-duty pros respond faster, are actively available, and have higher lead conversion rates.
              </p>
            </div>
          </div>

          {toastPro && (
            <motion.div
              key={toastPro.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 overflow-hidden"
            >
              <button
                onClick={() => handleSelect(toastPro)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/20 hover:bg-success/10 transition-colors text-left"
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                </span>
                <span className="text-xs font-medium text-success">{toastPro.name}</span>
                <span className="text-xs text-muted-foreground">just went on duty</span>
              </button>
            </motion.div>
          )}

          {filteredProfessionals.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">
                {professionFilter ? `No ${professionFilter}s on duty` : "No active users yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {professionFilter ? "Try removing the filter or check back later." : "Check back later or browse all professionals."}
              </p>
              {professionFilter ? (
                <Button className="mt-4" variant="outline" size="sm" onClick={() => setProfessionFilter(null)}>
                  Clear Filter
                </Button>
              ) : (
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/discover">Browse Directory</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProfessionals.map((pro) => (
                <ProfessionalListCard key={pro.id} pro={pro} onSelect={handleSelect} />
              ))}
            </div>
          )}
        </div>
      )}

      <InstantConnectPanel professional={selectedPro} onClose={handleClose} />
    </div>
  );
}
