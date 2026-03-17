import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, X, Zap, Users, BarChart3, CalendarCheck,
  ArrowRight, Sparkles, Star, Shield, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ── Plan data (simplified 3-tier for public page) ──

const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: "Everything you need to get started",
    cta: "Start Free",
    popular: false,
    features: [
      "Digital business card",
      "Lead capture forms",
      "CRM contacts",
      "Booking system",
      "Basic analytics",
      "Up to 3 services",
      "QR code sharing",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 23,
    tagline: "Unlock automation & growth tools",
    cta: "Upgrade to Pro",
    popular: true,
    features: [
      "Unlimited services",
      "Automated follow-ups",
      "Email campaigns",
      "Advanced analytics",
      "Promotion banners",
      "Remove watermark",
      "CRM pipeline",
      "Social scheduler",
    ],
  },
  {
    key: "pro_plus",
    name: "Pro Plus",
    monthlyPrice: 79,
    yearlyPrice: 63,
    tagline: "Scale with AI & team tools",
    cta: "Go Pro Plus",
    popular: false,
    features: [
      "Everything in Pro",
      "Online payments",
      "Custom domains",
      "Team accounts",
      "AI assistant",
      "Revenue forecasting",
      "Priority support",
      "White-label option",
    ],
  },
];

// ── Feature comparison table ──

interface ComparisonRow {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  proPlus: boolean | string;
}

const comparisonRows: ComparisonRow[] = [
  { feature: "Digital business card", free: true, pro: true, proPlus: true },
  { feature: "Lead capture", free: true, pro: true, proPlus: true },
  { feature: "CRM contacts", free: true, pro: true, proPlus: true },
  { feature: "Booking system", free: true, pro: true, proPlus: true },
  { feature: "QR code sharing", free: true, pro: true, proPlus: true },
  { feature: "Services", free: "3", pro: "Unlimited", proPlus: "Unlimited" },
  { feature: "Analytics", free: "Basic", pro: "Advanced", proPlus: "Advanced" },
  { feature: "Remove watermark", free: false, pro: true, proPlus: true },
  { feature: "Automated follow-ups", free: false, pro: true, proPlus: true },
  { feature: "Email campaigns", free: false, pro: true, proPlus: true },
  { feature: "Promotion banners", free: false, pro: true, proPlus: true },
  { feature: "Social scheduler", free: false, pro: true, proPlus: true },
  { feature: "Online payments", free: false, pro: false, proPlus: true },
  { feature: "Custom domains", free: false, pro: false, proPlus: true },
  { feature: "Team accounts", free: false, pro: false, proPlus: true },
  { feature: "AI assistant", free: false, pro: false, proPlus: true },
  { feature: "Revenue forecasting", free: false, pro: false, proPlus: true },
  { feature: "Priority support", free: false, pro: false, proPlus: true },
];

const faqs = [
  {
    q: "Can I start for free?",
    a: "Absolutely. The Free plan includes everything you need to create your digital card, capture leads, and manage bookings. No credit card required.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel anytime. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your data is always safe. If you downgrade, premium features are paused but nothing is deleted. Upgrade again to resume.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Yes — save 20% when you choose annual billing on any paid plan.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. The Free plan requires no payment information. You only need a card when upgrading to a paid plan.",
  },
  {
    q: "Can I use CardPilot for my team?",
    a: "Pro Plus includes team accounts so multiple people can manage your business. The Agency plan (coming soon) supports unlimited client workspaces.",
  },
];

const benefits = [
  { icon: Zap, title: "Capture more leads", desc: "Your digital card turns every interaction into a potential customer." },
  { icon: CalendarCheck, title: "Book more customers", desc: "Let clients self-schedule directly from your card — 24/7." },
  { icon: MessageSquare, title: "Automate follow-ups", desc: "Never lose a lead with automated email sequences and reminders." },
  { icon: BarChart3, title: "Track performance", desc: "See exactly what's working with real-time analytics and insights." },
];

// ── Component ──

export default function PricingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <Helmet>
        <title>Pricing — CardPilot</title>
        <meta name="description" content="Simple pricing for growing your business. Start free and upgrade when you're ready to automate and scale." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
            <button onClick={() => navigate("/")} className="font-bold text-lg tracking-tight text-foreground">
              Card<span className="text-primary">Pilot</span>
            </button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign in</Button>
              <Button size="sm" onClick={() => navigate("/auth")}>Get Started</Button>
            </div>
          </div>
        </nav>

        {/* ── HEADER ── */}
        <section className="pt-20 pb-12 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground max-w-2xl mx-auto"
          >
            Simple pricing for growing your business.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Start free and upgrade when you're ready to automate and scale.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
              <span className="ml-1.5 inline-block rounded-full bg-success/10 text-success text-xs font-semibold px-2 py-0.5">
                Save 20%
              </span>
            </span>
          </motion.div>
        </section>

        {/* ── PRICING CARDS ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    plan.popular
                      ? "border-primary shadow-lg ring-1 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        <Star className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {price === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">Free forever</p>
                  )}

                  <Button
                    className={`mt-6 w-full ${plan.popular ? "shadow-glow" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── FEATURE COMPARISON ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Compare plans</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-primary">Pro</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Pro Plus</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr key={row.feature} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="py-2.5 px-4 text-foreground">{row.feature}</td>
                      {([row.free, row.pro, row.proPlus] as (boolean | string)[]).map((val, ci) => (
                        <td key={ci} className="text-center py-2.5 px-4">
                          {val === true ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : val === false ? (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          ) : (
                            <span className="text-foreground font-medium">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── VALUE STATEMENT ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Everything you need to grow your business
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-10">
              CardPilot gives you the tools to turn every connection into a customer.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="rounded-xl border border-border p-5 text-left">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/20 p-10 text-center">
            <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Ready to grow your business?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Create your free digital card in 30 seconds. No credit card required.
            </p>
            <Button size="lg" className="shadow-glow gap-2" onClick={() => navigate("/auth")}>
              <Sparkles className="h-4 w-4" />
              Create Your Free Card
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CardPilot. All rights reserved.
        </footer>
      </div>
    </>
  );
}
