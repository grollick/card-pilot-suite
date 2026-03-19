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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FooterSection from "@/modules/landing/components/FooterSection";
import HeroPhoneAnimation from "@/modules/landing/components/HeroPhoneAnimation";
import { DEMO_CARDS } from "@/lib/demoCards";

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
  { icon: AlertTriangle, title: "Missed Leads", desc: "Potential customers visit your page but have no easy way to reach you." },
  { icon: Calendar, title: "No Simple Booking", desc: "Back-and-forth texting to schedule jobs wastes your time." },
  { icon: Users, title: "Scattered Contacts", desc: "Leads live in texts, emails, and scraps of paper — nothing is organized." },
  { icon: BarChart3, title: "No Way to Track Results", desc: "You have no idea which marketing efforts actually bring in customers." },
];

const steps = [
  { num: "1", icon: Smartphone, title: "Create Your Digital Card", desc: "Build a professional card with your services, portfolio, and booking link in minutes." },
  { num: "2", icon: Share2, title: "Share It Anywhere", desc: "Send via QR code, NFC tap, text message, social media, or email signature." },
  { num: "3", icon: UserPlus, title: "Capture Leads & Bookings", desc: "Every visitor's info is captured automatically. They can book you on the spot." },
];

const benefits = [
  { icon: UserPlus, title: "Capture Leads", desc: "Turn every card view into a contact. Auto-capture visitor info without lifting a finger." },
  { icon: Calendar, title: "Book Appointments", desc: "Let customers self-book from your card. No more back-and-forth scheduling." },
  { icon: Camera, title: "Show Your Work", desc: "Showcase your best projects with before/after photos and galleries." },
  { icon: BarChart3, title: "Track Your Growth", desc: "See card views, leads captured, bookings, and revenue — all in real-time." },
];

const PROFESSION_ICONS: Record<string, typeof Wrench> = {
  Contractor: Wrench,
  Barber: Scissors,
  Realtor: Home,
  Photographer: Camera,
  Landscaper: TreePine,
};

const PROFESSION_COLORS: Record<string, string> = {
  Contractor: "bg-primary/10 text-primary",
  Barber: "bg-accent/10 text-accent",
  Realtor: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  Photographer: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  Landscaper: "bg-primary/10 text-primary",
};

const testimonials = [
  { name: "Jake M.", role: "Landscaper", text: "I went from losing half my leads to booking 90% of them. guzzl.pro paid for itself in a week.", rating: 5 },
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
    features: ["1 Smart Card", "QR & link sharing", "Basic CRM (20 contacts)", "5 Leads/month", "Lead capture form"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "Everything you need to grow",
    features: ["Unlimited cards & contacts", "Booking & estimates", "Full CRM & pipeline", "Autopilot follow-ups", "Project showcase", "Remove branding"],
    highlighted: true,
  },
  {
    name: "Pro Plus",
    price: "$79",
    period: "/month",
    desc: "For power users & teams",
    features: ["Everything in Pro", "Team members", "Advanced analytics", "Priority support", "Custom domain", "API access"],
    highlighted: false,
  },
];

