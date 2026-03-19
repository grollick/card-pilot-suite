import { motion } from "framer-motion";
import { ArrowRight, QrCode, UserPlus, Calendar, FileText, CheckCircle, RefreshCw } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const steps = [
  { icon: QrCode, label: "Visitor finds your card", color: "bg-primary/10 text-primary" },
  { icon: UserPlus, label: "Becomes a lead", color: "bg-primary/15 text-primary" },
  { icon: Calendar, label: "Books appointment", color: "bg-primary/20 text-primary" },
  { icon: FileText, label: "Receives estimate", color: "bg-primary/30 text-primary" },
  { icon: CheckCircle, label: "Approves job", color: "bg-primary/50 text-primary-foreground" },
  { icon: RefreshCw, label: "Repeat customer", color: "bg-primary text-primary-foreground" },
];

export default function WorkflowSection() {
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
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Your workflow</p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            From first contact to repeat customer
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-lg">
            One seamless workflow. No switching between apps. guzzl.pro manages the entire process.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
          className="flex flex-wrap items-center justify-center gap-3 md:gap-4"
        >
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3 md:gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className={`h-14 w-14 rounded-2xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-center max-w-[100px] leading-tight">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
