import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Shield, Briefcase, Smartphone, Search, MessageSquare, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const steps = [
  { icon: Smartphone, title: "Create your card", desc: "Add your info and go live in under 2 minutes." },
  { icon: Search, title: "Get discovered locally", desc: "Customers in your area find you through search and shares." },
  { icon: MessageSquare, title: "Receive & respond to leads", desc: "Get notified instantly. Reply and close the job." },
];

const trust = [
  { icon: MapPin, label: "Local businesses" },
  { icon: Shield, label: "Secure platform" },
  { icon: Briefcase, label: "Built for professionals" },
];

export default function SimpleLandingPage() {
  return (
    <>
      <Helmet>
        <title>Get More Local Jobs — CardPilot</title>
        <meta name="description" content="Join local businesses already getting leads. Create your card, get discovered, and start receiving jobs in minutes." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/[0.05] blur-[100px]" />
          </div>

          <div className="max-w-3xl mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
            <motion.h1 initial="hidden" animate="visible" variants={fade} custom={0} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
              Get More Local Jobs{" "}
              <span className="text-muted-foreground">— Without Chasing Leads</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fade} custom={1} className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
              Join local businesses already getting leads.
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={fade} custom={2}>
              <Link to="/onboarding">
                <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                  Start Free — Takes 2 Minutes <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">No credit card required</p>
            </motion.div>
          </div>
        </section>

        {/* Proof */}
        <section className="max-w-3xl mx-auto px-4 pb-16 md:pb-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-warning fill-warning" />
                <span className="text-sm font-semibold text-warning">Real Result</span>
              </div>
              <p className="text-xl md:text-2xl font-bold mb-2">
                "Mike Landscaping got 2 leads in 3 days"
              </p>
              <p className="text-sm text-muted-foreground">
                Local landscaper in Ohio — signed up, shared his card, and booked his first job within a week.
              </p>
            </div>

            {/* Mini card preview */}
            <div className="w-48 shrink-0 rounded-xl border border-border bg-background p-4 shadow-card text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <p className="font-bold text-sm">Mike Landscaping</p>
              <p className="text-2xs text-muted-foreground">Columbus, OH</p>
              <div className="mt-2 flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3 w-3 text-warning fill-warning" />
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="max-w-3xl mx-auto px-4 pb-16 md:pb-24">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="text-2xl md:text-3xl font-bold text-center mb-10">
            How it works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i} className="text-center">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-bold text-primary mb-1">STEP {i + 1}</p>
                <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 pb-16 md:pb-24 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="rounded-2xl border border-border bg-card p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get your next customer?</h2>
            <p className="text-muted-foreground mb-6">It's free, fast, and built for pros like you.</p>
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                Get Started — It's Free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Trust */}
        <section className="max-w-3xl mx-auto px-4 pb-20 md:pb-28">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {trust.map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