/* ── feature preview mocks ── */
function ProductPreview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* Digital Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">Digital Card</p>
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Alex Johnson</p>
            <p className="text-xs text-muted-foreground">Premium Landscaping</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {["📞 Call", "💬 Text", "📅 Book"].map((a) => (
            <div key={a} className="rounded-lg bg-muted py-2 text-center text-xs font-medium text-foreground">{a}</div>
          ))}
        </div>
      </div>

      {/* CRM Dashboard */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">CRM Dashboard</p>
        <div className="space-y-2">
          {[
            { name: "Jennifer L.", stage: "Contacted", value: "$4,200" },
            { name: "David M.", stage: "New Lead", value: "$1,800" },
            { name: "Amy W.", stage: "Won", value: "$6,500" },
          ].map((c) => (
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

      {/* Booking Calendar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">Booking Calendar</p>
        <div className="space-y-2">
          {[
            { time: "10:00 AM", name: "Sarah K.", status: "Confirmed" },
            { time: "2:30 PM", name: "Mike R.", status: "Pending" },
            { time: "4:00 PM", name: "Lisa T.", status: "Confirmed" },
          ].map((b) => (
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

      {/* Analytics */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">Analytics</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Card Views", value: "1,240", trend: "+18%" },
            { label: "Leads", value: "42", trend: "+12%" },
            { label: "Bookings", value: "18", trend: "+24%" },
            { label: "Revenue", value: "$4,280", trend: "+31%" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-3">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{s.value}</p>
              <p className="text-[10px] font-medium text-success">{s.trend}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── nav links ── */
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
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight shrink-0">
            <span className="gradient-text">guzzl.pro</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow">Create Your Free Card <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <motion.h1 initial="hidden" animate="visible" variants={fade} custom={0} className="text-4xl sm:text-5xl md:text-[3.4rem] font-extrabold tracking-tight leading-[1.1] mb-5">
                Get More Leads and{" "}
                <span className="gradient-text">Book More Customers</span>{" "}
                with One Smart Business Card.
              </motion.h1>
              <motion.p initial="hidden" animate="visible" variants={fade} custom={1} className="text-lg text-muted-foreground max-w-xl mb-8">
                Share your work, capture leads, schedule bookings, and grow your business — all from a single link.
              </motion.p>
              <motion.div initial="hidden" animate="visible" variants={fade} custom={2} className="flex flex-col sm:flex-row items-center md:items-start gap-3">
                <Link to="/onboarding">
                  <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                    Create Your Free Card <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <a href="#examples">
                  <Button variant="outline" size="lg" className="text-base h-13 px-8 rounded-xl">
                    <ExternalLink className="h-4 w-4 mr-1.5" /> View Example Card
                  </Button>
                </a>
              </motion.div>
              <motion.p initial="hidden" animate="visible" variants={fade} custom={3} className="text-xs text-muted-foreground mt-5">
                Free forever • No credit card • Setup in 2 min
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

      {/* ─── 2. PROBLEM ─── */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">The Problem</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Sound familiar?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Most service professionals lose leads every day because they don't have the right tools.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {problems.map((p, i) => (
              <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="h-12 w-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={4} className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">guzzl.pro solves all of this — in one tool.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">Three steps to more customers</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="text-center">
                <div className="relative mx-auto mb-5">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {s.num}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. PRODUCT PREVIEW ─── */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">The Platform</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Everything you need to run your service business
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From digital cards to CRM, bookings, and analytics — all in one place.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fade} custom={1}>
            <ProductPreview />
          </motion.div>
        </div>
      </section>

      {/* ─── 5. FEATURE BENEFITS ─── */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Key Benefits</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Built for service professionals who want to <span className="gradient-text">grow faster.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card p-7 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. EXAMPLE CARDS ─── */}
      <section id="examples" className="py-16 md:py-24 bg-muted/40">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Example Cards</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Cards for every profession
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Click any card to explore a full interactive demo.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {DEMO_CARDS.map((card, i) => {
              const Icon = PROFESSION_ICONS[card.profession] ?? Wrench;
              const colorClass = PROFESSION_COLORS[card.profession] ?? "bg-primary/10 text-primary";
              return (
                <motion.div key={card.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${card.accentColor}15, ${card.accentColor}08)` }}>
                    <div className={`h-14 w-14 mx-auto rounded-2xl ${colorClass} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{card.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.profession}</p>
                    <p className="text-2xs text-muted-foreground mt-1">{card.city}</p>
                  </div>
                  <div className="p-4 space-y-1.5">
                    {card.services.slice(0, 3).map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))] shrink-0" />
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
                        <Star key={j} className="h-3 w-3 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
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

      {/* ─── 7. TESTIMONIALS ─── */}
      <section className="py-16 md:py-24">
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
      <section id="pricing" className="py-16 md:py-28 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Start free. Upgrade when you're ready to grow.</p>
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
                    {p.name === "Free" ? "Start Free" : "Start Free Trial"}
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
              <Sparkles className="h-3 w-3" /> Ready to grow your business?
            </div>
          </motion.div>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1} className="text-3xl md:text-4xl font-extrabold mb-5">
            Your next customer is already looking for you
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={2} className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Create your smart business card in 2 minutes. Start capturing leads today — free forever.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                Create Your Free Card <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <FooterSection />
    </div>
  );
}
