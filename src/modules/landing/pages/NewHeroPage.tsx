import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CreditCard, Star, Phone, MessageSquare, Calendar,
  FileText, QrCode, Zap, Shield, Users, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Fade-in on scroll observer ── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-6 transition-all duration-700 ease-out ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Phone mockup ── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[310px]">
      {/* Soft glow behind phone */}
      <div className="absolute -inset-8 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* iPhone frame */}
      <div className="relative rounded-[2.8rem] border-[6px] border-foreground/85 bg-foreground/85 shadow-2xl overflow-hidden">
        {/* Dynamic Island */}
        <div className="flex justify-center py-2 bg-foreground/85">
          <div className="w-[90px] h-[22px] bg-foreground rounded-full" />
        </div>

        {/* Card content */}
        <div className="px-4 pt-3 pb-4 space-y-3 bg-background">
          {/* Cover photo band */}
          <div className="relative -mx-4 -mt-3 h-16 bg-gradient-to-r from-sky-500 to-cyan-500" />

          {/* Profile */}
          <div className="flex items-center gap-3 -mt-5 relative z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-background">
              MR
            </div>
            <div className="pt-3">
              <p className="font-semibold text-foreground text-sm leading-tight">
                Mike Reynolds
              </p>
              <p className="text-[11px] text-muted-foreground">
                Reynolds Construction LLC
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  5.0 (42)
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-1">
                  <MapPin className="w-2.5 h-2.5" /> Toronto, ON
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button className="flex items-center justify-center gap-1 rounded-lg bg-sky-500 text-white text-[11px] font-medium py-2 shadow-sm">
              <Phone className="w-3 h-3" /> Call
            </button>
            <button className="flex items-center justify-center gap-1 rounded-lg bg-sky-500 text-white text-[11px] font-medium py-2 shadow-sm">
              <MessageSquare className="w-3 h-3" /> Text
            </button>
            <button className="flex items-center justify-center gap-1 rounded-lg bg-orange-500 text-white text-[11px] font-medium py-2 shadow-sm col-span-2">
              <Calendar className="w-3 h-3" /> Book Now
            </button>
          </div>

          {/* Services */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Services
            </p>
            {[
              { name: "Kitchen Remodel", price: "$15,000+" },
              { name: "Bathroom Renovation", price: "$8,000+" },
              { name: "Deck & Patio Build", price: "$5,500+" },
            ].map((s) => (
              <div
                key={s.name}
                className="flex justify-between items-center text-[11px] py-1 border-b border-border/50"
              >
                <span className="text-foreground">{s.name}</span>
                <span className="text-muted-foreground font-medium">
                  {s.price}
                </span>
              </div>
            ))}
          </div>

          {/* Get estimate CTA */}
          <button className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-orange-500 text-orange-600 text-[11px] font-semibold py-2">
            <FileText className="w-3 h-3" /> Get Free Estimate
          </button>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2 bg-background">
          <div className="w-28 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>

      {/* Floating "Shared via text" notification */}
      <div className="absolute -right-3 sm:-right-6 top-[38%] animate-fade-in bg-card rounded-xl shadow-lg border border-border px-3 py-2 flex items-center gap-2 text-xs">
        <MessageSquare className="w-4 h-4 text-sky-500 shrink-0" />
        <span className="text-foreground font-medium whitespace-nowrap">
          Shared via text ✓
        </span>
      </div>

      {/* Floating QR badge */}
      <div
        className="absolute -left-4 sm:-left-8 bottom-28 animate-fade-in bg-card rounded-xl shadow-lg border border-border p-2.5"
        style={{ animationDelay: "400ms" }}
      >
        <QrCode className="w-7 h-7 text-sky-500" />
      </div>
    </div>
  );
}

/* ── Page ── */
export default function NewHeroPage() {
  return (
    <>
      <Helmet>
        <title>
          Guzzl Pro — Turn Every Conversation Into a Customer
        </title>
        <meta
          name="description"
          content="The smart digital business card that captures leads, books jobs, sends estimates, and grows your local service business — all from one simple link."
        />
      </Helmet>

      {/* Variant label — remove after testing */}
      <div className="bg-foreground text-background text-[10px] text-center py-1 font-mono tracking-widest uppercase select-none">
        Hero Variant A — New Design (for A/B testing)
      </div>

      <section className="relative min-h-[calc(100dvh-24px)] flex items-center overflow-hidden bg-background">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-14 lg:gap-20 items-center">
            {/* ── Left: Copy ── */}
            <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
              <FadeIn>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-foreground">
                  Turn Every Conversation
                  <br className="hidden sm:block" /> Into a{" "}
                  <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">
                    Customer
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={120}>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  The smart digital business card that captures leads, books
                  jobs, sends estimates, and grows your local service
                  business —{" "}
                  <strong className="text-foreground">
                    all from one simple link.
                  </strong>
                </p>
              </FadeIn>

              <FadeIn delay={220}>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  No more lost contacts, endless texting, or slow estimates.
                  Share via QR, NFC, text, or social — and watch your leads
                  and bookings grow automatically.
                </p>
              </FadeIn>

              <FadeIn delay={320}>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 text-base px-8 h-12 rounded-xl font-semibold"
                  >
                    <Link to="/auth">Create My Free Card →</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 text-base px-8 h-12 rounded-xl font-semibold"
                  >
                    <Link to="/demo/mike-reynolds">See Live Demo Card</Link>
                  </Button>
                </div>
              </FadeIn>

              <FadeIn delay={420}>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-500" /> Free to
                    start
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-sky-500" /> No
                    credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sky-500" /> Secure
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-500" /> Trusted
                    by 1,000+ professionals
                  </span>
                </div>
              </FadeIn>
            </div>

            {/* ── Right: Phone mockup ── */}
            <FadeIn
              delay={200}
              className="flex justify-center lg:justify-end order-1 lg:order-2"
            >
              <PhoneMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      <InteractiveCardShowcase
        headline="See It In Action"
        subheadline="Hover, click, and flip — see how your digital card looks and feels."
        showThemePicker
        showProfessionFilter
      />
    </>
  );
}
