import { motion } from "framer-motion";
import {
  Home, Wrench, Scissors, Camera, Dumbbell,
  Sparkles, TreePine, Zap, Droplets, ShieldCheck,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5 },
  }),
};

const industries = [
  { icon: Home, name: "Realtors", use: "Yard sign QR codes, open house lead capture, automated follow-ups" },
  { icon: Wrench, name: "Contractors", use: "Trade estimates, job tracking, before/after portfolio" },
  { icon: Scissors, name: "Barbers", use: "Online booking, appointment reminders, loyalty campaigns" },
  { icon: Camera, name: "Photographers", use: "Portfolio card, session booking, gallery delivery" },
  { icon: Dumbbell, name: "Personal Trainers", use: "Class scheduling, client CRM, progress photos" },
  { icon: Sparkles, name: "Cleaners", use: "Quote requests, recurring booking, review collection" },
  { icon: TreePine, name: "Landscapers", use: "Measurement calculators, seasonal campaigns, job photos" },
  { icon: Zap, name: "Electricians", use: "Service area cards, emergency booking, estimate approval" },
  { icon: Droplets, name: "Plumbers", use: "24/7 booking, materials tracking, customer sign-off" },
  { icon: ShieldCheck, name: "Consultants", use: "Professional card, CRM pipeline, proposal workflow" },
];

export default function IndustriesSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Industries</p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            Built for service businesses
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-lg">
            From contractors to consultants, CardPilot adapts to your industry.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-border bg-card p-5 hover:shadow-card-hover transition-shadow text-center group"
            >
              <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <ind.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">{ind.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{ind.use}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
