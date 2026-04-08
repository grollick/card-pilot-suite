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
            {/* Map placeholder with dots */}
            <div className="absolute inset-0 bg-muted/50 rounded-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.08)_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--accent)/0.06)_0%,transparent_40%)]" />

              {/* Simulated map pins */}
              {[
                { top: "25%", left: "20%", name: "Jake M.", role: "Plumber", active: true },
                { top: "40%", left: "55%", name: "Sarah L.", role: "Painter", active: true },
                { top: "60%", left: "35%", name: "Marco R.", role: "Electrician", active: false },
                { top: "30%", left: "70%", name: "Lisa K.", role: "Cleaner", active: true },
                { top: "70%", left: "65%", name: "Tom B.", role: "Landscaper", active: true },
              ].map((pin) => (
                <div
                  key={pin.name}
                  className="absolute flex flex-col items-center"
                  style={{ top: pin.top, left: pin.left }}
                >
                  <div
                    className={`h-3.5 w-3.5 rounded-full border-2 border-card shadow-sm ${
                      pin.active ? "bg-success animate-pulse" : "bg-muted-foreground/40"
                    }`}
                  />
                  <div className="mt-1 px-2 py-0.5 rounded-md bg-card/90 border border-border shadow-sm backdrop-blur-sm">
                    <p className="text-[9px] font-semibold text-foreground leading-tight">{pin.name}</p>
                    <p className="text-[8px] text-muted-foreground">{pin.role}</p>
                  </div>
                </div>
              ))}

              {/* Search bar mock */}
              <div className="absolute top-4 left-4 right-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border shadow-card">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Search pros near you…</span>
                </div>
              </div>

              {/* On Duty indicator */}
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-semibold text-success">4 Pros On Duty</span>
                </div>
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
