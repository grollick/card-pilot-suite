import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Check, X, Zap, Users, BarChart3, CalendarCheck,
  ArrowRight, Sparkles, Star, Shield, MessageSquare,
  DollarSign, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ── Plan data — value-based copy ──

const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: "Start getting leads — no strings attached",
    cta: "Start Free",
    popular: false,
    roiNote: null,
    features: [
      "Your own digital business card",
      "Capture leads from every interaction",
      "Let customers book you online",
      "See who's viewing your card",
      "Share via QR code or link",
      "Up to 3 services listed",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 23,
    tagline: "Generate more leads and book more jobs — on autopilot",
    cta: "Start 14-Day Free Trial",
    popular: true,
    roiNote: "1 new job covers your entire month",
    features: [
      "Everything in Free, plus:",
      "Unlimited services & bookings",
      "Automated lead follow-ups",
      "Email marketing campaigns",
      "Full CRM pipeline",
      "Social media scheduler",
      "Promotion banners on your card",
      "Remove CardPilot watermark",
    ],
  },
  {
    key: "pro_plus",
    name: "Pro Plus",
    monthlyPrice: 79,
    yearlyPrice: 63,
    tagline: "Scale your business with AI, payments, and team tools",
    cta: "Go Pro Plus",
    popular: false,
    roiNote: "Pays for itself with one extra booking per month",
    features: [
      "Everything in Pro, plus:",
      "Accept online payments",
      "AI-powered business assistant",
      "Revenue forecasting & insights",
      "Team member accounts",
      "Custom domain support",
      "White-label branding option",
      "Priority support",
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
  { feature: "Online booking", free: true, pro: true, proPlus: true },
  { feature: "Card analytics", free: "Basic", pro: "Advanced", proPlus: "Advanced" },
  { feature: "QR code sharing", free: true, pro: true, proPlus: true },
  { feature: "Services listed", free: "3", pro: "Unlimited", proPlus: "Unlimited" },
  { feature: "Automated follow-ups", free: false, pro: true, proPlus: true },
  { feature: "Email campaigns", free: false, pro: true, proPlus: true },
  { feature: "CRM pipeline", free: false, pro: true, proPlus: true },
  { feature: "Social scheduler", free: false, pro: true, proPlus: true },
  { feature: "Remove watermark", free: false, pro: true, proPlus: true },
  { feature: "Promotion banners", free: false, pro: true, proPlus: true },
  { feature: "Online payments", free: false, pro: false, proPlus: true },
  { feature: "AI assistant", free: false, pro: false, proPlus: true },
  { feature: "Revenue forecasting", free: false, pro: false, proPlus: true },
  { feature: "Team accounts", free: false, pro: false, proPlus: true },
  { feature: "Custom domains", free: false, pro: false, proPlus: true },
  { feature: "Priority support", free: false, pro: false, proPlus: true },
];

const faqs = [
  {
    q: "Do I need a credit card to get started?",
    a: "No. The Free plan requires no payment information at all. Start building your card right away.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — there are no contracts or commitments. Cancel with one click and you won't be charged again.",
  },
  {
    q: "How quickly will I see results?",
    a: "Most users get their first lead within 48 hours of sharing their card. The more you share, the more leads you capture.",
  },
  {
    q: "What happens if I downgrade?",
    a: "Your data is always safe. Premium features pause but nothing is deleted. Upgrade again anytime to resume.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Yes — save 20% when you choose annual billing on any paid plan. That's like getting over 2 months free.",
  },
  {
    q: "Is CardPilot worth $29/month?",
    a: "One new job from an automated follow-up can easily cover months of CardPilot. Most Pro users report earning back their investment within the first week.",
  },
];

const benefits = [
  { icon: DollarSign, title: "Turn views into revenue", desc: "Every card view is a chance to capture a lead that becomes a paying customer." },
  { icon: CalendarCheck, title: "Fill your calendar", desc: "Let clients book directly from your card — even while you're on a job." },
  { icon: MessageSquare, title: "Never lose a lead", desc: "Automated follow-ups ensure every inquiry gets a response, every time." },
  { icon: TrendingUp, title: "Grow on autopilot", desc: "Set it once and watch leads, bookings, and reviews grow month over month." },
];

// ── Component ──

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [annual, setAnnual] = useState(false);

  const handleAuthNav = (mode?: string) => {
    if (user) {
      navigate("/app");
    } else {
      navigate(mode ? `/auth?mode=${mode}` : "/auth");
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing — CardPilot | Grow Your Business Starting Free</title>
        <meta name="description" content="Start free, upgrade when the leads start rolling in. CardPilot pricing designed so one new job pays for your entire month." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
            <button onClick={() => navigate("/")} className="font-bold text-lg tracking-tight text-foreground">
              Card<span className="text-primary">Pilot</span>
            </button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => handleAuthNav()}>{user ? "Dashboard" : "Sign in"}</Button>
              {!user && <Button size="sm" onClick={() => handleAuthNav("signup")}>Get Started Free</Button>}
            </div>
          </div>
        </nav>

        {/* ── HEADER ── */}
        <section className="pt-20 pb-12 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto"
          >
            One new job pays for your entire month.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Start free. Upgrade when the leads start rolling in.
          </motion.p>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-3"
          >
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
              <Shield className="h-3 w-3" /> No credit card required
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
              <Check className="h-3 w-3" /> Cancel anytime
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
              <Zap className="h-3 w-3" /> Set up in 30 seconds
            </Badge>
          </motion.div>

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
          <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => {
              const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
              const isPro = plan.popular;
              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    isPro
                      ? "border-primary shadow-lg ring-1 ring-primary/20 md:scale-105 md:-my-2 md:py-8"
                      : "border-border"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        <Star className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className={`font-bold tracking-tight text-foreground ${isPro ? 'text-5xl' : 'text-4xl'}`}>
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {price === 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">Free forever</p>
                  ) : (
                    annual && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed annually · ${price * 12}/yr
                      </p>
                    )
                  )}

                  {/* ROI indicator */}
                  {plan.roiNote && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/5 border border-success/20 px-3 py-2">
                      <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
                      <span className="text-xs font-medium text-success">{plan.roiNote}</span>
                    </div>
                  )}

                  <Button
                    className={`mt-6 w-full ${isPro ? "shadow-glow" : ""}`}
                    variant={isPro ? "default" : "outline"}
                    size={isPro ? "lg" : "default"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {price > 0 && (
                    <p className="text-[11px] text-muted-foreground text-center mt-2">
                      No credit card required · Cancel anytime
                    </p>
                  )}

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

        {/* ── ROI SECTION ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-success/5 via-background to-primary/5 border border-border p-8 md:p-12">
            <div className="text-center">
              <DollarSign className="h-10 w-10 text-success mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                The math is simple
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                CardPilot costs less than a single business card order — and generates leads every single day.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="rounded-xl bg-card border border-border/60 p-5">
                <p className="text-3xl font-bold text-foreground">$29</p>
                <p className="text-sm text-muted-foreground mt-1">Pro plan per month</p>
              </div>
              <div className="rounded-xl bg-card border border-border/60 p-5">
                <p className="text-3xl font-bold text-success">$500+</p>
                <p className="text-sm text-muted-foreground mt-1">Average value of 1 new job</p>
              </div>
              <div className="rounded-xl bg-card border border-border/60 p-5">
                <p className="text-3xl font-bold text-primary">17x</p>
                <p className="text-sm text-muted-foreground mt-1">Return on investment</p>
              </div>
            </div>
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
                    <th className="text-center py-3 px-4 font-medium text-primary">
                      Pro <Star className="h-3 w-3 inline ml-0.5" />
                    </th>
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
              Stop chasing customers. Let them come to you.
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-10">
              CardPilot turns every interaction into a potential booking.
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
              Your next customer is one link away.
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Create your free card in 30 seconds. No credit card, no commitment.
            </p>
            <Button size="lg" className="shadow-glow gap-2" onClick={() => navigate("/auth")}>
              <Sparkles className="h-4 w-4" />
              Create Your Free Card
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Join thousands of local professionals already growing with CardPilot.
            </p>
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
