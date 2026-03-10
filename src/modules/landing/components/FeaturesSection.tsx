import { motion } from "framer-motion";
import {
  QrCode,
  Users,
  Zap,
  Calendar,
  Mail,
  BarChart3,
  ClipboardList,
  Hammer,
  Calculator,
  Camera,
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
    icon: QrCode,
    title: "Smart QR & NFC Cards",
    desc: "Share your card with a tap or scan. Every interaction becomes a trackable lead.",
  },
  {
    icon: Users,
    title: "Automatic Lead Capture",
    desc: "Every card view, form fill, and booking auto-creates a contact in your CRM.",
  },
  {
    icon: Zap,
    title: "Follow-Up Automation",
    desc: "Trigger emails, tasks, and reminders when leads go cold — without lifting a finger.",
  },
  {
    icon: Calendar,
    title: "Built-In Booking",
    desc: "Let prospects book directly from your card. No back-and-forth scheduling.",
  },
  {
    icon: ClipboardList,
    title: "Trade Estimates & Quotes",
    desc: "Build professional estimates with room-by-room sections, measurement calculators, and one-tap approval.",
  },
  {
    icon: Hammer,
    title: "Job Management",
    desc: "Track jobs from scheduled to completed. Manage tasks, materials, and photos in one place.",
  },
  {
    icon: Calculator,
    title: "Built-In Calculators",
    desc: "Square footage, linear feet, cubic yards, hourly labor — auto-calculate every line item.",
  },
  {
    icon: Camera,
    title: "Job Photos & Portfolio",
    desc: "Document before, during, and after photos. Turn completed jobs into portfolio showcases.",
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    desc: "Send targeted campaigns to your contacts. Templates included.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track card views, QR scans, estimate approval rates, job revenue, and more.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to close more deals</h2>
          <p className="text-muted-foreground mt-3">One platform replaces 5+ tools.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-xl border border-border bg-card p-6 hover:shadow-card-hover transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
