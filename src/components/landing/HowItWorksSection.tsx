import { motion } from "framer-motion";
import { Smartphone, QrCode, Zap, ClipboardCheck, Hammer } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const steps = [
  {
    step: "01",
    title: "Create your card",
    desc: "Pick a style, add your info, and publish in under 2 minutes.",
    icon: Smartphone,
  },
  {
    step: "02",
    title: "Share everywhere",
    desc: "QR codes, NFC cards, text, email — every share is trackable.",
    icon: QrCode,
  },
  {
    step: "03",
    title: "Capture & follow up",
    desc: "Leads auto-enter your CRM. Automations handle the rest.",
    icon: Zap,
  },
  {
    step: "04",
    title: "Estimate & close",
    desc: "Send professional trade estimates. Get approvals in one tap.",
    icon: ClipboardCheck,
  },
  {
    step: "05",
    title: "Manage the job",
    desc: "Track tasks, photos, and materials from start to finish.",
    icon: Hammer,
  },
];

export default function HowItWorksSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Five steps from first contact to completed job.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={i}
            className="text-center"
          >
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <s.icon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-bold text-primary mb-2">STEP {s.step}</p>
            <h3 className="text-lg font-bold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
