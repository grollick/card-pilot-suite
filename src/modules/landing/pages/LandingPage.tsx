import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Smartphone,
  Calendar,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  Search,
  Star,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FooterSection from "@/modules/landing/components/FooterSection";
import InteractiveCardBuilder from "@/modules/landing/components/InteractiveCardBuilder";

/* ── animations ── */
const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/* ── data ── */
const problems = [
  { icon: Search, text: "Leads visit your page and leave without a trace" },
  { icon: Clock, text: "Hours lost on back-and-forth scheduling" },
  { icon: AlertTriangle, text: "Contacts scattered across notes and texts" },
];

const features = [
  {
    icon: Smartphone,
    title: "Smart Card",
    desc: "A digital business card that captures leads automatically with every tap and scan.",
  },
  {
    icon: Calendar,
    title: "Booking",
    desc: "Let customers book time with you directly — no phone tag required.",
  },
  {
    icon: FileText,
    title: "Estimates",
    desc: "Build professional quotes in minutes with built-in trade calculators.",
  },
  {
    icon: Users,
    title: "CRM",
    desc: "Track every lead, follow up on time, and never miss an opportunity.",
  },
];

const testimonials = [
  {
    name: "Jake M.",
    role: "Landscaper",
    text: "I went from losing half my leads to booking 90% of them. CardPilot paid for itself in a week.",
    rating: 5,
  },
  {
    name: "Sarah L.",
    role: "Interior Painter",
    text: "Clients love scanning my card and booking instantly. I've never been this organized.",
    rating: 5,
  },
  {
    name: "Marco R.",
    role: "Electrician",
    text: "Estimates used to take me an hour. Now I send them on-site in two minutes.",
    rating: 5,
  },
];

const trustStats = [
  { value: "2,000+", label: "Professionals" },
  { value: "50K+", label: "Leads captured" },
  { value: "4.9★", label: "Average rating" },
];

/* ── nav links ── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Example Card", href: "/card/demo" },
  { label: "Pricing", href: "#pricing" },
];

/* ── page ── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ─── */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight shrink-0">
            <span className="gradient-text">CardPilot</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) =>
              l.href.startsWith("#") ? (
                <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              )
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow">
                Create Your Card <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile: CTA + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow text-xs px-3">
                Create Card <ArrowRight className="h-3 w-3 ml-0.5" />
              </Button>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map((l) =>
                  l.href.startsWith("#") ? (
                    <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      {l.label}
                    </Link>
                  )
                )}
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Log in
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        </div>

        <div className="max-w-3xl mx-auto px-4 pt-24 pb-20 md:pt-36 md:pb-28 text-center">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fade}
            custom={0}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5"
          >
            One card to{" "}
            <span className="gradient-text">capture leads, book jobs, and grow.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fade}
            custom={1}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-10"
          >
            CardPilot replaces your paper card, booking app, estimate tool, and
            spreadsheet CRM — so you can focus on doing great work.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fade}
            custom={2}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                Create Your Card Free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/card/demo">
              <Button variant="outline" size="lg" className="text-base h-13 px-8 rounded-xl">
                <ExternalLink className="h-4 w-4 mr-1.5" /> View Example Card
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fade}
            custom={3}
            className="text-xs text-muted-foreground mt-5"
          >
            Free forever • No credit card • Setup in 2 min
          </motion.p>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={0}
            className="text-sm font-semibold text-destructive mb-3 uppercase tracking-wider"
          >
            Sound familiar?
          </motion.p>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={1}
            className="text-3xl md:text-4xl font-extrabold mb-10"
          >
            Running a service business shouldn't be this hard
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                custom={i + 2}
                className="rounded-2xl border border-destructive/10 bg-destructive/[0.03] p-5 text-center"
              >
                <div className="h-10 w-10 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
                  <p.icon className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOLUTION ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
              The fix
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Everything you need,{" "}
              <span className="gradient-text">one platform</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                custom={i}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-card-hover transition-shadow group"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMO CARD ─── */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={0}
            className="mb-10"
          >
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
              See it in action
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Try an example card
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              This is what your customers will see — a fast, professional card
              that books jobs and captures leads.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={1}
            className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden max-w-sm mx-auto"
          >
            {/* Mock card preview */}
            <div className="bg-primary/10 h-32 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg">Alex Johnson</h3>
                <p className="text-sm text-muted-foreground">Premium Landscaping</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border p-3 text-center">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">Book Now</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <FileText className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">Get Quote</p>
                </div>
              </div>
              <div className="space-y-2">
                {["Lawn Maintenance", "Garden Design", "Hardscaping"].map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={2}
            className="mt-8"
          >
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow rounded-xl">
                Build Yours Now <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── INTERACTIVE BUILDER ─── */}
      <InteractiveCardBuilder />

      {/* ─── SOCIAL PROOF ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              Trusted by service pros everywhere
            </h2>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {trustStats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold gradient-text">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                custom={i}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-primary/[0.03]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-primary/[0.06] blur-[120px]" />
        </div>

        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={0}
          >
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3 w-3" /> Ready to grow?
            </div>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={1}
            className="text-3xl md:text-4xl font-extrabold mb-5"
          >
            Your next customer is already looking for you
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={2}
            className="text-lg text-muted-foreground mb-10 max-w-md mx-auto"
          >
            Create your card in 2 minutes. Start capturing leads today — free
            forever.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                Create Your Card <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
