import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function FooterSection() {
  return (
    <>
      {/* Final CTA */}
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

      {/* Footer */}
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
    </>
  );
}
