import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FooterSection from "@/modules/landing/components/FooterSection";
import HeroPhoneAnimation from "@/modules/landing/components/HeroPhoneAnimation";
import { DEMO_CARDS } from "@/lib/demoCards";

/* ── animations ── */
const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
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
  { icon: Smartphone, title: "Digital Business Card", desc: "A professional, mobile-first card with your services, portfolio, reviews, and booking — all in one link.", tag: "Core" },
  { icon: FileText, title: "Estimates & Invoices", desc: "Create, send, and track professional estimates and invoices. Get paid faster with online payments.", tag: "Revenue" },
  { icon: Megaphone, title: "Social Marketing", desc: "AI-powered social posts, automated campaigns, and content scheduling to keep your business visible.", tag: "Growth" },
  { icon: Bot, title: "CRM & Automation", desc: "Track every lead, automate follow-ups, and manage your pipeline — all on autopilot.", tag: "Automation" },
];

const steps = [
  { num: "1", icon: Smartphone, title: "Create Your Card", desc: "Build a professional digital card with your services, portfolio, and booking link in under 2 minutes." },
  { num: "2", icon: Share2, title: "Share Everywhere", desc: "Share via QR code, NFC tap, text, social media, or email signature — reach customers anywhere." },
  { num: "3", icon: UserPlus, title: "Capture & Convert", desc: "Every visitor's info is captured automatically. They can book you, request an estimate, or call — instantly." },
  { num: "4", icon: TrendingUp, title: "Grow Your Business", desc: "Track results, automate follow-ups, and watch your leads, bookings, and revenue grow." },
];

const results = [
  { value: "3×", label: "More Leads", desc: "Professionals using guzzl.pro capture 3x more leads than traditional business cards.", icon: Target },
  { value: "40%", label: "More Bookings", desc: "Online booking eliminates friction and converts more inquiries into confirmed jobs.", icon: Calendar },
  { value: "2×", label: "Faster Payments", desc: "Digital estimates and invoices with online payment get you paid twice as fast.", icon: DollarSign },
];

const PROFESSION_ICONS: Record<string, typeof Wrench> = {
  Contractor: Wrench,
  Barber: Scissors,
  Realtor: Home,
  Photographer: Camera,
  Landscaper: TreePine,
};

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

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Examples", href: "#examples" },
  { label: "Pricing", href: "#pricing" },
];

