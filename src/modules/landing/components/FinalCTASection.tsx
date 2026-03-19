import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadGuaranteeBanner from "@/components/LeadGuaranteeBanner";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

export default function FinalCTASection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-primary/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/[0.06] blur-[120px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3 w-3" /> Ready to grow?
          </div>
        </motion.div>

        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
          className="text-3xl md:text-5xl font-extrabold leading-tight mb-5"
        >
          Your next customer is already looking for you
        </motion.h2>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={2}
          className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
        >
          Start capturing leads, booking customers, and growing your revenue — all from one platform. Free forever.
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/onboarding">
            <Button size="lg" className="shadow-glow text-base h-13 px-10 rounded-xl">
              Create Your Card <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/onboarding">
            <Button variant="outline" size="lg" className="text-base h-13 px-8 rounded-xl">
              Start Free Today
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={4}
          className="text-xs text-muted-foreground mt-5"
        >
          No credit card required • Setup in 2 minutes • Free forever plan
        </motion.p>
      </div>
    </section>
  );
}
