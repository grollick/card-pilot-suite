import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Radio, Search, Users, Eye, Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const highlights = [
  {
    icon: Radio,
    title: "On Duty — Real-Time Visibility",
    desc: "Toggle 'On Duty' and instantly appear on the local map. Customers see who's available right now.",
  },
  {
    icon: Search,
    title: "Get Found by Profession & Location",
    desc: "Homeowners search 'plumber near me' and find you. Optimized for local discovery.",
  },
  {
    icon: Eye,
    title: "Your Profile, Always Working",
    desc: "Your card acts as a living storefront — services, reviews, portfolio, and booking — 24/7.",
  },
  {
    icon: Users,
    title: "Community Trust Signals",
    desc: "Verified badges, star ratings, and real reviews build instant credibility with new customers.",
  },
];

export default function MarketplaceSection() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [-89.2477, 48.3809],
      zoom: 12,
      interactive: false,
      attributionControl: false,
    });
    const pins = [
      { lng: -89.27, lat: 48.39, name: "Jake M.", role: "Plumber" },
      { lng: -89.23, lat: 48.37, name: "Sarah L.", role: "Painter" },
      { lng: -89.26, lat: 48.36, name: "Marco R.", role: "Electrician" },
      { lng: -89.22, lat: 48.40, name: "Lisa K.", role: "Cleaner" },
      { lng: -89.21, lat: 48.38, name: "Tom B.", role: "Landscaper" },
    ];
    map.on("load", () => {
      pins.forEach((pin) => {
        const el = document.createElement("div");
        el.style.display = "flex";
        el.style.flexDirection = "column";
        el.style.alignItems = "center";
        el.innerHTML = `
          <div style="width:14px;height:14px;border-radius:50%;border:2px solid white;background:#22c55e;box-shadow:0 1px 3px rgba(0,0,0,.2);"></div>
          <div style="margin-top:4px;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,.92);border:1px solid #e5e7eb;backdrop-filter:blur(4px);box-shadow:0 1px 2px rgba(0,0,0,.08);">
            <p style="font-size:9px;font-weight:600;color:#111;line-height:1.2;">${pin.name}</p>
            <p style="font-size:8px;color:#6b7280;">${pin.role}</p>
          </div>
        `;
        new maplibregl.Marker({ element: el, anchor: "top" })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);
      });
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 -z-10 gradient-mesh" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
            Local Discovery
          </p>
          <h2 className="text-display text-3xl md:text-4xl lg:text-5xl mb-4">
            Be the first pro customers find{" "}
            <span className="gradient-text">in your area</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            The guzzl.pro marketplace connects you with local customers actively looking for your services.
          </p>
        </motion.div>

        {/* Map preview mock + feature cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Mock map preview */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="lg:col-span-2 landing-card rounded-2xl p-1 relative overflow-hidden min-h-[320px]"
          >
            {/* Real map */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div ref={mapContainer} className="w-full h-full" />
            </div>

              {/* Search bar mock */}
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border shadow-card">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Search pros near you…</span>
                </div>
              </div>

              {/* On Duty indicator */}
              <div className="absolute bottom-4 left-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-semibold text-success">4 Pros On Duty</span>
                </div>
              </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {highlights.map((h) => (
              <motion.div
                key={h.title}
                variants={scaleIn}
                className="landing-card rounded-2xl p-6"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{h.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
