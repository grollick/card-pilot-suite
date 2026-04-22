import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, List, Search, Loader2, Locate, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { resolveProfessionIcon, iconToSvgString } from "./professionIcons";
import MapLegend from "./MapLegend";

const CANADA_CENTER: [number, number] = [-96.8, 56.1304];
const STORAGE_KEY = "guzzl_map_last_location";
const NOMINATIM_HEADERS = { "Accept-Language": "en" };

type MapStatus = "loading" | "ready" | "error";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SavedLoc {
  lat: number;
  lng: number;
  ts: number;
}

function loadSavedLocation(): SavedLoc | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLoc;
    // Reuse if less than 1 hour old
    if (Date.now() - parsed.ts < 60 * 60 * 1000) return parsed;
  } catch {}
  return null;
}

function saveLocation(lat: number, lng: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, ts: Date.now() }));
  } catch {}
}

export default function MapPanel({
  professionals,
  onSwitchToList,
}: {
  professionals: any[];
  onSwitchToList: () => void;
  navigate?: ReturnType<typeof useNavigate>;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapLoadedRef = useRef(false);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userInteractedRef = useRef(false);
  const lastSearchAtRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  // Place / move user-location marker
  const placeUserMarker = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([lng, lat]);
      return;
    }
    const el = document.createElement("div");
    el.className = "user-loc-marker";
    el.innerHTML = `
      <div style="position:relative;width:18px;height:18px;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:hsl(var(--primary));opacity:0.35;animation:pulse 2s ease-out infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:9999px;background:hsl(var(--primary));border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
      </div>
    `;
    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  }, []);

  // Center to coords
  const centerOn = useCallback((lat: number, lng: number, zoom = 12) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [lng, lat], zoom, essential: true });
  }, []);

  // Detect user location via browser
  const detectLocation = useCallback(
    (recenter = true) => {
      if (!navigator.geolocation) return;
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          saveLocation(latitude, longitude);
          placeUserMarker(latitude, longitude);
          if (recenter && !userInteractedRef.current) {
            centerOn(latitude, longitude, 12);
          } else if (recenter) {
            // user explicitly clicked "use my location" — always recenter
            centerOn(latitude, longitude, 12);
            userInteractedRef.current = false;
          }
          setLocating(false);
        },
        () => {
          setLocating(false);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    },
    [centerOn, placeUserMarker]
  );

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    setMapStatus("loading");
    let timeoutId: ReturnType<typeof setTimeout>;

    const saved = loadSavedLocation();
    const initialCenter: [number, number] = saved ? [saved.lng, saved.lat] : CANADA_CENTER;
    const initialZoom = saved ? 11 : 3.5;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      timeoutId = setTimeout(() => {
        if (!mapLoadedRef.current) {
          setMapError("Map timed out — check your internet connection.");
          setMapStatus("error");
        }
      }, 15000);

      map.on("load", () => {
        clearTimeout(timeoutId);
        mapLoadedRef.current = true;
        setMapStatus("ready");

        // Restore saved marker
        if (saved) placeUserMarker(saved.lat, saved.lng);

        // Try fresh detection in background
        if (!saved) detectLocation(true);
        else detectLocation(false);
      });

      map.on("error", (e) => {
        clearTimeout(timeoutId);
        setMapError(`Provider error: ${e.error?.message ?? "unknown"}`);
        setMapStatus("error");
      });

      // Track user interaction so we don't snap them back
      const onUserInteract = () => {
        userInteractedRef.current = true;
      };
      map.on("dragstart", onUserInteract);
      map.on("zoomstart", (ev: any) => {
        if (ev.originalEvent) userInteractedRef.current = true;
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

      mapRef.current = map;
    } catch (err: any) {
      setMapError(`Init failed: ${err?.message}`);
      setMapStatus("error");
    }

    return () => {
      clearTimeout(timeoutId!);
      mapRef.current?.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      mapLoadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render professional markers whenever data changes
  const proMarkersRef = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    if (!mapRef.current || mapStatus !== "ready") return;
    proMarkersRef.current.forEach((m) => m.remove());
    proMarkersRef.current = [];

    professionals.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      const { icon, color, label } = resolveProfessionIcon(p.profession_name);

      const el = document.createElement("div");
      el.className = "guzzl-category-marker";
      el.setAttribute("aria-label", `${p.name ?? "Professional"} — ${label}`);
      el.style.cssText = [
        "width:34px",
        "height:34px",
        "border-radius:9999px",
        `background:${color}`,
        "border:2px solid #FFFFFF",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "cursor:pointer",
        "filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
      ].join(";");
      el.innerHTML = iconToSvgString(icon, 18, "#FFFFFF");

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 22 }).setHTML(
            `<div style="font-size:12px;"><b>${p.name ?? "Professional"}</b>${
              p.profession_name ? `<br/><span style="color:#666">${p.profession_name}</span>` : ""
            }</div>`
          )
        )
        .addTo(mapRef.current!);
      proMarkersRef.current.push(marker);
    });
  }, [professionals, mapStatus]);

  // Debounced Nominatim search (rate limit: max 1/sec)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      const now = Date.now();
      const sinceLast = now - lastSearchAtRef.current;
      if (sinceLast < 1000) {
        await new Promise((r) => setTimeout(r, 1000 - sinceLast));
      }
      lastSearchAtRef.current = Date.now();
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`,
          { headers: NOMINATIM_HEADERS }
        );
        if (res.ok) {
          const data = (await res.json()) as NominatimResult[];
          setSearchResults(data);
          setSearchOpen(true);
          setHighlightIdx(-1);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const selectResult = useCallback(
    (r: NominatimResult) => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        userInteractedRef.current = true;
        centerOn(lat, lng, 12);
      }
      setSearchOpen(false);
      setSearchQuery(r.display_name.split(",")[0]);
    },
    [centerOn]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen || searchResults.length === 0) {
      if (e.key === "Escape") setSearchOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightIdx >= 0 ? highlightIdx : 0;
      if (searchResults[idx]) selectResult(searchResults[idx]);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  const showFallback = mapStatus === "error";

  return (
    <section
      className="relative w-full rounded-xl border border-border bg-muted/30 overflow-hidden"
      style={{ minHeight: 480 }}
    >
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>

      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: 480, display: showFallback ? "none" : "block" }}
      />

      {/* Top overlay: search + locate */}
      {!showFallback && (
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-2 items-start pointer-events-none">
          <div className="relative flex-1 max-w-md pointer-events-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search city, address, or landmark…"
                className="pl-9 pr-9 h-10 bg-background/95 backdrop-blur shadow-md border-border"
                aria-label="Search location"
                aria-autocomplete="list"
                aria-expanded={searchOpen}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Clear search"
                >
                  {searchLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {searchOpen && searchResults.length > 0 && (
              <ul
                role="listbox"
                className="absolute top-full mt-1 left-0 right-0 bg-background/98 backdrop-blur border border-border rounded-lg shadow-lg max-h-64 overflow-auto z-30"
              >
                {searchResults.map((r, i) => (
                  <li
                    key={r.place_id}
                    role="option"
                    aria-selected={i === highlightIdx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectResult(r);
                    }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-start gap-2 ${
                      i === highlightIdx ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-10 w-10 shadow-md bg-background/95 backdrop-blur pointer-events-auto"
            onClick={() => detectLocation(true)}
            disabled={locating}
            aria-label="Use my location"
            title="Use my location"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Legend */}
      {!showFallback && mapStatus === "ready" && <MapLegend />}

      {/* Locating indicator (subtle, near map) */}
      {!showFallback && locating && (
        <div className="absolute bottom-3 right-16 z-20 flex items-center gap-2 bg-background/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Finding your location…
        </div>
      )}

      {/* Loading overlay */}
      {mapStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded">Loading map…</p>
        </div>
      )}

      {/* Fallback */}
      {showFallback && (
        <div className="flex min-h-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Map unavailable right now</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Use List View to see available professionals.
            </p>
            {mapError && (
              <p className="mt-2 max-w-md text-[10px] text-muted-foreground/60 font-mono break-all">
                {mapError}
              </p>
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
