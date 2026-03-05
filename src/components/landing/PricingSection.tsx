import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const ANNUAL_DISCOUNT = 0.2; // 20% off

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

interface Plan {
  readonly key: string;
  readonly name: string;
  readonly price: number;
  readonly tagline: string;
  readonly popular: boolean;
  readonly features: readonly string[];
}

interface PricingSectionProps {
  visiblePlans: Plan[];
}

export default function PricingSection({ visiblePlans }: PricingSectionProps) {
  const [annual, setAnnual] = useState(false);

  const getPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    if (annual) return Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT));
    return monthlyPrice;
  };

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="text-center mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
        <p className="text-muted-foreground mt-3">Start free. Upgrade when you're ready.</p>
      </motion.div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            annual ? "bg-primary" : "bg-muted-foreground/30"
          }`}
          aria-label="Toggle annual pricing"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              annual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
          Annual
        </span>
        {annual && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
          >
            Save 20%
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visiblePlans.map((plan, i) => {
          const displayPrice = getPrice(plan.price);
          return (
            <motion.div
              key={plan.key}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className={`rounded-xl border bg-card p-6 flex flex-col ${
                plan.popular ? "border-primary ring-2 ring-primary/20 relative" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold tracking-tight">${displayPrice}</span>
                <span className="text-muted-foreground text-sm ml-1">/mo</span>
                {annual && plan.price > 0 && (
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground line-through">${plan.price}/mo</span>
                    <span className="text-xs text-primary font-medium ml-1.5">billed annually</span>
                  </div>
                )}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/onboarding">
                <Button
                  className={`w-full ${plan.popular ? "shadow-glow" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.price === 0 ? "Start Free" : "Get Started"}
                </Button>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Agency callout */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Running a team?{" "}
          <Link to="/onboarding" className="text-primary font-medium hover:underline">
            See Agency plan at ${annual ? "$199" : "$249"}/mo →
          </Link>
        </p>
      </div>
    </section>
  );
}
