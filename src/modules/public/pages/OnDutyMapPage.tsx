import { useState, useCallback, useEffect, useRef, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOnDutyProfessionals, useUserLocation, type OnDutyProfessional } from "@/hooks/useOnDutyMap";
import { useOnDutyRealtime } from "@/hooks/useOnDutyRealtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin, List, Map as MapIcon, Star, Clock, Zap, Shield,
  MessageSquare, Eye, Radio, Loader2, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InstantConnectPanel from "@/modules/public/components/InstantConnectPanel";

function getViewportHeight() {
  if (typeof window === "undefined") return 800;
  return window.innerHeight || document.documentElement.clientHeight || 800;
}

type TileProvider = {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
};

const TILE_PROVIDERS: TileProvider[] = [
  {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: "CARTO",
    url: "https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    name: "OpenStreetMap HOT",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
];

// ── Leaflet icon factories ──
function createIcon(color: string, isAvailable: boolean) {
  const pulseRings = isAvailable ? `
    <circle cx="14" cy="14" r="18" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4">
      <animate attributeName="r" values="14;24" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="14" cy="14" r="14" fill="none" stroke="${color}" stroke-width="1" opacity="0.3">
      <animate attributeName="r" values="14;20" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
    </circle>
  ` : "";
  const glow = isAvailable
    ? `<circle cx="14" cy="14" r="10" fill="${color}" opacity="0.25"><animate attributeName="opacity" values="0.15;0.35;0.15" dur="2s" repeatCount="indefinite"/></circle>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="-10 -10 48 56">
    ${pulseRings}
    ${glow}
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [48, 56],
    iconAnchor: [24, 46],
    popupAnchor: [0, -46],
  });
}

// Burst icon for newly appeared professionals
function createBurstIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="72" viewBox="-18 -18 64 72">
    <circle cx="14" cy="14" r="28" fill="none" stroke="${color}" stroke-width="2" opacity="0.6">
      <animate attributeName="r" values="14;36" dur="1s" repeatCount="2" fill="freeze"/>
      <animate attributeName="opacity" values="0.6;0" dur="1s" repeatCount="2" fill="freeze"/>
    </circle>
    <circle cx="14" cy="14" r="20" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4">
      <animate attributeName="r" values="14;28" dur="1s" begin="0.3s" repeatCount="2" fill="freeze"/>
      <animate attributeName="opacity" values="0.4;0" dur="1s" begin="0.3s" repeatCount="2" fill="freeze"/>
    </circle>
    <circle cx="14" cy="14" r="12" fill="${color}" opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.15" dur="2s" repeatCount="indefinite"/>
    </circle>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2">
      <animateTransform attributeName="transform" type="scale" values="0.6;1.15;1" dur="0.5s" repeatCount="1" fill="freeze" additive="sum" />
    </path>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [64, 72],
    iconAnchor: [32, 54],
    popupAnchor: [0, -54],
  });
}

const greenIcon = createIcon("#22c55e", true);
const yellowIcon = createIcon("#eab308", false);
const burstGreenIcon = createBurstIcon("#22c55e");

function formatResponseTime(min: number | null) {
  if (!min) return null;
  if (min < 60) return `${Math.round(min)}m`;
  return `${Math.round(min / 60)}h`;
}

// ── Live activity toast ──
function LiveActivityToast({
  professional,
  onClose,
  onSelect,
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

  return (
    <AnimatePresence>
      {professional && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
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
                  {professional.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
      )}
    </AnimatePresence>
  );
}

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
            {pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm truncate">{pro.name}</p>
            {pro.status === "available" && (
              <span className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
            )}
            {pro.status === "recent" && (
              <span className="h-2 w-2 rounded-full bg-warning shrink-0" />
            )}
          </div>
          {pro.profession_name && (
            <p className="text-xs text-muted-foreground truncate">{pro.profession_name}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {pro.badges.map(b => (
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

const MapViewportController = forwardRef<HTMLDivElement, {
  view: "map" | "list";
  tileProviderIndex: number;
  userLocation: { lat: number; lng: number } | null;
}>(function MapViewportController({ view, tileProviderIndex, userLocation }, _ref) {
  const map = useMap();

  useEffect(() => {
    if (view !== "map") return;

    const container = map.getContainer();
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    let raf = 0;

    const invalidate = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        map.invalidateSize({ pan: false });
      }
    };

    raf = requestAnimationFrame(invalidate);
    timers.push(setTimeout(invalidate, 120));
    timers.push(setTimeout(invalidate, 360));
    timers.push(setTimeout(invalidate, 720));

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => invalidate())
      : null;

    observer?.observe(container);
    if (container.parentElement) observer?.observe(container.parentElement);

    const handleViewportChange = () => invalidate();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") invalidate();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      observer?.disconnect();
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [map, view, tileProviderIndex]);

  useEffect(() => {
    if (!userLocation || view !== "map") return;
    map.setView([userLocation.lat, userLocation.lng], 11, { animate: false });
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));
  }, [map, view, userLocation?.lat, userLocation?.lng]);

  return null;
});

export default function OnDutyMapPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedPro, setSelectedPro] = useState<OnDutyProfessional | null>(null);
  const [tileProviderIndex, setTileProviderIndex] = useState(0);
  const [tileStatus, setTileStatus] = useState<"loading" | "ready" | "error">("loading");
  const [viewportHeight, setViewportHeight] = useState<number>(() => getViewportHeight());
  const { data: professionals, isLoading } = useOnDutyProfessionals();
  const { location: userLocation } = useUserLocation();
  const { latestEvent, clearEvent } = useOnDutyRealtime();

  // Track which user IDs are "bursting" (just came online)
  const [burstingIds, setBurstingIds] = useState<Set<string>>(new Set());
  const [toastPro, setToastPro] = useState<OnDutyProfessional | null>(null);
  const tileErrorCountRef = useRef(0);
  const tileLoadedCountRef = useRef(0);
  const prevIdsRef = useRef<Set<string>>(new Set());

  // When realtime event fires and data refreshes, detect new arrivals
  useEffect(() => {
    if (!professionals || !latestEvent) return;
    if (!latestEvent.isOnDuty) return; // Only show for going ON duty

    const currentIds = new Set(professionals.map(p => p.id));
    const newPro = professionals.find(p => p.id === latestEvent.userId);

    if (newPro) {
      // Trigger burst animation
      setBurstingIds(prev => new Set(prev).add(newPro.id));
      // Show toast notification
      setToastPro(newPro);
      // Clear burst after 4 seconds (2 repeats of animation)
      setTimeout(() => {
        setBurstingIds(prev => {
          const next = new Set(prev);
          next.delete(newPro.id);
          return next;
        });
      }, 4000);
    }

    prevIdsRef.current = currentIds;
    clearEvent();
  }, [professionals, latestEvent, clearEvent]);

  const center = userLocation ?? { lat: 39.8283, lng: -98.5795 };
  const activeTile = TILE_PROVIDERS[tileProviderIndex];
  const availableCount = professionals?.filter(p => p.status === "available").length ?? 0;
  const recentCount = professionals?.filter(p => p.status === "recent").length ?? 0;

  const handleSelect = useCallback((pro: OnDutyProfessional) => {
    setSelectedPro(pro);
    setToastPro(null);
  }, []);
  const handleClose = useCallback(() => setSelectedPro(null), []);
  const handleToastClose = useCallback(() => setToastPro(null), []);
  const handleTileLoad = useCallback(() => {
    tileLoadedCountRef.current += 1;
    tileErrorCountRef.current = 0;
    setTileStatus("ready");
  }, []);

  const handleTileError = useCallback(() => {
    tileErrorCountRef.current += 1;

    setTileStatus((prev) => (prev === "ready" ? prev : "error"));

    if (tileErrorCountRef.current >= 4) {
      tileErrorCountRef.current = 0;
      setTileStatus("loading");
      setTileProviderIndex((prev) => (prev < TILE_PROVIDERS.length - 1 ? prev + 1 : prev));
    }
  }, []);

  const handleRetryTiles = useCallback(() => {
    tileErrorCountRef.current = 0;
    setTileStatus("loading");
    setTileProviderIndex((prev) => (prev + 1) % TILE_PROVIDERS.length);
  }, []);

  useEffect(() => {
    if (view === "map") {
      tileErrorCountRef.current = 0;
      tileLoadedCountRef.current = 0;
      setTileStatus("loading");
    }
  }, [view, tileProviderIndex]);

  useEffect(() => {
    if (view !== "map" || tileStatus === "ready") return;

    const timeout = setTimeout(() => {
      if (tileLoadedCountRef.current === 0) {
        handleRetryTiles();
      }
    }, 4500);

    return () => clearTimeout(timeout);
  }, [view, tileStatus, tileProviderIndex, handleRetryTiles]);

  useEffect(() => {
    let raf = 0;

    const updateViewportHeight = () => {
      setViewportHeight(getViewportHeight());
    };

    const onViewportChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateViewportHeight);
    };

    updateViewportHeight();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
    };
  }, []);

  const mapPanelHeight = Math.max(420, viewportHeight - 120);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>On-Duty Professionals Near You | CardPilot</title>
        <meta name="description" content="Find available professionals near you right now. See who's on duty and ready to help." />
      </Helmet>

      {/* Header */}
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
                {isLoading ? "Loading..." : `${availableCount} available now · ${recentCount} recently active`}
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

      {/* Legend */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" /> Available now
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Recently active
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Tap a pin to connect instantly
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "map" ? (
        <div className="flex-1 relative" style={{ minHeight: "420px", height: `${mapPanelHeight}px` }}>
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={userLocation ? 11 : 4}
            className="z-0"
            whenReady={(event) => {
              const map = event.target;
              requestAnimationFrame(() => map.invalidateSize({ pan: false }));
              setTimeout(() => map.invalidateSize({ pan: false }), 250);
            }}
            style={{
              height: "100%",
              width: "100%",
              background: "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--secondary)))",
            }}
          >
            <MapViewportController
              view={view}
              tileProviderIndex={tileProviderIndex}
              userLocation={userLocation}
            />
            <TileLayer
              key={activeTile.name}
              attribution={activeTile.attribution}
              url={activeTile.url}
              subdomains={activeTile.subdomains}
              eventHandlers={{
                tileload: handleTileLoad,
                tileerror: handleTileError,
              }}
            />
            {professionals?.map((pro) => {
              const icon = burstingIds.has(pro.id)
                ? burstGreenIcon
                : pro.status === "available"
                  ? greenIcon
                  : yellowIcon;

              return (
                <Marker
                  key={pro.id}
                  position={[pro.lat, pro.lng]}
                  icon={icon}
                  eventHandlers={{ click: () => handleSelect(pro) }}
                />
              );
            })}
          </MapContainer>

          {/* Live activity toast */}
          <LiveActivityToast
            professional={toastPro}
            onClose={handleToastClose}
            onSelect={handleSelect}
          />

          {tileStatus !== "ready" && (
            <div className="absolute inset-0 z-[550] pointer-events-none flex items-center justify-center p-4">
              <div className="pointer-events-auto w-full max-w-xs rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-lg p-3">
                <div className="flex items-start gap-2.5">
                  {tileStatus === "loading" ? (
                    <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-muted-foreground shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium">
                      {tileStatus === "loading" ? "Loading map…" : "Having trouble loading map tiles"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {tileStatus === "loading"
                        ? `Connecting to ${activeTile.name}`
                        : `Switched to ${activeTile.name}. Retry if it still appears blank.`}
                    </p>
                  </div>
                </div>
                {tileStatus === "error" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 h-7 w-full text-xs"
                    onClick={handleRetryTiles}
                  >
                    Retry map tiles
                  </Button>
                )}
              </div>
            </div>
          )}

          {!professionals?.length && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-card border border-border rounded-xl p-4 shadow-lg text-center max-w-xs">
              <MapPin className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">No professionals on duty right now</p>
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

          <div className="rounded-xl border border-success/20 bg-success/5 p-3 mb-4 flex items-start gap-2.5">
            <Zap className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Why choose on-duty professionals?</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                On-duty pros respond faster, are actively available, and have higher lead conversion rates.
              </p>
            </div>
          </div>

          {/* Live toast for list view too */}
          <AnimatePresence>
            {toastPro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
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
          </AnimatePresence>

          {professionals?.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No professionals on duty right now</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later or browse all professionals.</p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/discover">Browse Directory</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {professionals?.map(pro => (
                <ProfessionalListCard key={pro.id} pro={pro} onSelect={handleSelect} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instant Connect Panel */}
      <InstantConnectPanel professional={selectedPro} onClose={handleClose} />
    </div>
  );
}
