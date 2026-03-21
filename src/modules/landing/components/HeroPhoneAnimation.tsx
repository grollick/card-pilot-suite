import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageSquare, Calendar, MapPin, ChevronRight,
  Bell, UserPlus, CheckCircle2, Star, Scissors, Dumbbell, Home,
} from "lucide-react";

/* ── Lazy image loader — only loads assets for current + next persona ── */
const imageModules: Record<string, () => Promise<{ default: string }>> = {
  "mike-avatar": () => import("@/assets/demo/mike-reynolds.jpg"),
  "mike-cover": () => import("@/assets/demo/project-kitchen.jpg"),
  "marcus-avatar": () => import("@/assets/demo/marcus-cole.jpg"),
  "marcus-cover": () => import("@/assets/demo/cover-barbershop.jpg"),
  "sarah-avatar": () => import("@/assets/demo/sarah-chen.jpg"),
  "sarah-cover": () => import("@/assets/demo/cover-realtor.jpg"),
  "jessica-avatar": () => import("@/assets/demo/jessica-martinez.jpg"),
  "jessica-cover": () => import("@/assets/demo/cover-trainer.jpg"),
  "tanya-avatar": () => import("@/assets/demo/tanya-brooks.jpg"),
  "tanya-cover": () => import("@/assets/demo/cover-hairstylist.jpg"),
  "david-avatar": () => import("@/assets/demo/david-nguyen.jpg"),
  "david-cover": () => import("@/assets/demo/cover-landscaper.jpg"),
};

const imageCache = new Map<string, string>();

async function preloadImages(keys: string[]) {
  await Promise.all(
    keys.map(async (k) => {
      if (imageCache.has(k)) return;
      const mod = await imageModules[k]?.();
      if (mod) imageCache.set(k, mod.default);
    })
  );
}

/* ── Persona definitions ── */
interface Persona {
  name: string;
  company: string;
  tagline: string;
  city: string;
  avatarKey: string;
  coverKey: string;
  accentHsl: string;
  services: { name: string; price: string }[];
  cta: string;
  stages: { key: string; duration: number }[];
}

const PERSONAS: Persona[] = [
  {
    name: "Mike Reynolds",
    company: "Reynolds Construction",
    tagline: "Quality builds. On time. On budget.",
    city: "Toronto, ON",
    avatarKey: "mike-avatar",
    coverKey: "mike-cover",
    accentHsl: "25, 95%, 53%",
    services: [
      { name: "Kitchen Remodel", price: "$15,000+" },
      { name: "Bathroom Renovation", price: "$8,000+" },
      { name: "Deck & Patio Build", price: "$5,000+" },
    ],
    cta: "📋 Get Free Estimate",
    stages: [
      { key: "idle", duration: 2200 },
      { key: "tap", duration: 800 },
      { key: "form", duration: 1800 },
      { key: "submitted", duration: 1200 },
      { key: "crm", duration: 2600 },
    ],
  },
  {
    name: "Marcus Cole",
    company: "Fresh Cuts Studio",
    tagline: "Sharp looks. Sharp confidence.",
    city: "Vancouver, BC",
    avatarKey: "marcus-avatar",
    coverKey: "marcus-cover",
    accentHsl: "262, 83%, 58%",
    services: [
      { name: "Classic Haircut", price: "$35" },
      { name: "Skin Fade", price: "$45" },
      { name: "Beard Trim & Shape", price: "$20" },
    ],
    cta: "✂️ Book Appointment",
    stages: [
      { key: "idle", duration: 2200 },
      { key: "tap", duration: 800 },
      { key: "booking", duration: 2200 },
      { key: "booked", duration: 1400 },
    ],
  },
  {
    name: "Sarah Chen",
    company: "Chen Realty Group",
    tagline: "Your home journey starts here.",
    city: "San Diego, CA",
    avatarKey: "sarah-avatar",
    coverKey: "sarah-cover",
    accentHsl: "152, 69%, 40%",
    services: [
      { name: "Home Buying Consultation", price: "Free" },
      { name: "Listing & Market Analysis", price: "Free" },
      { name: "Investment Advisory", price: "Custom" },
    ],
    cta: "🏡 Get Home Valuation",
    stages: [
      { key: "idle", duration: 2200 },
      { key: "tap", duration: 800 },
      { key: "testimonial", duration: 3000 },
    ],
  },
  {
    name: "Jessica Martinez",
    company: "FitLife Coaching",
    tagline: "Stronger every day.",
    city: "Montreal, QC",
    avatarKey: "jessica-avatar",
    coverKey: "jessica-cover",
    accentHsl: "199, 89%, 48%",
    services: [
      { name: "1-on-1 Training", price: "$85/ses" },
      { name: "Group Fitness Class", price: "$25" },
      { name: "Nutrition Coaching", price: "$200/mo" },
    ],
    cta: "💪 Book Free Trial",
    stages: [
      { key: "idle", duration: 2200 },
      { key: "tap", duration: 800 },
      { key: "form", duration: 1800 },
      { key: "submitted", duration: 1200 },
      { key: "crm", duration: 2600 },
    ],
  },
  {
    name: "Tanya Brooks",
    company: "Glow Hair Studio",
    tagline: "Your best hair day, every day.",
    city: "Austin, TX",
    avatarKey: "tanya-avatar",
    coverKey: "tanya-cover",
    accentHsl: "330, 70%, 55%",
    services: [
      { name: "Cut & Style", price: "$65" },
      { name: "Color & Highlights", price: "$120+" },
      { name: "Blowout", price: "$45" },
    ],
    cta: "💇‍♀️ Book Appointment",
    stages: [
      { key: "idle", duration: 2200 },
      { key: "tap", duration: 800 },
      { key: "booking", duration: 2200 },
      { key: "booked", duration: 1400 },
    ],
  },
  {
    name: "David Nguyen",
    company: "GreenScape Pro",
    tagline: "Lawns that make neighbors jealous.",
    city: "Denver, CO",
    avatarKey: "david-avatar",
    coverKey: "david-cover",
    accentHsl: "142, 76%, 36%",
    services: [
      { name: "Lawn Care Package", price: "$150/mo" },
      { name: "Landscape Design", price: "$2,500+" },
      { name: "Seasonal Cleanup", price: "$250" },
    ],
    cta: "🌿 Get Free Quote",
    stages: [
      { key: "idle", duration: 2200 },
      { key: "tap", duration: 800 },
      { key: "form", duration: 1800 },
      { key: "submitted", duration: 1200 },
      { key: "crm", duration: 2600 },
    ],
  },
];

