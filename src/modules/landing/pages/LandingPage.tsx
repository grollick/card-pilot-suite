import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useABTest } from "@/hooks/useABTest";
import { Link, useSearchParams } from "react-router-dom";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Smartphone,
  Calendar,
  FileText,
  Users,
  Star,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  Share2,
  UserPlus,
  Check,
  AlertTriangle,
  Clock,
  BarChart3,
  Camera,
  Scissors,
  Home,
  Wrench,
  TreePine,
  Zap,
  TrendingUp,
  DollarSign,
  Target,
  Megaphone,
  Bot,
  Shield,
  CreditCard,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FooterSection from "@/modules/landing/components/FooterSection";
import HeroPhoneAnimation from "@/modules/landing/components/HeroPhoneAnimation";
import MarketplaceSection from "@/modules/landing/components/MarketplaceSection";
import { DEMO_CARDS } from "@/lib/demoCards";
import InteractiveCardShowcase from "@/components/InteractiveCardShowcase";
import SuccessStoryBanner from "@/components/SuccessStoryBanner";
import DemoCardsSection from "@/modules/landing/components/DemoCardsSection";

/* ── animations ── */
const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ── data ── */
const problems = [
  { icon: AlertTriangle, title: "Missed Leads", desc: "Potential customers visit your page but have no easy way to reach you or book your services." },
  { icon: Calendar, title: "No Simple Booking", desc: "Back-and-forth texting to schedule jobs wastes hours of your time every week." },
  { icon: Users, title: "Scattered Contacts", desc: "Leads live in texts, emails, and scraps of paper — nothing is organized or tracked." },
  { icon: Clock, title: "Slow Estimates", desc: "Creating and sending estimates takes too long, and you lose jobs to faster competitors." },
];

const solutions = [
  { icon: Smartphone, title: "One smart link for everything", desc: "Your digital card showcases your work, services, and reviews — all shareable via QR, NFC, or link." },
  { icon: UserPlus, title: "Auto-capture every lead", desc: "Every visitor's info is captured automatically. No more lost contacts or missed opportunities." },
  { icon: Calendar, title: "Instant online booking", desc: "Customers book directly from your card. No calls, no texts, no back-and-forth." },
  { icon: FileText, title: "Send estimates in minutes", desc: "Create professional estimates on-site and send them before you leave the job." },
];

const features = [
  { icon: Smartphone, title: "Digital Business Card", desc: "A professional, mobile-first card with your services, portfolio, reviews, and booking — all in one link.", tag: "Core", gradient: "from-blue-500/10 to-indigo-500/10" },
  { icon: FileText, title: "Estimates & Invoices", desc: "Create, send, and track professional estimates and invoices. Get paid faster with online payments.", tag: "Revenue", gradient: "from-emerald-500/10 to-teal-500/10" },
  { icon: Megaphone, title: "Social Marketing", desc: "AI-powered social posts, automated campaigns, and content scheduling to keep your business visible.", tag: "Growth", gradient: "from-orange-500/10 to-amber-500/10" },
  { icon: Bot, title: "CRM & Automation", desc: "Track every lead, automate follow-ups, and manage your pipeline — all on autopilot.", tag: "Automation", gradient: "from-violet-500/10 to-purple-500/10" },
];

const steps = [
  { num: "1", icon: Smartphone, title: "Create Your Card", desc: "Build a professional digital card with your services, portfolio, and booking link in under 2 minutes." },
  { num: "2", icon: Globe, title: "Get Discovered Locally", desc: "Share your card via QR code, NFC, text, or social media — customers find you everywhere." },
  { num: "3", icon: TrendingUp, title: "Turn Visitors Into Customers", desc: "Capture leads, book jobs, send estimates, and grow your revenue — automatically." },
];

const results = [
  { value: "3×", label: "More Leads", desc: "Professionals using guzzl.pro capture 3x more leads than traditional business cards.", icon: Target },
  { value: "40%", label: "More Bookings", desc: "Online booking eliminates friction and converts more inquiries into confirmed jobs.", icon: Calendar },
  { value: "2×", label: "Faster Payments", desc: "Digital estimates and invoices with online payment get you paid twice as fast.", icon: DollarSign },
];


