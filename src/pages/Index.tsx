import { Link } from "react-router-dom";
import PricingSection from "@/components/landing/PricingSection";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  QrCode,
  Users,
  Calendar,
  Mail,
  BarChart3,
  Sparkles,
  Zap,
  Shield,
  Check,
  Star,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { motion } from "framer-motion";
import { PLAN_TIERS } from "@/lib/plans";
import { QR_PRODUCTS } from "@/lib/qrProducts";

const features = [
  {
    icon: QrCode,
    title: "Smart QR & NFC Cards",
    desc: "Share your card with a tap or scan. Every interaction becomes a trackable lead.",
  },
  {
    icon: Users,
    title: "Automatic Lead Capture",
    desc: "Every card view, form fill, and booking auto-creates a contact in your CRM.",
  },
  {
    icon: Zap,
    title: "Follow-Up Automation",
    desc: "Trigger emails, tasks, and reminders when leads go cold — without lifting a finger.",
  },
  {
    icon: Calendar,
    title: "Built-In Booking",
    desc: "Let prospects book directly from your card. No back-and-forth scheduling.",
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    desc: "Send targeted campaigns to your contacts. Templates included.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "See who viewed your card, which QR codes convert, and where leads come from.",
  },
];

const professions = [
  "Realtors",
  "Contractors",
  "Insurance Agents",
  "Mortgage Brokers",
  "Car Salespeople",
  "Freelancers",
  "Consultants",
  "Photographers",
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Realtor",
    text: "I put QR codes on my yard signs. Every scan captures a lead automatically. Game changer.",
    stars: 5,
  },
  {
    name: "Mike T.",
    role: "Contractor",
    text: "Replaced my paper cards with CardPilot. Now every new contact goes straight into my CRM.",
    stars: 5,
  },
  {
    name: "Jessica L.",
    role: "Insurance Agent",
    text: "The follow-up automations alone saved me 5 hours a week. Worth every penny.",
    stars: 5,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function Index() {
  // Show first 4 plans (free, starter, pro, business)
  const visiblePlans = PLAN_TIERS.filter((p) => p.key !== "agency");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            <span className="gradient-text">CardPilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/products">
              <Button variant="ghost" size="sm">Products</Button>
            </Link>
            <a href="#pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </a>
            <Link to="/auth">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow">
                Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3 w-3" /> Built for {professions[0].toLowerCase()}, {professions[1].toLowerCase()}, and more
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.08]">
            The digital business card that{" "}
            <span className="gradient-text">automatically captures and follows up</span>{" "}
            with leads
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Turn every meeting, scan, or visit into a contact in your CRM.
            Smart cards + QR codes + automation = more closed deals.
          </p>

          <div className="flex items-center justify-center gap-3 mt-10">
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-12 px-8">
                Start Free — No Credit Card <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Free forever plan • Upgrade anytime • No credit card required
          </p>
        </motion.div>
      </section>

      {/* ── Who it's for ── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {professions.map((p, i) => (
            <motion.span
              key={p}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium"
            >
              {p}
            </motion.span>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Three steps to turn every interaction into revenue.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Create your card",
              desc: "Pick a style, add your info, and publish in under 2 minutes.",
              icon: Smartphone,
            },
            {
              step: "02",
              title: "Share everywhere",
              desc: "QR codes, NFC cards, text, email — every share is trackable.",
              icon: QrCode,
            },
            {
              step: "03",
              title: "Capture & follow up",
              desc: "Leads auto-enter your CRM. Automations handle the rest.",
              icon: Zap,
            },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="text-center"
            >
              <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-bold text-primary mb-2">STEP {s.step}</p>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to close more deals</h2>
            <p className="text-muted-foreground mt-3">One platform replaces 5+ tools.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-card-hover transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QR Products upsell ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <QrCode className="h-3 w-3" /> Physical Products
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Smart QR products that drive leads</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Premium laser-engraved plates, NFC cards, and signs — each one linked to your CardPilot card.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QR_PRODUCTS.map((p, i) => (
            <motion.div
              key={p.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-xl border border-border bg-card p-6 text-center hover:shadow-card-hover transition-shadow"
            >
              <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
              <p className="text-2xl font-extrabold text-primary">${p.price}</p>
              <Link to="/products" className="inline-flex items-center text-xs text-primary font-medium mt-3 hover:underline">
                View details <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Trusted by professionals</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <PricingSection visiblePlans={visiblePlans} />

      {/* ── Final CTA ── */}
      <section className="bg-primary/5 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop handing out cards that end up in the trash
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Every CardPilot card is a lead machine. Start capturing contacts today.
            </p>
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-12 px-10">
                Create Your Free Card <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2026 CardPilot. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