/* ── Component ── */
export default function HeroPhoneAnimation() {
  const [personaIdx, setPersonaIdx] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const persona = PERSONAS[personaIdx];
  const stage = persona.stages[stageIdx].key;

  const advanceToNextPersona = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setPersonaIdx((i) => (i + 1) % PERSONAS.length);
      setStageIdx(0);
      setTransitioning(false);
    }, 500);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = stageIdx + 1;
      if (next < persona.stages.length) {
        setStageIdx(next);
      } else {
        advanceToNextPersona();
      }
    }, persona.stages[stageIdx].duration);
    return () => clearTimeout(timer);
  }, [stageIdx, personaIdx, persona, advanceToNextPersona]);

  const accentColor = `hsl(${persona.accentHsl})`;

  return (
    <div className="w-full max-w-[300px] mx-auto">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-2 border-border bg-card shadow-2xl overflow-hidden relative">
        {/* Notch */}
        <div className="flex justify-center pt-2.5 pb-1 bg-card">
          <div className="w-20 h-4 bg-foreground/10 rounded-full" />
        </div>

        {/* Screen */}
        <div className="bg-background min-h-[420px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!transitioning && (
              <motion.div
                key={personaIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
              >
                {/* Card content — dims during overlay stages */}
                <motion.div
                  animate={{ opacity: ["crm", "testimonial"].includes(stage) ? 0.15 : 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Cover photo */}
                  <div className="h-24 relative">
                    <div className="absolute inset-0 overflow-hidden">
                      <img src={persona.coverUrl} alt="Cover" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute -bottom-6 left-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden ring-[3px] ring-card shadow-lg">
                        <img src={persona.avatarUrl} alt={persona.name} className="h-full w-full object-cover" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-3">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-black/40 text-white backdrop-blur-sm">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                      </span>
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="px-4 mt-8">
                    <h3 className="text-sm font-bold text-foreground">{persona.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">{persona.company}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: accentColor }}>{persona.tagline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {persona.city}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="h-2.5 w-2.5 fill-warning text-warning" />
                        ))}
                        <span className="text-[9px] text-muted-foreground ml-0.5">5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 gap-1.5 px-4 mt-3">
                    {[
                      { icon: Phone, label: "Call", color: "hsl(142,71%,45%)" },
                      { icon: MessageSquare, label: "Text", color: "hsl(217,91%,60%)" },
                      { icon: Calendar, label: "Book", color: "hsl(25,95%,53%)" },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium bg-card border border-border">
                        <Icon className="h-3 w-3" style={{ color }} />
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Services */}
                  <div className="px-4 mt-3 space-y-1">
                    {persona.services.map((s) => (
                      <div key={s.name} className="flex items-center justify-between py-1.5 text-[10px] border-b border-border/40 last:border-0">
                        <span className="flex items-center gap-1 text-foreground">
                          <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                          {s.name}
                        </span>
                        <span className="text-muted-foreground font-medium">{s.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA button */}
                  <div className="px-4 mt-3">
                    <motion.div
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold text-white relative overflow-hidden"
                      style={{ backgroundColor: accentColor }}
                      animate={stage === "tap" ? { scale: [1, 0.95, 1], transition: { duration: 0.3 } } : {}}
                    >
                      <AnimatePresence>
                        {stage === "tap" && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0.4 }}
                            animate={{ scale: 3, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="absolute h-8 w-8 rounded-full bg-white/30"
                          />
                        )}
                      </AnimatePresence>
                      {persona.cta}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Tap cursor */}
                <AnimatePresence>
                  {stage === "tap" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute bottom-[78px] left-1/2 -translate-x-1/2 z-10"
                    >
                      <div className="h-8 w-8 rounded-full bg-foreground/20 backdrop-blur-sm border-2 border-foreground/30 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-foreground/60" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Quote/Contact Form overlay (Contractor & Trainer) ── */}
                <AnimatePresence>
                  {(stage === "form" || stage === "submitted") && (
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute inset-x-0 bottom-0 bg-card border-t border-border rounded-t-2xl p-4 z-20 shadow-xl"
                    >
                      <div className="w-8 h-1 rounded-full bg-border mx-auto mb-3" />
                      {stage === "form" ? (
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-foreground">
                            {personaIdx === 3 ? "Book a Free Session" : "Request a Quote"}
                          </p>
                          <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 0.2 }} className="h-8 rounded-lg bg-muted border border-border overflow-hidden">
                            <div className="px-2.5 py-1.5 text-[10px] text-foreground whitespace-nowrap">
                              {personaIdx === 3 ? "Alex Turner" : "Sarah Williams"}
                            </div>
                          </motion.div>
                          <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.6, delay: 0.6 }} className="h-8 rounded-lg bg-muted border border-border overflow-hidden">
                            <div className="px-2.5 py-1.5 text-[10px] text-foreground whitespace-nowrap">
                              {personaIdx === 3 ? "alex@gmail.com" : "sarah@email.com"}
                            </div>
                          </motion.div>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="w-full rounded-xl py-2 text-[10px] font-semibold text-white text-center" style={{ backgroundColor: accentColor }}>
                            Submit Request →
                          </motion.div>
                        </div>
                      ) : (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-3">
                          <div className="h-10 w-10 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-2">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          </div>
                          <p className="text-xs font-bold text-foreground">
                            {personaIdx === 3 ? "Session Booked!" : "Quote Requested!"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">We'll get back to you shortly</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Booking overlay (Barber) ── */}
                <AnimatePresence>
                  {(stage === "booking" || stage === "booked") && (
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute inset-x-0 bottom-0 bg-card border-t border-border rounded-t-2xl p-4 z-20 shadow-xl"
                    >
                      <div className="w-8 h-1 rounded-full bg-border mx-auto mb-3" />
                      {stage === "booking" ? (
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-foreground">Pick a Time</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {["9:00 AM", "10:30 AM", "2:00 PM"].map((t, i) => (
                              <motion.div
                                key={t}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.2 }}
                                className={`text-center py-2 rounded-lg text-[10px] font-medium border ${i === 1 ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}
                              >
                                {t}
                              </motion.div>
                            ))}
                          </div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="w-full rounded-xl py-2 text-[10px] font-semibold text-white text-center"
                            style={{ backgroundColor: accentColor }}
                          >
                            Confirm Booking →
                          </motion.div>
                        </div>
                      ) : (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-3">
                          <div className="h-10 w-10 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-2">
                            <Calendar className="h-5 w-5 text-success" />
                          </div>
                          <p className="text-xs font-bold text-foreground">Appointment Booked!</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Tue, Mar 25 · 10:30 AM</p>
                          <p className="text-[9px] text-muted-foreground">Skin Fade · $45</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Testimonial overlay (Realtor) ── */}
                <AnimatePresence>
                  {stage === "testimonial" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-5"
                    >
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full rounded-2xl border border-border bg-card p-4 shadow-xl"
                      >
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                          ))}
                        </div>
                        <p className="text-[11px] text-foreground leading-relaxed italic">
                          "Sarah found us our dream home in just 3 weeks. Her market knowledge is unmatched — negotiated $40K below asking!"
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-2">— The Rodriguez Family</p>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="w-full rounded-2xl border border-border bg-card p-4 shadow-xl mt-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `hsl(${persona.accentHsl} / 0.1)` }}>
                            <Home className="h-4 w-4" style={{ color: accentColor }} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-foreground">Sold in 5 Days</p>
                            <p className="text-[9px] text-muted-foreground">$1.28M · 22 showings</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="text-[10px] text-muted-foreground mt-4 text-center">
                        Real reviews. Real results.
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── CRM overlay (Contractor & Trainer) ── */}
                <AnimatePresence>
                  {stage === "crm" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-5"
                    >
                      <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 15 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-5"
                      >
                        <Bell className="h-3.5 w-3.5 text-success" />
                        <span className="text-xs font-semibold text-success">New Lead!</span>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="w-full rounded-2xl border border-border bg-card p-4 shadow-xl"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {personaIdx === 3 ? "Alex Turner" : "Sarah Williams"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {personaIdx === 3 ? "alex@gmail.com" : "sarah@email.com"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {personaIdx === 3 ? "Free Trial" : "Quote Request"}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                            New Lead
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                          Added to your CRM automatically
                        </div>
                      </motion.div>

                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-[10px] text-muted-foreground mt-4 text-center">
                        Zero effort. Every lead captured.
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2 bg-card">
          <div className="w-28 h-1 bg-foreground/15 rounded-full" />
        </div>
      </div>

      {/* Persona dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {PERSONAS.map((p, i) => (
          <div
            key={p.name}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === personaIdx ? "w-6 bg-primary" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
