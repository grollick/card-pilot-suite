import { motion } from "framer-motion";
import { Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const testimonials = [
  {
    name: "Sarah M.",
    role: "Realtor",
    text: "I put QR codes on my yard signs. Every scan captures a lead automatically. Game changer.",
    stars: 5,
  },
  {
    name: "Mike T.",
    role: "General Contractor",
    text: "I send estimates, get approval, and schedule the job — all from one app. My close rate went up 30%.",
    stars: 5,
  },
  {
    name: "Jessica L.",
    role: "Insurance Agent",
    text: "The follow-up automations alone saved me 5 hours a week. Worth every penny.",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold">Trusted by professionals</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