const testimonials = [
  { name: "Jake M.", role: "Landscaper", text: "I went from losing half my leads to booking 90% of them. guzzl.pro paid for itself in a week.", rating: 5 },
  { name: "Sarah L.", role: "Interior Painter", text: "Clients love scanning my card and booking instantly. I've never been this organized.", rating: 5 },
  { name: "Marco R.", role: "Electrician", text: "Estimates used to take me an hour. Now I send them on-site in two minutes.", rating: 5 },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Everything you need to get started",
    features: ["1 Smart Digital Card", "QR & link sharing", "Basic CRM (20 contacts)", "5 Leads per month", "Lead capture form", "Business card scanner"],
    highlighted: false,
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "Everything you need to grow",
    features: ["Unlimited cards & contacts", "Online booking system", "Estimates & invoices", "Full CRM & pipeline", "Autopilot follow-ups", "Remove branding", "Priority support"],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Pro Plus",
    price: "$79",
    period: "/month",
    desc: "For power users & teams",
    features: ["Everything in Pro", "Team members", "Advanced analytics", "AI marketing autopilot", "Custom domain", "API access", "Dedicated support"],
    highlighted: false,
    cta: "Start Free Trial",
  },
];

const TRUST_ITEMS = [
  "Contractors", "Plumbers", "Electricians", "Landscapers", "Painters", "Roofers",
  "HVAC Pros", "Photographers", "Barbers", "Realtors", "Personal Trainers", "Cleaners",
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Examples", href: "#examples" },
  { label: "Pricing", href: "#pricing" },
];

