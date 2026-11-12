import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import LeadGuaranteeBanner from "@/components/LeadGuaranteeBanner";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Check, X, Zap, Users, BarChart3, CalendarCheck,
  ArrowRight, Sparkles, Star, Shield, MessageSquare,
  DollarSign, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_DISPLAY, PLAN_COMPARISON } from "@/modules/billing/config/planDisplay";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. guzzl.pro is in free beta. Paid plans are coming later and nothing is charged today.",
  },
  {
    q: "Do I need a credit card to get started?",
    a: "No. The Free plan requires no payment information at all. Start building your card right away.",
  },
  {
    q: "How quickly will I see results?",
    a: "That depends on how much you share your card. The more people see it, the more leads you capture.",
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
        <title>Pricing — guzzl.pro | Grow Your Business Starting Free</title>
        <meta name="description" content="guzzl.pro is free during beta. Compare Free, Pro, Ultra and Agency. Paid plans are coming later; nothing is charged today." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
            <GuzzlLogo to="/" />
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
            Free during beta. Paid plans coming later.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Create your card today. Nothing is charged during beta.
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
              <Check className="h-3 w-3" /> Free during beta
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
              <Zap className="h-3 w-3" /> Set up in 2 minutes
            </Badge>
          </motion.div>

        </section>

        {/* ── PRICING CARDS ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {PLAN_DISPLAY.map((plan, i) => {
              const price = plan.price;
              const isPro = plan.highlighted;
              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    isPro
                      ? "border-primary shadow-lg ring-1 ring-primary/20 lg:-my-2 lg:py-8"
                      : "border-border"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        Coming soon
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  {plan.status === "coming_soon" && !isPro && <Badge variant="secondary" className="mt-2 w-fit">Coming soon</Badge>}
                  <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className={`font-bold tracking-tight text-foreground ${isPro ? 'text-5xl' : 'text-4xl'}`}>
                      ${price}
                    </span>
                    {price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                  </div>
                  {price === 0 && <p className="text-sm text-muted-foreground mt-1">Free during beta</p>}
                  <Button
                    className={`mt-6 w-full ${isPro ? "shadow-glow" : ""}`}
                    variant={isPro ? "default" : "outline"}
                    size={isPro ? "lg" : "default"}
                    disabled={plan.status === "coming_soon"}
                    onClick={() => handleAuthNav("signup")}
                  >
                    {plan.status === "available" ? "Start Free" : "Coming soon"}
                    {plan.status === "available" && <ArrowRight className="h-4 w-4" />}
                  </Button>
                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.filter(f => f.value !== false).map((f) => (
                      <li key={f.key} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{f.bullet}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── LEAD GUARANTEE ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-4xl">
            <LeadGuaranteeBanner variant="pricing" />
          </div>
        </section>


        {/* ── FEATURE COMPARISON ── */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Compare plans</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    {PLAN_DISPLAY.map(plan => (
                      <th key={plan.key} className={`text-center py-3 px-4 font-medium ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`}>
                        {plan.name}
                        {plan.status === "coming_soon" && <span className="block text-xs font-normal">Coming soon</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_COMPARISON.map((row, idx) => (
                    <tr key={row.key} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="py-2.5 px-4 text-foreground">{row.label}</td>
                      {row.values.map((val, ci) => (
                        <td key={ci} className="text-center py-2.5 px-4">
                          {val === true ? (
                            <Check className="h-4 w-4 text-primary mx-auto" />
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
              guzzl.pro turns every interaction into a potential booking.
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
              Create your free card in 2 minutes. No credit card, no commitment.
            </p>
            <Button size="lg" className="shadow-glow gap-2" onClick={() => handleAuthNav("signup")}>
              <Sparkles className="h-4 w-4" />
              Create Your Free Card
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} guzzl.pro. All rights reserved.
        </footer>
      </div>
    </>
  );
}
