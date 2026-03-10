import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const professions = [
  "Realtors",
  "Contractors",
  "Plumbers",
  "Electricians",
  "Painters",
  "Landscapers",
  "Roofers",
  "HVAC Pros",
  "Cleaners",
  "Handymen",
  "Insurance Agents",
  "Freelancers",
];

export default function ProfessionsBar() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center justify-center gap-3">
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
    </section>
  );
}
