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
  Briefcase,
  Check,
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
const steps = [
  { icon: Smartphone, title: "Create Card", desc: "Build your smart card in 30 seconds" },
  { icon: Share2, title: "Share Link", desc: "Send via QR, NFC, text, or social" },
  { icon: UserPlus, title: "Get Leads", desc: "Auto-capture every visitor's info" },
  { icon: Briefcase, title: "Book Jobs", desc: "Customers book & pay directly" },
];

const features = [
  {
    icon: Smartphone,
    title: "Smart Card",
    desc: "A tap-and-scan digital card that turns every interaction into a lead.",
    bullets: ["Auto-captures visitor contact info", "Works with NFC, QR codes & links", "Tracks views, taps & conversions"],
  },
  {
    icon: Calendar,
    title: "Booking",
    desc: "Let customers self-book — no back-and-forth required.",
    bullets: ["Customizable availability rules", "Automated confirmations & reminders", "Syncs directly into your CRM"],
  },
  {
    icon: FileText,
    title: "Estimates",
    desc: "Send professional quotes on-site in minutes, not hours.",
    bullets: ["Built-in trade calculators", "One-tap approve & digital signatures", "Auto-converts to jobs when accepted"],
  },
  {
    icon: Users,
    title: "CRM",
    desc: "Track every lead and never miss a follow-up again.",
    bullets: ["Visual pipeline & deal stages", "Automated follow-up sequences", "Full activity timeline per contact"],
  },
];

const testimonials = [
  { name: "Jake M.", role: "Landscaper", text: "I went from losing half my leads to booking 90% of them. CardPilot paid for itself in a week.", rating: 5 },
  { name: "Sarah L.", role: "Interior Painter", text: "Clients love scanning my card and booking instantly. I've never been this organized.", rating: 5 },
  { name: "Marco R.", role: "Electrician", text: "Estimates used to take me an hour. Now I send them on-site in two minutes.", rating: 5 },
];

const trustStats = [
  { value: "2,000+", label: "Professionals" },
  { value: "50K+", label: "Leads captured" },
  { value: "4.9★", label: "Average rating" },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Get started with the basics",
    features: ["1 Smart Card", "QR & Link sharing", "Basic CRM", "5 Leads/month"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    desc: "Everything you need to grow",
    features: ["Unlimited cards", "Booking & Estimates", "Full CRM & pipeline", "Autopilot follow-ups", "Custom domain", "Priority support"],
    highlighted: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/month",
    desc: "For teams and agencies",
    features: ["Everything in Pro", "Team members", "White-label branding", "Agency dashboard", "API access", "Dedicated support"],
    highlighted: false,
  },
];

