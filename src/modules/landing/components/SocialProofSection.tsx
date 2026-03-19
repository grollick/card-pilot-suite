import { motion } from "framer-motion";
import { Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5 },
  }),
};

const professions = [
  "Realtors", "Contractors", "Barbers", "Photographers",
  "Personal Trainers", "Cleaning Services", "Landscapers",
  "Electricians", "Plumbers", "Insurance Agents", "Consultants",
  "Painters",
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Realtor — Austin, TX",
    text: "I put QR codes on my yard signs. Every scan captures a lead automatically. My pipeline grew 40% in the first month.",
    stars: 5,
  },
  {
    name: "Mike T.",
    role: "General Contractor — Denver, CO",
    text: "I send estimates, get approval, and schedule the job — all from one app. My close rate went up 30%.",
    stars: 5,
  },
  {
    name: "Jessica L.",
    role: "Insurance Agent — Miami, FL",
    text: "The follow-up automations alone saved me 5 hours a week. I never lose track of a lead anymore.",
    stars: 5,
  },
];

export default function SocialProofSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Built for the businesses that keep our communities running
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Thousands of professionals trust guzzl.pro to grow their business.
          </p>
        </motion.div>

        {/* Profession pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-14">
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

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm mb-5 leading-relaxed text-foreground">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust stats */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {[
            { value: "2,000+", label: "Active Users" },
            { value: "50K+", label: "Leads Captured" },
            { value: "4.9★", label: "Average Rating" },
            { value: "12K+", label: "Jobs Completed" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-extrabold gradient-text">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
