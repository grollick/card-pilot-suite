import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOnDutyProfessionals, useUserLocation, type OnDutyProfessional } from "@/hooks/useOnDutyMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, List, Map as MapIcon, Star, Clock, Zap, Shield,
  MessageSquare, Eye, Radio, Loader2, Navigation, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Leaflet icon factories ──
function createIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

const greenIcon = createIcon("#22c55e");
const yellowIcon = createIcon("#eab308");

function formatResponseTime(min: number | null) {
  if (!min) return null;
  if (min < 60) return `${Math.round(min)}m`;
  return `${Math.round(min / 60)}h`;
}

// ── Recenter map helper ──
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useMemo(() => map.setView([lat, lng], 11), [lat, lng, map]);
  return null;
}

// ── Professional card (list view) ──
function ProfessionalListCard({ pro }: { pro: OnDutyProfessional }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
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
          <Button asChild size="sm" className="h-7 text-xs gap-1">
            <Link to={`/${pro.handle}?quote=1`}>
              <MessageSquare className="h-3 w-3" /> Contact
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OnDutyMapPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const { data: professionals, isLoading } = useOnDutyProfessionals();
  const { location: userLocation, loading: locLoading } = useUserLocation();

  const center = userLocation ?? { lat: 39.8283, lng: -98.5795 };
  const availableCount = professionals?.filter(p => p.status === "available").length ?? 0;
  const recentCount = professionals?.filter(p => p.status === "recent").length ?? 0;

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
              </h1>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Loading..." : `${availableCount} available now · ${recentCount} recently active`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
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
            <Shield className="h-3 w-3" /> Approximate locations for privacy
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "map" ? (
        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 120px)" }}>
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={userLocation ? 11 : 4}
            className="h-full w-full z-0"
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />}
            {professionals?.map(pro => (
              <Marker
                key={pro.id}
                position={[pro.lat, pro.lng]}
                icon={pro.status === "available" ? greenIcon : yellowIcon}
              >
                <Popup>
                  <div className="min-w-[200px] p-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                        {pro.avatar_url ? (
                          <img src={pro.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{pro.name}</p>
                        {pro.profession_name && (
                          <p className="text-xs text-gray-500">{pro.profession_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {pro.status === "available" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Available
                        </span>
                      )}
                      {pro.status === "recent" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                          Recently Active
                        </span>
                      )}
                      {pro.avg_rating && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-600">
                          ★ {pro.avg_rating}
                        </span>
                      )}
                      {pro.avg_response_minutes && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                          ⚡ {formatResponseTime(pro.avg_response_minutes)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <a
                        href={`/${pro.handle}`}
                        className="flex-1 text-center text-xs px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View Profile
                      </a>
                      <a
                        href={`/${pro.handle}?quote=1`}
                        className="flex-1 text-center text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        Contact
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating info card */}
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
        /* List View */
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Available Near You Right Now</h2>
            <p className="text-xs text-muted-foreground">
              Professionals currently on duty and ready to take your request.
            </p>
          </div>

          {/* Benefits callout */}
          <div className="rounded-xl border border-success/20 bg-success/5 p-3 mb-4 flex items-start gap-2.5">
            <Zap className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Why choose on-duty professionals?</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                On-duty pros respond faster, are actively available, and have higher lead conversion rates.
              </p>
            </div>
          </div>

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
                <ProfessionalListCard key={pro.id} pro={pro} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
