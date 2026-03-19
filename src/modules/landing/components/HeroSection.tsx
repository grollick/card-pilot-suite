import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Users, Calendar, FileText, BarChart3, Smartphone, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

const previewCards = [
  { label: "Digital Card", icon: Smartphone, color: "bg-primary/10 text-primary" },
  { label: "CRM", icon: Users, color: "bg-accent/10 text-accent" },
  { label: "Bookings", icon: Calendar, color: "bg-success/10 text-success" },
  { label: "Estimates", icon: FileText, color: "bg-warning/10 text-warning" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Trusted by 2,000+ service professionals
            </div>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
          >
            Get More Leads.{" "}
            <span className="gradient-text">Book More Customers.</span>{" "}
            Grow Your Business.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
          >
            A powerful business card, CRM, booking system, and marketing platform
            built for service professionals. One tool to capture leads, send estimates,
            manage jobs, and grow revenue.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
                Start Free — No Credit Card <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-base h-13 px-8 rounded-xl">
                <Play className="h-4 w-4 mr-1.5" /> See How It Works
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"
          >
            <span>Free forever plan</span>
            <span>•</span>
            <span>Setup in 2 minutes</span>
            <span>•</span>
            <span className="font-medium text-primary flex items-center gap-1">
              <Shield className="h-3 w-3" /> 3 leads in 30 days — guaranteed
            </span>
          </motion.div>
        </div>

        {/* Product preview cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card shadow-elevated p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previewCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-border bg-background p-4 text-center hover:shadow-card-hover transition-shadow"
                >
                  <div className={`h-12 w-12 mx-auto rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Mock dashboard preview */}
            <div className="mt-6 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <div className="flex-1" />
                <div className="h-5 w-24 rounded bg-muted" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "New Leads", value: "24", trend: "+12%" },
                  { label: "Bookings", value: "18", trend: "+8%" },
                  { label: "Revenue", value: "$4,280", trend: "+23%" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border p-3">
                    <p className="text-2xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                    <p className="text-2xs font-medium text-success">{stat.trend}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