/* ────────────────────────────── PAGE ────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const { variant: abVariant, trackClick: abTrackClick, hasTest: hasABTest } = useABTest("hero");

  // ── Profession-based dynamic headlines ──
  const [searchParams] = useSearchParams();
  const professionParam = searchParams.get("profession")?.toLowerCase().trim() || "";

  const professionHeadlines: Record<string, { main: string; accent: string }> = useMemo(() => ({
    contractor: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    trades: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    plumber: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    electrician: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    hvac: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    roofer: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    painter: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    landscaper: { main: "Get More Local Jobs —", accent: "Without Chasing Leads" },
    realtor: { main: "Get More Clients and Book More Showings —", accent: "All From One Smart Card" },
    "real estate": { main: "Get More Clients and Book More Showings —", accent: "All From One Smart Card" },
    barber: { main: "Fill Your Schedule —", accent: "Get More Repeat Clients" },
    salon: { main: "Fill Your Schedule —", accent: "Get More Repeat Clients" },
    hairstylist: { main: "Fill Your Schedule —", accent: "Get More Repeat Clients" },
    photographer: { main: "Book More Shoots —", accent: "All From One Simple Card" },
    cleaner: { main: "Get More Cleaning Jobs —", accent: "Without Cold Calling" },
    trainer: { main: "Fill Your Client Roster —", accent: "Without Chasing Leads" },
    "personal trainer": { main: "Fill Your Client Roster —", accent: "Without Chasing Leads" },
  }), []);

  const defaultHeadline = { main: "Get More Local Customers —", accent: "All From One Simple Business Card" };

  // Priority: A/B test > profession param > default
  const heroHeadlineAccent = useMemo(() => {
    if (abVariant?.headline) {
      const parts = abVariant.headline.split(" — ");
      return parts.length > 1 ? { main: parts[0] + " —", accent: parts[1] } : { main: abVariant.headline, accent: "" };
    }
    if (professionParam && professionHeadlines[professionParam]) {
      return professionHeadlines[professionParam];
    }
    return defaultHeadline;
  }, [abVariant, professionParam, professionHeadlines]);

  const heroSubheadline = abVariant?.subheadline || "Create a premium business card that captures leads, books jobs, and manages your customers — all in one place.";
  const heroCta = abVariant?.cta_text || "Start Free";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="border-b border-border/40 bg-background/70 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <GuzzlLogo size="lg" />
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow">Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Link to="/onboarding">
              <Button size="sm" className="text-xs px-3">Get Started <ArrowRight className="h-3 w-3 ml-0.5" /></Button>
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Toggle menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-t border-border/40">
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map((l) => (
                  <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">{l.label}</a>
                ))}
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Log in</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── 1. HERO ─── */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="orb-primary w-[700px] h-[500px] top-[-100px] left-[10%]" />
          <div className="orb-accent w-[500px] h-[400px] top-[50px] right-[-5%]" />
          <div className="orb-primary w-[300px] h-[300px] bottom-[-50px] left-[40%] opacity-50" />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-28 md:pb-24">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 text-center lg:text-left max-w-2xl">
                <motion.div initial="hidden" animate="visible" variants={fade} custom={0} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold mb-6">
                  <Zap className="h-3 w-3" /> The all-in-one platform for service professionals
                </motion.div>
                <motion.h1 initial="hidden" animate="visible" variants={fade} custom={1} className="text-display text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] mb-6">
                  {heroHeadlineAccent.main}{" "}
                  {heroHeadlineAccent.accent && (
                    <motion.span
                      className="gradient-text inline-block origin-center"
                      initial={{ scale: 1.15, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
                    >{heroHeadlineAccent.accent}</motion.span>
                  )}
                </motion.h1>
                <motion.p initial="hidden" animate="visible" variants={fade} custom={2} className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  {heroSubheadline}
                </motion.p>
                <motion.div initial="hidden" animate="visible" variants={fade} custom={3} className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
                  <Link to="/onboarding" onClick={() => abTrackClick()}>
                    <Button size="lg" className="text-base h-13 px-10 rounded-xl shadow-glow-lg group">
                      {heroCta}
                      <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                  <a href="#examples">
                    <Button variant="outline" size="lg" className="text-base h-13 px-6 rounded-xl">
                      <ExternalLink className="h-4 w-4 mr-1.5" /> View Demo
                    </Button>
                  </a>
                </motion.div>
                <motion.div initial="hidden" animate="visible" variants={fade} custom={4} className="flex items-center justify-center lg:justify-start gap-5 mt-8">
                  {[
                    { icon: Check, label: "Free to start" },
                    { icon: CreditCard, label: "No credit card required" },
                    { icon: Shield, label: "Secure platform" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-success" /> {label}
                    </span>
                  ))}
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 relative"
              >
                {/* Phone glow ring */}
                <div className="absolute -inset-8 rounded-[3rem] bg-primary/5 blur-2xl -z-10" />
                <HeroPhoneAnimation />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ─── TRUST BAR ─── */}
        <div className="relative py-8 border-t border-border/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
              Trusted by 1,000+ professionals across every trade
            </p>
            <div className="overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
              <div className="flex animate-marquee gap-8 w-max">
                {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
                  <span key={`${item}-${i}`} className="text-sm font-medium text-muted-foreground/60 whitespace-nowrap flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ─── 2. PROBLEM / SOLUTION ─── */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 -z-10 gradient-mesh" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">The Problem</p>
            <h2 className="text-display text-3xl md:text-4xl lg:text-5xl mb-4">Sound familiar?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">Most service professionals lose leads every day because they don't have the right tools.</p>
          </motion.div>

          {/* Problems */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {problems.map((p) => (
              <motion.div key={p.title} variants={scaleIn} className="landing-card rounded-2xl p-6 text-center">
                <div className="h-12 w-12 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5 text-sm">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Arrow transition */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/20 bg-primary/5 shadow-glow">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">guzzl.pro solves all of this — in one platform.</span>
            </div>
          </motion.div>

          {/* Solutions */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {solutions.map((s) => (
              <motion.div key={s.title} variants={scaleIn} className="landing-card rounded-2xl p-6 flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ─── 3. FEATURES ─── */}
      <section id="features" className="py-20 md:py-28 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Why Guzzl</p>
            <h2 className="text-display text-3xl md:text-4xl lg:text-5xl mb-4">
              Everything you need to <span className="gradient-text">grow your business</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">Powerful tools designed for service professionals. Focus on your work — we handle the rest.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <motion.div key={f.title} variants={scaleIn} className="group landing-card rounded-2xl p-8 relative overflow-hidden">
                {/* Subtle gradient bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                      <span className="text-2xs font-semibold uppercase tracking-wider text-primary bg-primary/8 px-2 py-0.5 rounded-full">{f.tag}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS ─── */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 -z-10 gradient-mesh" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">How it works</p>
            <h2 className="text-display text-3xl md:text-4xl lg:text-5xl">Three steps to more customers</h2>
          </motion.div>
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-[52px] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {steps.map((s) => (
                <motion.div key={s.title} variants={scaleIn} className="text-center">
                  <div className="relative mx-auto mb-5">
                    <div className="h-[68px] w-[68px] mx-auto rounded-2xl bg-card border border-border shadow-card flex items-center justify-center group-hover:shadow-elevated transition-all">
                      <s.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-glow">
                      {s.num}
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ─── 5. DEMO CARDS ─── */}
      <DemoCardsSection />


      {/* ─── 6. RESULTS ─── */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 -z-10 gradient-mesh" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Results</p>
            <h2 className="text-display text-3xl md:text-4xl lg:text-5xl mb-4">Real outcomes for real businesses</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">guzzl.pro helps service professionals get more leads, more bookings, and faster payments.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.map((r) => (
              <motion.div key={r.label} variants={scaleIn} className="landing-card rounded-2xl p-8 text-center">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <r.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-6xl font-extrabold gradient-text mb-2 tracking-tighter">{r.value}</p>
                <p className="text-lg font-bold text-foreground mb-2">{r.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials inline */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-12">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={scaleIn} className="landing-card rounded-2xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 text-foreground">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SUCCESS STORIES ─── */}
      <section className="py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SuccessStoryBanner location="landing" />
        </div>
      </section>

      <div className="glow-line" />

      {/* ─── 7. PRICING ─── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Pricing</p>
            <h2 className="text-display text-3xl md:text-4xl lg:text-5xl mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-lg">Start free. Upgrade when you're ready to grow. One new job pays for your entire month.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p) => (
              <motion.div
                key={p.name}
                variants={scaleIn}
                className={`rounded-2xl border p-7 flex flex-col transition-all duration-300 ${
                  p.highlighted
                    ? "border-primary/40 bg-card shadow-glow-lg relative scale-[1.03]"
                    : "border-border bg-card landing-card"
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-glow">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-foreground tracking-tight">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/onboarding" className="block">
                  <Button
                    className={`w-full rounded-xl group ${p.highlighted ? "shadow-glow" : ""}`}
                    variant={p.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {p.cta}
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={3} className="text-center text-xs text-muted-foreground mt-8">
            No credit card required • Cancel anytime • 14-day free trial on paid plans
          </motion.p>
        </div>
      </section>

      {/* ─── 8. FINAL CTA ─── */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="orb-primary w-[800px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="orb-accent w-[400px] h-[300px] bottom-0 right-[10%]" />
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3 w-3" /> Ready to grow your business?
            </div>
          </motion.div>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1} className="text-display text-3xl md:text-4xl lg:text-5xl mb-5">
            Start getting more customers today
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={2} className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Create your smart business card in 2 minutes. Start capturing leads today — free forever.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/onboarding">
              <Button size="lg" className="text-base h-13 px-10 rounded-xl shadow-glow-lg group">
                Get Started Free <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <a href="#examples">
              <Button variant="outline" size="lg" className="text-base h-13 px-6 rounded-xl">
                View Demo
              </Button>
            </a>
          </motion.div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={4} className="text-xs text-muted-foreground mt-6">
            Free forever • No credit card • Setup in 2 minutes
          </motion.p>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={5} className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70 mt-4">
            <Shield className="h-3 w-3" /> Trusted and secure platform for local businesses
          </motion.p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <FooterSection />
    </div>
  );
}
