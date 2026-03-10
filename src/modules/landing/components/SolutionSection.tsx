import { motion } from "framer-motion";
import {
  Smartphone, Users, Calendar, FileText, Hammer,
  Zap, Share2, BarChart3,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5 },
  }),
};

const capabilities = [
  { icon: Smartphone, title: "Smart Business Card", desc: "A digital card that captures leads with every view, tap, and scan." },
  { icon: Users, title: "CRM & Pipeline", desc: "Organize leads, track stages, and never lose a prospect again." },
  { icon: Calendar, title: "Online Booking", desc: "Let customers schedule time with you directly from your card." },
  { icon: FileText, title: "Estimate Builder", desc: "Create professional trade quotes with calculators and one-tap approval." },
  { icon: Hammer, title: "Job Management", desc: "Track tasks, photos, materials, and customer sign-offs." },
  { icon: Zap, title: "Automation", desc: "Auto follow-up with leads, send reminders, and trigger emails." },
  { icon: Share2, title: "Social Scheduling", desc: "Plan and schedule posts across multiple platforms." },
  { icon: BarChart3, title: "Analytics", desc: "Track card views, lead sources, revenue, and conversion rates." },
];

export default function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">The solution</p>
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Everything you need to grow your business{" "}
            <span className="gradient-text">in one place</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            CardPilot replaces 5+ tools so you can focus on what you do best.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-border bg-card p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <c.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-1.5">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