/* ────────────────────────────── PAGE ────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── NAV ─── */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight shrink-0">
            <span className="text-primary font-extrabold">guzzl</span><span className="text-foreground">.pro</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/onboarding">
              <Button size="sm">Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-24 md:pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <motion.div initial="hidden" animate="visible" variants={fade} custom={0} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold mb-6">
                <Zap className="h-3 w-3" /> The all-in-one platform for service professionals
              </motion.div>
              <motion.h1 initial="hidden" animate="visible" variants={fade} custom={1} className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] mb-6">
                Turn your business card into a{" "}
                <span className="gradient-text">customer-generating machine</span>
              </motion.h1>
              <motion.p initial="hidden" animate="visible" variants={fade} custom={2} className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                Capture leads, send estimates, get paid, and grow your business — all from one platform.
              </motion.p>
              <motion.div initial="hidden" animate="visible" variants={fade} custom={3} className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
                <Link to="/onboarding">
                  <Button size="lg" className="text-base h-12 px-8 rounded-xl shadow-glow">
                    Get Started Free <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <a href="#examples">
                  <Button variant="outline" size="lg" className="text-base h-12 px-6 rounded-xl">
                    <ExternalLink className="h-4 w-4 mr-1.5" /> View Demo
                  </Button>
                </a>
              </motion.div>
              <motion.p initial="hidden" animate="visible" variants={fade} custom={4} className="text-xs text-muted-foreground mt-6 flex items-center justify-center lg:justify-start gap-4">
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> Free forever</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> No credit card</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> 2 min setup</span>
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="flex-shrink-0"
            >
              <HeroPhoneAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 2. PROBLEM / SOLUTION ─── */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">The Problem</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Sound familiar?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Most service professionals lose leads every day because they don't have the right tools.</p>
          </motion.div>

          {/* Problems */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {problems.map((p, i) => (
              <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card p-6 text-center hover:shadow-card-hover transition-all">
                <div className="h-11 w-11 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5 text-sm">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Arrow transition */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">guzzl.pro solves all of this — in one platform.</span>
            </div>
          </motion.div>

          {/* Solutions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {solutions.map((s, i) => (
              <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card p-6 flex gap-4 hover:shadow-card-hover hover:border-primary/15 transition-all">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. FEATURES ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Features</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Everything you need to <span className="gradient-text">grow your business</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Powerful tools designed for service professionals. Focus on your work — we handle the rest.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="group rounded-2xl border border-border bg-card p-8 hover:shadow-elevated hover:border-primary/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
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
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS ─── */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Four steps to more customers</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="text-center">
                <div className="relative mx-auto mb-5">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                    {s.num}
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. DEMO CARDS ─── */}
      <section id="examples" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Example Cards</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Cards for every profession</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">See how professionals in different industries use guzzl.pro to grow their business.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {DEMO_CARDS.map((card, i) => {
              const Icon = PROFESSION_ICONS[card.profession] ?? Wrench;
              return (
                <motion.div key={card.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group">
                  <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${card.accentColor}12, ${card.accentColor}06)` }}>
                    <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{card.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.profession}</p>
                    <p className="text-2xs text-muted-foreground mt-1">{card.city}</p>
                  </div>
                  <div className="p-4 space-y-1.5">
                    {card.services.slice(0, 3).map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0 ml-2">{s.price}</span>
                      </div>
                    ))}
                    {card.services.length > 3 && (
                      <p className="text-2xs text-muted-foreground">+{card.services.length - 3} more services</p>
                    )}
                    <div className="flex gap-0.5 pt-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 fill-warning text-warning" />
                      ))}
                      <span className="text-2xs text-muted-foreground ml-1">({card.testimonials.length})</span>
                    </div>
                    <div className="pt-2">
                      <Link to={`/demo/${card.slug}`}>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          View Card <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. RESULTS ─── */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Results</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Real outcomes for real businesses</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">CardPilot helps service professionals get more leads, more bookings, and faster payments.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.map((r, i) => (
              <motion.div key={r.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card p-8 text-center hover:shadow-card-hover transition-all">
                <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <r.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-5xl font-extrabold gradient-text mb-2">{r.value}</p>
                <p className="text-lg font-bold text-foreground mb-2">{r.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Testimonials inline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-12">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card p-6">
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
          </div>
        </div>
      </section>

      {/* ─── 7. PRICING ─── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Start free. Upgrade when you're ready to grow. One new job pays for your entire month.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                custom={i}
                className={`rounded-2xl border p-7 flex flex-col transition-all ${
                  p.highlighted
                    ? "border-primary/40 bg-card shadow-elevated relative scale-[1.02]"
                    : "border-border bg-card hover:shadow-card-hover"
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">{p.price}</span>
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
                    className={`w-full rounded-xl ${p.highlighted ? "shadow-glow" : ""}`}
                    variant={p.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {p.cta}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={3} className="text-center text-xs text-muted-foreground mt-8">
            No credit card required • Cancel anytime • 14-day free trial on paid plans
          </motion.p>
        </div>
      </section>

      {/* ─── 8. FINAL CTA ─── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-primary/[0.03]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.05] blur-[120px]" />
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3 w-3" /> Ready to grow your business?
            </div>
          </motion.div>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1} className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5">
            Start getting more customers today
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={2} className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Create your smart business card in 2 minutes. Start capturing leads today — free forever.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/onboarding">
              <Button size="lg" className="text-base h-12 px-10 rounded-xl shadow-glow">
                Get Started Free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <a href="#examples">
              <Button variant="outline" size="lg" className="text-base h-12 px-6 rounded-xl">
                View Demo
              </Button>
            </a>
          </motion.div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={4} className="text-xs text-muted-foreground mt-6">
            Free forever • No credit card • Setup in 2 minutes
          </motion.p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <FooterSection />
    </div>
  );
}
