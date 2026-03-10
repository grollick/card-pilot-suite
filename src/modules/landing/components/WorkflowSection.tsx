import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const stages = [
  { label: "Lead Captured", color: "bg-primary/20 text-primary" },
  { label: "Site Visit", color: "bg-primary/30 text-primary" },
  { label: "Estimate Sent", color: "bg-primary/40 text-primary-foreground" },
  { label: "Approved", color: "bg-primary/60 text-primary-foreground" },
  { label: "Job Scheduled", color: "bg-primary/80 text-primary-foreground" },
  { label: "Completed", color: "bg-primary text-primary-foreground" },
];

export default function WorkflowSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold">From lead to completed job</h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          One seamless workflow. No switching between apps.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={1}
        className="flex flex-wrap items-center justify-center gap-2 md:gap-3"
      >
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 md:gap-3">
            <span className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap ${s.color}`}>
              {s.label}
            </span>
            {i < stages.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
            )}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={2}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            title: "Smart Estimates",
            desc: "Room-by-room sections, trade-specific templates, built-in measurement calculators, and customer approval in one click.",
          },
          {
            title: "Job Tracking",
            desc: "Kanban board, task lists, material costs, and before/during/after photos — all linked to the original estimate and contact.",
          },
          {
            title: "Auto-Showcase",
            desc: "Completed jobs become portfolio items on your public card. Request reviews automatically when a job wraps up.",
          },
        ].map((c, i) => (
          <div key={c.title} className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-bold mb-2">{c.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
