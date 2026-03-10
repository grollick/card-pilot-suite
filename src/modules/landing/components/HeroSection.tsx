import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

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

export default function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center relative overflow-hidden">
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
  );
}
