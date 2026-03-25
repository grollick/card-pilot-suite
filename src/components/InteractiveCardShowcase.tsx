import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBusinessCard, {
  DEMO_CARDS as ANIMATED_DEMO_CARDS,
  type AnimatedBusinessCardProps,
} from "@/components/AnimatedBusinessCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Paintbrush,
  ChevronLeft,
  ChevronRight,
  Palette,
} from "lucide-react";

// ─── Theme presets ───

interface CardTheme {
  key: string;
  label: string;
  gradient: string;        // cover gradient
  accent: string;          // accent color class
  ring: string;            // glow ring
  description: string;
}

const THEMES: CardTheme[] = [
  {
    key: "ocean",
    label: "Ocean Teal",
    gradient: "from-sky-500 to-cyan-500",
    accent: "sky",
    ring: "ring-sky-400/30",
    description: "Default professional look",
  },
  {
    key: "sunset",
    label: "Sunset Orange",
    gradient: "from-orange-500 to-amber-500",
    accent: "orange",
    ring: "ring-orange-400/30",
    description: "Warm and energetic",
  },
  {
    key: "forest",
    label: "Forest Green",
    gradient: "from-emerald-500 to-teal-500",
    accent: "emerald",
    ring: "ring-emerald-400/30",
    description: "Natural and grounded",
  },
  {
    key: "royal",
    label: "Royal Purple",
    gradient: "from-violet-500 to-purple-500",
    accent: "violet",
    ring: "ring-violet-400/30",
    description: "Bold and premium",
  },
  {
    key: "slate",
    label: "Slate Dark",
    gradient: "from-slate-700 to-slate-900",
    accent: "slate",
    ring: "ring-slate-400/30",
    description: "Sleek and modern",
  },
];

// Profession filter labels
const PROFESSIONS = [
  { key: "all", label: "All" },
  { key: "contractor", label: "Contractor" },
  { key: "barber", label: "Barber" },
  { key: "realtor", label: "Realtor" },
  { key: "landscaper", label: "Landscaper" },
  { key: "trainer", label: "Trainer" },
  { key: "stylist", label: "Stylist" },
  { key: "electrician", label: "Electrician" },
];

function getProfessionKey(business: string): string {
  const b = business.toLowerCase();
  if (b.includes("construction") || b.includes("contractor")) return "contractor";
  if (b.includes("cut") || b.includes("barber")) return "barber";
  if (b.includes("realty") || b.includes("real")) return "realtor";
  if (b.includes("landscape") || b.includes("green")) return "landscaper";
  if (b.includes("training") || b.includes("fit")) return "trainer";
  if (b.includes("hair") || b.includes("studio") || b.includes("salon")) return "stylist";
  if (b.includes("electric")) return "electrician";
  return "other";
}

interface InteractiveCardShowcaseProps {
  headline?: string;
  subheadline?: string;
  showThemePicker?: boolean;
  showProfessionFilter?: boolean;
  maxCards?: number;
  className?: string;
}

export default function InteractiveCardShowcase({
  headline = "Interactive Demo Cards",
  subheadline = "Hover, click, and flip — see how your digital card looks and feels in action.",
  showThemePicker = true,
  showProfessionFilter = true,
  maxCards = 6,
  className = "",
}: InteractiveCardShowcaseProps) {
  const [activeTheme, setActiveTheme] = useState<string>("ocean");
  const [activeProfession, setActiveProfession] = useState<string>("all");
  const [cardIndex, setCardIndex] = useState(0);

  const filteredCards = ANIMATED_DEMO_CARDS.filter((card) => {
    if (activeProfession === "all") return true;
    return getProfessionKey(card.business) === activeProfession;
  }).slice(0, maxCards);

  const theme = THEMES.find((t) => t.key === activeTheme) ?? THEMES[0];

  // For mobile carousel
  const canPrev = cardIndex > 0;
  const canNext = cardIndex < filteredCards.length - 1;

  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
            Live Preview
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {headline}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            {subheadline}
          </p>
        </motion.div>

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          {/* Profession filter */}
          {showProfessionFilter && (
            <div className="flex flex-wrap justify-center gap-2">
              {PROFESSIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setActiveProfession(p.key);
                    setCardIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeProfession === p.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Theme picker */}
          {showThemePicker && (
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTheme(t.key)}
                    title={t.label}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${t.gradient} transition-all ${
                      activeTheme === t.key
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {theme.label}
              </span>
            </div>
          )}
        </div>

        {/* Cards grid — desktop */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card, i) => (
              <motion.div
                key={`${card.name}-${activeProfession}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                <AnimatedBusinessCard {...card} flipEnabled />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Cards carousel — mobile */}
        <div className="sm:hidden">
          <div className="relative">
            <AnimatePresence mode="wait">
              {filteredCards[cardIndex] && (
                <motion.div
                  key={`mobile-${filteredCards[cardIndex].name}-${cardIndex}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center"
                >
                  <AnimatedBusinessCard
                    {...filteredCards[cardIndex]}
                    flipEnabled
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nav arrows */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setCardIndex((p) => Math.max(0, p - 1))}
                disabled={!canPrev}
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {cardIndex + 1} / {filteredCards.length}
              </span>
              <button
                onClick={() =>
                  setCardIndex((p) =>
                    Math.min(filteredCards.length - 1, p + 1)
                  )
                }
                disabled={!canNext}
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          💡 Hover to see animations • Click to flip • Try different themes above
        </motion.p>
      </div>
    </section>
  );
}