/* ── feature preview mocks ── */
function FeaturePreview({ feature }: { feature: (typeof features)[number] }) {
  if (feature.title === "Smart Card") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 mb-3 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Alex Johnson</p>
            <p className="text-xs text-muted-foreground">Premium Landscaping</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["📞 Call", "💬 Text", "✉️ Email"].map((a) => (
            <div key={a} className="rounded-lg bg-muted py-2 text-center text-xs font-medium text-foreground">{a}</div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span>3 leads captured today</span>
        </div>
      </div>
    );
  }
  if (feature.title === "Booking") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-7 gap-1 mb-3">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">{d}</div>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={`text-center text-xs py-1.5 rounded-md ${i === 2 ? "bg-primary text-primary-foreground font-bold" : i === 4 ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}>{i + 10}</div>
          ))}
        </div>
        <div className="space-y-2">
          {[{ time: "10:00 AM", name: "Sarah K.", status: "Confirmed" }, { time: "2:30 PM", name: "Mike R.", status: "Pending" }].map((b) => (
            <div key={b.time} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <div>
                <p className="text-xs font-medium text-foreground">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">{b.time}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.status === "Confirmed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (feature.title === "Estimates") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-foreground">Estimate #1042</p>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">Sent</span>
        </div>
        <div className="space-y-1.5 mb-3">
          {[{ item: "Kitchen Demo", price: "$1,200" }, { item: "Cabinet Install", price: "$3,400" }, { item: "Countertops", price: "$2,100" }].map((l) => (
            <div key={l.item} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{l.item}</span>
              <span className="font-medium text-foreground">{l.price}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Total</span>
          <span className="text-sm font-extrabold gradient-text">$6,700</span>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {["New", "Contacted", "Won"].map((s) => (
          <div key={s} className="flex-1 text-center">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">{s}</p>
            <div className={`h-1.5 rounded-full ${s === "New" ? "bg-primary" : s === "Contacted" ? "bg-warning" : "bg-success"}`} />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[{ name: "Jennifer L.", stage: "Contacted", value: "$4,200" }, { name: "David M.", stage: "New", value: "$1,800" }, { name: "Amy W.", stage: "Won", value: "$6,500" }].map((c) => (
          <div key={c.name} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{c.name[0]}</div>
              <div>
                <p className="text-xs font-medium text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.stage}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-foreground">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── nav links ── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Example Card", href: "/card/demo" },
  { label: "Pricing", href: "#pricing" },
];

/* ────────────────────────────── PAGE ────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── 1. NAV ─── */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight shrink-0">
            <span className="gradient-text">CardPilot</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) =>
              l.href.startsWith("#") ? (
                <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
              ) : (
                <Link key={l.label} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
              )
            )}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow">Create Your Card <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow text-xs px-3">Create Card <ArrowRight className="h-3 w-3 ml-0.5" /></Button>
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Toggle menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-t border-border/50">
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map((l) =>
                  l.href.startsWith("#") ? (
                    <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">{l.label}</a>
                  ) : (
                    <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">{l.label}</Link>
                  )
                )}
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Log in</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── 2. HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        </div>
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-20 md:pt-36 md:pb-28 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fade} custom={0} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
            One card to <span className="gradient-text">capture leads, book jobs, and grow.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fade} custom={1} className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            CardPilot replaces your paper card, booking app, estimate tool, and spreadsheet CRM — so you can focus on doing great work.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fade} custom={2} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#card-builder">
              <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                Build Your Card Free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </a>
            <Link to="/card/demo">
              <Button variant="outline" size="lg" className="text-base h-13 px-8 rounded-xl">
                <ExternalLink className="h-4 w-4 mr-1.5" /> View Example Card
              </Button>
            </Link>
          </motion.div>
          <motion.p initial="hidden" animate="visible" variants={fade} custom={3} className="text-xs text-muted-foreground mt-5">
            Free forever • No credit card • Setup in 2 min
          </motion.p>
        </div>
      </section>

      {/* ─── 3. INTERACTIVE BUILDER ─── */}
      <InteractiveCardBuilder />

      {/* ─── 4. HOW IT WORKS ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-12">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">Four steps to more customers</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. CORE FEATURES ─── */}
      <section id="features" className="py-16 md:py-28 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">The platform</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Everything you need to run your service business <span className="gradient-text">from one smart card.</span>
            </h2>
          </motion.div>
          <div className="space-y-20 md:space-y-28">
            {features.map((f, i) => {
              const reversed = i % 2 === 1;
              return (
                <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fade} custom={0} className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-10 md:gap-14`}>
                  <div className="flex-1 space-y-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                    <ul className="space-y-2.5 pt-1">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 w-full">
                    <FeaturePreview feature={f} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. DEMO CARD ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="mb-10">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">See it in action</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Try an example card</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">This is what your customers will see — a fast, professional card that books jobs and captures leads.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1} className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden max-w-sm mx-auto">
            <div className="bg-gradient-to-br from-primary/15 to-accent/10 h-32 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-card shadow-lg flex items-center justify-center">
                <span className="text-xl font-bold text-primary">AJ</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Alex Johnson</h3>
                <p className="text-sm text-muted-foreground">Premium Landscaping</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border p-3 text-center hover:bg-muted transition-colors">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium text-foreground">Book Now</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center hover:bg-muted transition-colors">
                  <FileText className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium text-foreground">Get Quote</p>
                </div>
              </div>
              <div className="space-y-2">
                {["Lawn Maintenance", "Garden Design", "Hardscaping"].map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={2} className="mt-8">
            <Link to="/card/demo">
              <Button size="lg" variant="outline" className="rounded-xl">
                <ExternalLink className="h-4 w-4 mr-1.5" /> Open Full Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS ─── */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Trusted by service pros everywhere</h2>
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

      {/* ─── 8. PRICING ─── */}
      <section id="pricing" className="py-16 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Start free. Upgrade when you're ready.</p>
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
                className={`rounded-2xl border p-6 md:p-8 flex flex-col ${
                  p.highlighted
                    ? "border-primary bg-card shadow-xl relative"
                    : "border-border bg-card"
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
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
                    {p.name === "Free" ? "Get Started" : "Start Free Trial"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. FINAL CTA ─── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-primary/[0.03]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-primary/[0.06] blur-[120px]" />
        </div>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3 w-3" /> Ready to grow?
            </div>
          </motion.div>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1} className="text-3xl md:text-4xl font-extrabold mb-5">
            Your next customer is already looking for you
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={2} className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Create your card in 2 minutes. Start capturing leads today — free forever.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                Create Your Card <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── 10. FOOTER ─── */}
      <FooterSection />
    </div>
  );
}
