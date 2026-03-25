import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CreditCard, Star, Phone, MessageSquare, Calendar, FileText, QrCode, Zap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Fade-in on scroll observer ── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("opacity-100", "translate-y-0"); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useFadeIn();
  return (
    <div ref={ref} className={`opacity-0 translate-y-6 transition-all duration-700 ease-out ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Phone mockup card content ── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* iPhone frame */}
      <div className="rounded-[2.5rem] border-[6px] border-foreground/90 bg-background shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center pt-2 pb-1 bg-foreground/90">
          <div className="w-24 h-5 bg-foreground/90 rounded-b-2xl" />
        </div>

        {/* Card content */}
        <div className="px-4 py-4 space-y-3 bg-background">
          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-md">MR</div>
            <div>
              <p className="font-semibold text-foreground text-sm leading-tight">Mike Reynolds</p>
              <p className="text-[11px] text-muted-foreground">Reynolds Construction LLC</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                <span className="text-[10px] text-muted-foreground ml-1">5.0 (42)</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium py-2 shadow-sm"><Phone className="w-3.5 h-3.5" /> Call</button>
            <button className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium py-2 shadow-sm"><MessageSquare className="w-3.5 h-3.5" /> Text</button>
            <button className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium py-2 shadow-sm col-span-2"><Calendar className="w-3.5 h-3.5" /> Book Now</button>
          </div>

          {/* Services */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">Services</p>
            {[
              { name: "Kitchen Remodel", price: "From $8,500" },
              { name: "Bathroom Renovation", price: "From $4,200" },
              { name: "Deck & Patio", price: "From $3,000" },
            ].map((s) => (
              <div key={s.name} className="flex justify-between items-center text-[11px] py-1 border-b border-border/60">
                <span className="text-foreground">{s.name}</span>
                <span className="text-muted-foreground font-medium">{s.price}</span>
              </div>
            ))}
          </div>

          {/* Get estimate CTA */}
          <button className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-orange-500 text-orange-600 text-xs font-semibold py-2">
            <FileText className="w-3.5 h-3.5" /> Get Free Estimate
          </button>
        </div>

        {/* Bottom bar */}
        <div className="h-1.5 bg-foreground/90" />
      </div>

      {/* Floating notification */}
      <div className="absolute -right-4 top-1/3 animate-fade-in bg-card rounded-xl shadow-lg border border-border px-3 py-2 flex items-center gap-2 text-xs">
        <MessageSquare className="w-4 h-4 text-sky-500" />
        <span className="text-foreground font-medium">Shared via text ✓</span>
      </div>

      {/* Floating QR badge */}
      <div className="absolute -left-6 bottom-24 animate-fade-in bg-card rounded-xl shadow-lg border border-border p-2.5" style={{ animationDelay: "400ms" }}>
        <QrCode className="w-8 h-8 text-sky-500" />
      </div>
    </div>
  );
}

export default function NewHeroPage() {
  return (
    <>
      <Helmet>
        <title>Guzzl Pro — Turn Every Conversation Into a Customer</title>
        <meta name="description" content="The smart digital business card that captures leads, books jobs, sends estimates, and grows your local business — all in one tap." />
      </Helmet>

      {/* Variant label — remove after testing */}
      <div className="bg-foreground text-background text-[10px] text-center py-1 font-mono tracking-widest uppercase">
        Variant A — New Hero
      </div>

      <section className="relative min-h-[calc(100dvh-24px)] flex items-center overflow-hidden bg-background">
        {/* Subtle background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* ── Left: Copy ── */}
            <div className="space-y-6 text-center lg:text-left">
              <FadeIn>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight text-foreground">
                  Turn Every Conversation Into a{" "}
                  <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">Customer</span>
                </h1>
              </FadeIn>

              <FadeIn delay={100}>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  The smart digital business card that captures leads, books jobs, sends estimates, and grows your local business — <strong className="text-foreground">all in one tap.</strong>
                </p>
              </FadeIn>

              <FadeIn delay={200}>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto lg:mx-0">
                  No more lost contacts or missed follow-ups. Create once, share anywhere (QR, NFC, link, text), and watch your leads and bookings grow automatically.
                </p>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 text-base px-8 h-12 rounded-xl">
                    <Link to="/auth">Create My Free Card →</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-2 text-base px-8 h-12 rounded-xl">
                    <Link to="/demo/mike-reynolds">See Live Demo Card</Link>
                  </Button>
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-sky-500" /> Free to start</span>
                  <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-sky-500" /> No credit card required</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-sky-500" /> Trusted by 1,000+ service pros</span>
                </div>
              </FadeIn>
            </div>

            {/* ── Right: Phone mockup ── */}
            <FadeIn delay={200} className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
