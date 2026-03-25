import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Star, Phone, MessageSquare, Calendar, FileText,
  MapPin, ArrowRight, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───

export interface CardService {
  name: string;
  price: string;
}

export interface AnimatedBusinessCardProps {
  name: string;
  initials?: string;
  business: string;
  location: string;
  tagline?: string;
  rating?: number;
  reviewCount?: number;
  services: CardService[];
  photoUrl?: string;
  flipEnabled?: boolean;
  cardUrl?: string;
  onCall?: () => void;
  onText?: () => void;
  onBook?: () => void;
  onEstimate?: () => void;
  className?: string;
}

// ─── Animation constants ───

const CARD_WRAPPER: Variants = {
  offscreen: { opacity: 0, y: 20 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const SERVICE_PARENT: Variants = {
  collapsed: {},
  expanded: { transition: { staggerChildren: 0.05 } },
};

const SERVICE_ITEM: Variants = {
  collapsed: { opacity: 0, y: 10 },
  expanded: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Sub-components ───

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}

function QuickContactForm({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      exit={{ rotateY: -90, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute inset-0 bg-card rounded-2xl border border-border p-5 flex flex-col z-10"
    >
      <p className="text-sm font-semibold text-foreground mb-1">Quick Contact</p>
      <p className="text-xs text-muted-foreground mb-3">
        Send a message or request a quote.
      </p>
      <div className="space-y-2.5 flex-1">
        <Input placeholder="Your name" className="h-9 text-sm" />
        <Input placeholder="Phone or email" className="h-9 text-sm" />
        <Textarea
          placeholder="What do you need help with?"
          className="text-sm min-h-[70px] resize-none"
        />
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onClose}>
          Back
        </Button>
        <motion.div className="flex-1" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            size="sm"
            className="w-full text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            <Send className="w-3 h-3 mr-1" /> Send
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───

export default function AnimatedBusinessCard({
  name,
  initials,
  business,
  location,
  tagline,
  rating = 5.0,
  reviewCount = 42,
  services,
  photoUrl,
  flipEnabled = false,
  cardUrl,
  onCall,
  onText,
  onBook,
  onEstimate,
  className = "",
}: AnimatedBusinessCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const displayInitials =
    initials ||
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <motion.div
      className={`relative w-full max-w-sm mx-auto ${className}`}
      variants={CARD_WRAPPER}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0.2 }}
      style={{ perspective: 800 }}
    >
      {/* Idle pulse — very subtle scale oscillation */}
      <motion.div
        animate={{ scale: [1, 1.015, 1] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.55, 0.95],
        }}
      >
        {/* Hover / tap wrapper */}
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => {
            setIsHovered(false);
            setShowContact(false);
          }}
          whileHover={{
            y: -12,
            scale: 1.04,
            boxShadow:
              "0 24px 56px -12px hsl(200 60% 10% / 0.22), 0 0 0 4px hsl(199 89% 48% / 0.18)",
          }}
          whileTap={{
            y: -6,
            scale: 1.02,
            boxShadow:
              "0 16px 40px -8px hsl(200 60% 10% / 0.18), 0 0 0 3px hsl(199 89% 48% / 0.15)",
          }}
          transition={{
            type: "spring" as const,
            stiffness: 300,
            damping: 20,
          }}
          className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm cursor-pointer"
        >
          {/* ── Cover band ── */}
          <div className="h-20 bg-gradient-to-r from-sky-500 to-cyan-500 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 50%, white 0%, transparent 60%)",
              }}
            />
          </div>

          {/* ── Profile ── */}
          <div className="px-5 -mt-8 relative z-10">
            <div className="flex items-end gap-3">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-16 h-16 rounded-xl object-cover ring-3 ring-card shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-xl shadow-md ring-3 ring-card">
                  {displayInitials}
                </div>
              )}
              <div className="pb-1 flex-1 min-w-0">
                <p className="font-bold text-foreground text-base leading-tight truncate">
                  {name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{business}</p>
              </div>
            </div>
          </div>

          {/* ── Details ── */}
          <div className="px-5 pt-3 pb-5 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" /> {location}
              </div>
              <StarRating rating={rating} count={reviewCount} />
            </div>

            {tagline && (
              <p className="text-sm text-muted-foreground italic leading-snug">
                "{tagline}"
              </p>
            )}

            {/* ── Action buttons ── */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Call", icon: Phone, onClick: onCall },
                { label: "Text", icon: MessageSquare, onClick: onText },
              ].map((btn) => (
                <motion.button
                  key={btn.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium py-2.5 shadow-sm hover:bg-sky-600 transition-colors"
                  onClick={btn.onClick}
                >
                  <btn.icon className="w-3.5 h-3.5" /> {btn.label}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold py-2.5 shadow-sm hover:bg-orange-600 transition-colors"
                onClick={onBook}
              >
                <Calendar className="w-3.5 h-3.5" /> Book Now
              </motion.button>
            </div>

            {/* ── Services (stagger on hover) ── */}
            <motion.div
              className="space-y-0"
              variants={SERVICE_PARENT}
              initial="collapsed"
              animate={isHovered ? "expanded" : "collapsed"}
            >
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Services
              </p>
              {services.map((s) => (
                <motion.div
                  key={s.name}
                  variants={SERVICE_ITEM}
                  className="flex justify-between items-center text-xs py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-foreground font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.price}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Get Free Estimate ── */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-orange-500 text-orange-600 text-xs font-semibold py-2.5 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
              onClick={flipEnabled ? () => setShowContact(true) : onEstimate}
            >
              <FileText className="w-3.5 h-3.5" /> Get Free Estimate
            </motion.button>

            {/* ── View Full Card link ── */}
            {cardUrl && (
              <motion.a
                href={cardUrl}
                className="group flex items-center justify-center gap-1 text-xs text-primary font-medium pt-1 hover:underline"
                whileHover={{ x: 3 }}
                transition={{ type: "spring" as const, stiffness: 400 }}
              >
                View Full Card
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </motion.a>
            )}
          </div>

          {/* ── Flip overlay: Quick Contact ── */}
          <AnimatePresence>
            {showContact && flipEnabled && (
              <QuickContactForm onClose={() => setShowContact(false)} />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Preset Demo Data ───

export const DEMO_CARDS: AnimatedBusinessCardProps[] = [
  {
    name: "Mike Reynolds",
    business: "Reynolds Construction LLC",
    location: "Toronto, ON",
    tagline: "Quality builds, honest pricing",
    rating: 5.0,
    reviewCount: 42,
    services: [
      { name: "Kitchen Remodel", price: "$15,000+" },
      { name: "Bathroom Renovation", price: "$8,000+" },
      { name: "Deck & Patio", price: "$5,500+" },
    ],
    cardUrl: "/demo/mike-reynolds",
  },
  {
    name: "Marcus Cole",
    business: "Cole's Classic Cuts",
    location: "Atlanta, GA",
    tagline: "Where style meets precision",
    rating: 4.9,
    reviewCount: 128,
    services: [
      { name: "Classic Cut", price: "$35" },
      { name: "Beard Trim", price: "$20" },
      { name: "Hot Towel Shave", price: "$30" },
    ],
    cardUrl: "/demo/marcus-cole",
  },
  {
    name: "Sarah Chen",
    business: "Chen Realty Group",
    location: "Vancouver, BC",
    tagline: "Your home, my expertise",
    rating: 5.0,
    reviewCount: 67,
    services: [
      { name: "Home Valuation", price: "Free" },
      { name: "Buyer Consultation", price: "Free" },
      { name: "Staging Service", price: "$1,200+" },
    ],
    cardUrl: "/demo/sarah-chen",
  },
  {
    name: "David Nguyen",
    business: "GreenScape Landscaping",
    location: "Austin, TX",
    tagline: "Transform your outdoor space",
    rating: 4.8,
    reviewCount: 55,
    services: [
      { name: "Lawn Care", price: "$150/mo" },
      { name: "Garden Design", price: "$2,500+" },
      { name: "Hardscaping", price: "$4,000+" },
    ],
    cardUrl: "/demo/david-nguyen",
  },
  {
    name: "Jessica Martinez",
    business: "FitLife Personal Training",
    location: "Miami, FL",
    tagline: "Your goals, my mission",
    rating: 5.0,
    reviewCount: 89,
    services: [
      { name: "1-on-1 Session", price: "$75" },
      { name: "Group Training", price: "$30/person" },
      { name: "Nutrition Plan", price: "$200" },
    ],
    cardUrl: "/demo/jessica-martinez",
  },
  {
    name: "Tanya Brooks",
    business: "Tanya B Hair Studio",
    location: "Chicago, IL",
    tagline: "Color. Cut. Confidence.",
    rating: 4.9,
    reviewCount: 103,
    services: [
      { name: "Cut & Style", price: "$65" },
      { name: "Full Color", price: "$120+" },
      { name: "Bridal Package", price: "$350" },
    ],
    cardUrl: "/demo/tanya-brooks",
  },
];
