import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, CheckCircle2, ArrowUpRight, Smartphone, LayoutGrid,
  ChevronLeft, ChevronRight, Phone, MessageSquare, Calendar,
  FileText, Download, MapPin,
} from "lucide-react";
import { DEMO_CARDS, type DemoCard } from "@/lib/demoCards";

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ── Grid card (existing style) ── */
function GridCard({ card }: { card: DemoCard }) {
  return (
    <Link to={`/demo/${card.slug}`} className="block group">
      <div className="landing-card rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
        <div className="relative h-28">
          <div className="absolute inset-0 overflow-hidden">
            <img src={card.coverUrl} alt={card.company} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          <div className="absolute -bottom-5 left-4">
            <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-card shadow-md">
              <img src={card.avatarUrl} alt={card.name} className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-black/40 text-white backdrop-blur-sm">{card.profession}</span>
          </div>
        </div>
        <div className="pt-7 px-4 pb-4 space-y-2.5">
          <div>
            <h3 className="font-bold text-foreground text-sm leading-tight">{card.name}</h3>
            <p className="text-2xs text-muted-foreground mt-0.5">{card.company} · {card.city}</p>
          </div>
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
            {card.services.length > 3 && <p className="text-2xs text-muted-foreground">+{card.services.length - 3} more</p>}
          </div>
          <div className="flex items-center gap-0.5 pt-0.5">
            {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-3 w-3 fill-warning text-warning" />)}
            <span className="text-2xs text-muted-foreground ml-1">5.0 ({card.testimonials.length})</span>
          </div>
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

/* ── Phone mockup card ── */
function PhoneMockupCard({ card }: { card: DemoCard }) {
  return (
    <div className="mx-auto w-[280px]">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-[6px] border-foreground/10 bg-card shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="h-6 bg-foreground/5 flex items-center justify-between px-5">
          <span className="text-[8px] font-medium text-muted-foreground">9:41</span>
          <div className="flex gap-1">
            <div className="h-1.5 w-3 rounded-sm bg-muted-foreground/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          </div>
        </div>

        {/* Card content inside phone */}
        <div className="overflow-y-auto max-h-[480px] scrollbar-hide">
          {/* Cover */}
          <div className="relative h-32">
            <img src={card.coverUrl} alt={card.company} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          {/* Profile section */}
          <div className="relative px-4 pb-4 -mt-6">
            <div className="h-14 w-14 rounded-full overflow-hidden ring-3 ring-card shadow-lg">
              <img src={card.avatarUrl} alt={card.name} className="h-full w-full object-cover" />
            </div>
            <div className="mt-2">
              <h3 className="text-sm font-bold text-foreground">{card.name}</h3>
              <p className="text-2xs text-muted-foreground">{card.company}</p>
              <p className="text-2xs font-medium mt-0.5" style={{ color: card.accentColor }}>{card.profession}</p>
              <div className="flex items-center gap-1 text-muted-foreground text-2xs mt-1">
                <MapPin className="h-2.5 w-2.5" /> {card.city}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {[
                { icon: Phone, label: "Call", color: "hsl(var(--success))" },
                { icon: MessageSquare, label: "Text", color: "hsl(var(--primary))" },
                { icon: Calendar, label: "Book", color: card.accentColor },
                { icon: FileText, label: "Quote", color: "hsl(25,95%,53%)" },
                { icon: Download, label: "Save", color: "hsl(262,83%,58%)" },
              ].map((cta) => (
                <div key={cta.label} className="flex flex-col items-center gap-1 py-2 rounded-lg border border-border bg-background">
                  <cta.icon className="h-3.5 w-3.5" style={{ color: cta.color }} />
                  <span className="text-[8px] font-medium text-foreground">{cta.label}</span>
                </div>
              ))}
            </div>

            {/* Services */}
            <div className="mt-3">
              <p className="text-xs font-bold text-foreground mb-1.5">Services</p>
              <div className="space-y-1">
                {card.services.slice(0, 4).map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-2xs p-2 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="h-2.5 w-2.5 text-success shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </div>
                    <span className="text-muted-foreground font-medium shrink-0 ml-2">{s.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            {card.testimonials[0] && (
              <div className="mt-3 p-2.5 rounded-lg border border-border bg-background">
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 fill-warning text-warning" />)}
                </div>
                <p className="text-2xs text-foreground italic leading-relaxed">"{card.testimonials[0].text.slice(0, 80)}…"</p>
                <p className="text-[8px] text-muted-foreground mt-1">— {card.testimonials[0].name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Home indicator */}
        <div className="h-5 flex items-center justify-center bg-card">
          <div className="h-1 w-24 rounded-full bg-foreground/15" />
        </div>
      </div>

      {/* Card name below phone */}
      <Link to={`/demo/${card.slug}`} className="block mt-3 text-center group">
        <p className="text-sm font-bold text-foreground">{card.name}</p>
        <p className="text-2xs text-muted-foreground">{card.profession}</p>
        <span className="text-2xs text-primary font-medium group-hover:underline">View full card →</span>
      </Link>
    </div>
  );
}

export default function DemoCardsSection() {
  const [viewMode, setViewMode] = useState<"grid" | "phone">("phone");
  const [phoneIndex, setPhoneIndex] = useState(0);

  return (
    <section id="examples" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="text-center mb-10">
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Example Cards</p>
          <h2 className="text-display text-3xl md:text-4xl lg:text-5xl mb-4">Cards for every profession</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">See how professionals in different industries use guzzl.pro to grow their business.</p>
        </motion.div>

        {/* View toggle */}
        <div className="flex items-center justify-center gap-1 mb-10">
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-muted/30 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode("phone")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                viewMode === "phone" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Phone Preview
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            /* Grid view */
            <motion.div
              key="grid"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5"
            >
              {DEMO_CARDS.map((card) => (
                <motion.div key={card.slug} variants={scaleIn}>
                  <GridCard card={card} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Phone mockup carousel */
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              className="flex flex-col items-center"
            >
              {/* Desktop: show 3 phones */}
              <div className="hidden md:flex items-end justify-center gap-8">
                {DEMO_CARDS.slice(phoneIndex, phoneIndex + 3).map((card, i) => (
                  <motion.div
                    key={card.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: i === 1 ? 1.05 : 0.95 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className={i === 1 ? "z-10" : "opacity-80"}
                  >
                    <PhoneMockupCard card={card} />
                  </motion.div>
                ))}
              </div>

              {/* Mobile: show 1 phone */}
              <div className="md:hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`phone-${phoneIndex}`}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PhoneMockupCard card={DEMO_CARDS[phoneIndex]} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Nav controls */}
              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={() => setPhoneIndex((p) => Math.max(0, p - 1))}
                  disabled={phoneIndex === 0}
                  className="h-9 w-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1.5">
                  {DEMO_CARDS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhoneIndex(i)}
                      className={`h-2 rounded-full transition-all ${i === phoneIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPhoneIndex((p) => Math.min(DEMO_CARDS.length - 1, p + 1))}
                  disabled={phoneIndex >= DEMO_CARDS.length - (viewMode === "phone" ? 1 : 3)}
                  className="h-9 w-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
