import { motion } from "framer-motion";
import {
  Smartphone, Users, Calendar, FileText, Hammer, Share2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const features = [
  {
    icon: Smartphone,
    headline: "Capture leads instantly",
    benefit: "Turn every card view, QR scan, and form fill into a real contact in your CRM — automatically.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Calendar,
    headline: "Book appointments automatically",
    benefit: "Let customers schedule time with you online. No back-and-forth texts. No missed calls.",
    accent: "bg-success/10 text-success",
  },
  {
    icon: FileText,
    headline: "Send professional estimates",
    benefit: "Create room-by-room quotes with built-in calculators, templates, and one-tap customer approval.",
    accent: "bg-warning/10 text-warning",
  },
  {
    icon: Hammer,
    headline: "Manage jobs from your phone",
    benefit: "Track tasks, photos, materials, and customer signatures — from start to sign-off.",
    accent: "bg-accent/10 text-accent",
  },
  {
    icon: Users,
    headline: "Turn visitors into repeat customers",
    benefit: "Pipeline CRM, follow-up automations, and review requests keep customers coming back.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Share2,
    headline: "Promote your business everywhere",
    benefit: "Schedule social posts, run email campaigns, and track what drives the most leads.",
    accent: "bg-success/10 text-success",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Platform highlights</p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            Built to help you close more deals
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.headline}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-border bg-card p-7 hover:shadow-card-hover transition-shadow"
            >
              <div className={`h-12 w-12 rounded-xl ${f.accent} flex items-center justify-center mb-5`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.headline}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.benefit}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
