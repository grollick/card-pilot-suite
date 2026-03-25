import { useRef, useState, useCallback } from "react";
import {
  motion, useMotionValue, useSpring, useTransform,
  type Variants,
} from "framer-motion";
import {
  Star, Phone, MessageSquare, Calendar, FileText,
  MapPin, ArrowRight, Send, RotateCcw, User, Download,
  CalendarDays,
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

/** ── Front side of the card ── */
function CardFront({
  name,
  displayInitials,
  business,
  location,
  tagline,
  rating,
  reviewCount,
  services,
  photoUrl,
  cardUrl,
  isHovered,
  onCall,
  onText,
  onBook,
  onFlip,
}: {
  name: string;
  displayInitials: string;
  business: string;
  location: string;
  tagline?: string;
  rating: number;
  reviewCount: number;
  services: CardService[];
  photoUrl?: string;
  cardUrl?: string;
  isHovered: boolean;
  onCall?: () => void;
  onText?: () => void;
  onBook?: () => void;
  onFlip: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm w-full"
      style={{ backfaceVisibility: "hidden" }}
    >
      {/* Cover band */}
      <div className="h-20 bg-gradient-to-r from-sky-500 to-cyan-500 relative">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, white 0%, transparent 60%)",
          }}
        />
        {/* Flip hint */}
        <button
          onClick={(e) => { e.stopPropagation(); onFlip(); }}
          className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          title="Flip card"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Profile */}
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

      {/* Details */}
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

        {/* Action buttons */}
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
              onClick={(e) => { e.stopPropagation(); btn.onClick?.(); }}
            >
              <btn.icon className="w-3.5 h-3.5" /> {btn.label}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold py-2.5 shadow-sm hover:bg-orange-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onBook?.(); }}
          >
            <Calendar className="w-3.5 h-3.5" /> Book Now
          </motion.button>
        </div>

        {/* Services (stagger on hover) */}
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

        {/* Get Free Estimate */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-orange-500 text-orange-600 text-xs font-semibold py-2.5 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onFlip(); }}
        >
          <FileText className="w-3.5 h-3.5" /> Get Free Estimate
        </motion.button>

        {/* View Full Card */}
        {cardUrl && (
          <motion.a
            href={cardUrl}
            className="group flex items-center justify-center gap-1 text-xs text-primary font-medium pt-1 hover:underline"
            whileHover={{ x: 3 }}
            transition={{ type: "spring" as const, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            View Full Card
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </motion.a>
        )}
      </div>
    </div>
  );
}

/** ── Back side of the card ── */
function CardBack({
  name,
  displayInitials,
  business,
  cardUrl,
  onFlip,
}: {
  name: string;
  displayInitials: string;
  business: string;
  cardUrl?: string;
  onFlip: () => void;
}) {
  return (
    <div
      className="absolute inset-0 rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col"
      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
    >
      {/* Header band */}
      <div className="h-14 bg-gradient-to-r from-sky-600 to-cyan-500 relative flex items-center px-5 gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
          {displayInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{name}</p>
          <p className="text-white/70 text-[10px] truncate">{business}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFlip(); }}
          className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          title="Flip back"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Book form */}
      <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
        <p className="text-sm font-semibold text-foreground">Quick Book</p>
        <p className="text-xs text-muted-foreground -mt-1">
          Send a message or request a free estimate.
        </p>

        <Input placeholder="Your name" className="h-9 text-sm" onClick={(e) => e.stopPropagation()} />
        <Input placeholder="Phone or email" className="h-9 text-sm" onClick={(e) => e.stopPropagation()} />
        <div className="relative">
          <CalendarDays className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input placeholder="Preferred date" className="h-9 text-sm pl-9" onClick={(e) => e.stopPropagation()} />
        </div>
        <Textarea
          placeholder="What do you need help with?"
          className="text-sm min-h-[60px] resize-none"
          onClick={(e) => e.stopPropagation()}
        />

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            <Send className="w-3 h-3 mr-1.5" /> Send Message
          </Button>
        </motion.div>

        {/* Quick action row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {cardUrl && (
            <motion.a
              href={cardUrl}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium py-2 text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-3 h-3" /> View Profile
            </motion.a>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium py-2 text-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-3 h-3" /> Save Contact
          </motion.button>
        </div>
      </div>

      {/* Flip hint */}
      <div className="px-5 py-2.5 border-t border-border">
        <p className="text-[10px] text-center text-muted-foreground">
          Click card or ↻ to flip back
        </p>
      </div>
    </div>
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
  flipEnabled = true,
  cardUrl,
  onCall,
  onText,
  onBook,
  onEstimate,
  className = "",
}: AnimatedBusinessCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── 3D tilt motion values ──
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isFlipped) return; // disable tilt while flipped
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mouseX, mouseY, isFlipped]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const toggleFlip = useCallback(() => {
    if (flipEnabled) {
      setIsFlipped((prev) => !prev);
      // Reset tilt when flipping
      mouseX.set(0);
      mouseY.set(0);
    }
  }, [flipEnabled, mouseX, mouseY]);

  const displayInitials =
    initials ||
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div
      className={`relative w-full max-w-sm mx-auto ${className}`}
      variants={CARD_WRAPPER}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0.2 }}
      style={{ perspective: 1000 }}
    >
      {/* Idle pulse */}
      <motion.div
        animate={{ scale: [1, 1.015, 1] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.55, 0.95],
        }}
      >
        {/* 3D tilt + hover + flip wrapper */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onHoverStart={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          onClick={toggleFlip}
          animate={{
            rotateY: isFlipped ? 180 : 0,
          }}
          style={{
            rotateX: tiltX,
            rotateY: isFlipped ? 180 : tiltY,
            transformStyle: "preserve-3d",
          }}
          whileHover={
            isFlipped
              ? undefined
              : {
                  y: -12,
                  scale: 1.04,
                  boxShadow:
                    "0 24px 56px -12px hsl(200 60% 10% / 0.22), 0 0 0 4px hsl(199 89% 48% / 0.18)",
                }
          }
          whileTap={{
            y: -6,
            scale: 1.02,
            boxShadow:
              "0 16px 40px -8px hsl(200 60% 10% / 0.18), 0 0 0 3px hsl(199 89% 48% / 0.15)",
          }}
          transition={{
            rotateY: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
            y: { type: "spring" as const, stiffness: 300, damping: 20 },
            scale: { type: "spring" as const, stiffness: 300, damping: 20 },
            boxShadow: { duration: 0.3 },
          }}
          className="relative cursor-pointer will-change-transform"
        >
          {/* ── Front ── */}
          <CardFront
            name={name}
            displayInitials={displayInitials}
            business={business}
            location={location}
            tagline={tagline}
            rating={rating}
            reviewCount={reviewCount}
            services={services}
            photoUrl={photoUrl}
            cardUrl={cardUrl}
            isHovered={isHovered && !isFlipped}
            onCall={onCall}
            onText={onText}
            onBook={onBook}
            onFlip={toggleFlip}
          />

          {/* ── Back ── */}
          <CardBack
            name={name}
            displayInitials={displayInitials}
            business={business}
            cardUrl={cardUrl}
            onFlip={toggleFlip}
          />
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
