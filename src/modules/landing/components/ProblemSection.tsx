import { motion } from "framer-motion";
import { AlertTriangle, Clock, Search, FileX, Megaphone } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const problems = [
  { icon: Search, title: "Missing leads", desc: "Prospects visit your card or site and leave without a trace." },
  { icon: Clock, title: "Manual scheduling", desc: "Back-and-forth texts and calls just to book an appointment." },
  { icon: AlertTriangle, title: "Unorganized contacts", desc: "Leads scattered across notes, texts, and spreadsheets." },
  { icon: FileX, title: "Time wasted on quotes", desc: "Hours building estimates from scratch for every new job." },
  { icon: Megaphone, title: "Inconsistent marketing", desc: "No time to post on social media or send follow-up emails." },
];

export default function ProblemSection() {
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
          <p className="text-sm font-semibold text-destructive mb-3 uppercase tracking-wider">Sound familiar?</p>
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Running a business shouldn't feel chaotic
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            You're great at your craft. But managing leads, scheduling, quotes, and marketing eats up your day.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-destructive/10 bg-destructive/[0.03] p-5 text-center"
            >
              <div className="h-11 w-11 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
                <p.icon className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
