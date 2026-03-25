import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_CARDS, type DemoCard } from "@/lib/demoCards";
import {
  Star, CheckCircle2, ArrowUpRight, ChevronLeft, ChevronRight, Palette,
} from "lucide-react";

// Profession filter labels
const PROFESSIONS = [
  { key: "all", label: "All" },
  { key: "Contractor", label: "Contractor" },
  { key: "Barber", label: "Barber" },
  { key: "Realtor", label: "Realtor" },
  { key: "Landscaper", label: "Landscaper" },
  { key: "Trainer", label: "Trainer" },
  { key: "Photographer", label: "Photographer" },
];

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

interface InteractiveCardShowcaseProps {
  headline?: string;
  subheadline?: string;
  showThemePicker?: boolean;
  showProfessionFilter?: boolean;
  maxCards?: number;
  className?: string;
}

function DemoCardItem({ card }: { card: DemoCard }) {
  return (
    <Link to={`/demo/${card.slug}`} className="block group">
      <div className="landing-card rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
        {/* Cover image */}
        <div className="relative h-28">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={card.coverUrl}
              alt={card.company}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          {/* Avatar overlapping cover bottom */}
          <div className="absolute -bottom-5 left-4">
            <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-card shadow-md">
              <img src={card.avatarUrl} alt={card.name} className="h-full w-full object-cover" />
            </div>
          </div>
          {/* Profession badge */}
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-black/40 text-white backdrop-blur-sm">
              {card.profession}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="pt-7 px-4 pb-4 space-y-2.5">
          <div>
            <h3 className="font-bold text-foreground text-sm leading-tight">{card.name}</h3>
            <p className="text-2xs text-muted-foreground mt-0.5">{card.company} · {card.city}</p>
          </div>

          {/* Services */}
          <div className="space-y-1">
            {card.services.slice(0, 3).map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                  <span className="truncate">{s.name}</span>
                </div>
                <span className="text-muted-foreground shrink-0 ml-2 font-medium">{s.price}</span>
              </div>
            ))}
            {card.services.length > 3 && (
              <p className="text-2xs text-muted-foreground">+{card.services.length - 3} more</p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 pt-0.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <Star key={j} className="h-3 w-3 fill-warning text-warning" />
            ))}
            <span className="text-2xs text-muted-foreground ml-1">5.0 ({card.testimonials.length})</span>
          </div>

          {/* CTA */}
          <div className="pt-1">
            <span className="flex items-center justify-center w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              View Card <ArrowUpRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function InteractiveCardShowcase({
  headline = "Interactive Demo Cards",
  subheadline = "Hover, click, and flip — see how your digital card looks and feels in action.",
  showThemePicker = false,
  showProfessionFilter = true,
  maxCards = 6,
  className = "",
}: InteractiveCardShowcaseProps) {
  const [activeProfession, setActiveProfession] = useState<string>("all");
  const [cardIndex, setCardIndex] = useState(0);

  const filteredCards = DEMO_CARDS.filter((card) => {
    if (activeProfession === "all") return true;
    return card.profession === activeProfession;
  }).slice(0, maxCards);

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
        {showProfessionFilter && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
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

        {/* Cards grid — desktop */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card, i) => (
              <motion.div
                key={`${card.slug}-${activeProfession}`}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.06 }}
              >
                <DemoCardItem card={card} />
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
                  key={`mobile-${filteredCards[cardIndex].slug}-${cardIndex}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center"
                >
                  <div className="w-[260px]">
                    <DemoCardItem card={filteredCards[cardIndex]} />
                  </div>
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
                onClick={() => setCardIndex((p) => Math.min(filteredCards.length - 1, p + 1))}
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
          💡 Click any card to see the full interactive experience
        </motion.p>
      </div>
    </section>
  );
}
