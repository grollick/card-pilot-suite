import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
import GuzzlLogo from "@/components/brand/GuzzlLogo";
  ArrowRight,
  Check,
  X,
  Minus,
  CreditCard,
  Users,
  CalendarCheck,
  BarChart3,
  Share2,
  Megaphone,
  Briefcase,
  FileText,
  Kanban,
  Camera,
  Zap,
  Link2,
  Calendar,
  UserCheck,
  Mail,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ── Comparison table data ── */

const COMPETITORS = [
  { name: "guzzl.pro", highlight: true },
  { name: "Link-in-bio tools", highlight: false },
  { name: "Scheduling tools", highlight: false },
  { name: "CRM tools", highlight: false },
  { name: "Social schedulers", highlight: false },
];

type Support = "full" | "partial" | "none";

interface FeatureRow {
  label: string;
  icon: React.ReactNode;
  values: Support[];
}

const FEATURES: FeatureRow[] = [
  { label: "Digital business card", icon: <CreditCard className="h-4 w-4" />, values: ["full", "partial", "none", "none", "none"] },
  { label: "Lead capture", icon: <UserCheck className="h-4 w-4" />, values: ["full", "none", "none", "partial", "none"] },
  { label: "CRM contacts", icon: <Users className="h-4 w-4" />, values: ["full", "none", "none", "full", "none"] },
  { label: "Pipeline management", icon: <Kanban className="h-4 w-4" />, values: ["full", "none", "none", "partial", "none"] },
  { label: "Online booking", icon: <CalendarCheck className="h-4 w-4" />, values: ["full", "none", "full", "none", "none"] },
  { label: "Estimate builder", icon: <FileText className="h-4 w-4" />, values: ["full", "none", "none", "none", "none"] },
  { label: "Job management", icon: <Briefcase className="h-4 w-4" />, values: ["full", "none", "none", "none", "none"] },
  { label: "Social media scheduling", icon: <Share2 className="h-4 w-4" />, values: ["full", "none", "none", "none", "full"] },
  { label: "Marketing automation", icon: <Megaphone className="h-4 w-4" />, values: ["full", "none", "none", "partial", "partial"] },
  { label: "Business analytics", icon: <BarChart3 className="h-4 w-4" />, values: ["full", "partial", "partial", "partial", "partial"] },
  { label: "Portfolio / projects", icon: <Camera className="h-4 w-4" />, values: ["full", "partial", "none", "none", "none"] },
];

function SupportCell({ value, highlight }: { value: Support; highlight: boolean }) {
  if (value === "full")
    return (
      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${highlight ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}`}>
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-warning/15 text-warning">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground/40">
      <X className="h-3.5 w-3.5" />
    </span>
  );
}

/* ── Tool stack visual ── */

const SCATTERED_TOOLS = [
  { label: "Link page", icon: <Link2 className="h-5 w-5" /> },
  { label: "Booking app", icon: <Calendar className="h-5 w-5" /> },
  { label: "CRM", icon: <Users className="h-5 w-5" /> },
  { label: "Social scheduler", icon: <Share2 className="h-5 w-5" /> },
  { label: "Email marketing", icon: <Mail className="h-5 w-5" /> },
];

/* ── Benefits ── */

const BENEFITS = [
  { icon: <Zap className="h-5 w-5" />, title: "Simplify your tools", desc: "Replace 5+ subscriptions with one platform that does it all." },
  { icon: <CreditCard className="h-5 w-5" />, title: "Save money", desc: "Stop paying for link pages, CRMs, schedulers, and social tools separately." },
  { icon: <Users className="h-5 w-5" />, title: "One customer view", desc: "Keep all your leads, bookings, and history in a single place." },
  { icon: <Briefcase className="h-5 w-5" />, title: "More time for work", desc: "Spend less time managing software and more time serving customers." },
];

export default function ComparisonSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.02] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* ── Headline ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Why switch?</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            One Platform Instead of Five
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most small businesses juggle multiple tools to manage leads, bookings, marketing, and customer relationships. guzzl.pro brings everything together in one simple platform.
          </p>
        </motion.div>

        {/* ── Visual: scattered vs unified ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="grid md:grid-cols-2 gap-6 mb-20"
        >
          {/* Scattered tools */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-5">Without guzzl.pro</p>
            <div className="flex flex-wrap gap-3">
              {SCATTERED_TOOLS.map((t, i) => (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground"
                >
                  {t.icon}
                  {t.label}
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {["$12/mo", "$25/mo", "$49/mo", "$19/mo", "$15/mo"].map((p) => (
                <span key={p} className="text-xs text-destructive/70 bg-destructive/5 px-2 py-0.5 rounded-full font-medium">{p}</span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">5 logins · 5 invoices · data spread everywhere</p>
          </div>

          {/* guzzl.pro unified */}
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-8 relative">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">Recommended</div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-5">With guzzl.pro</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground"><GuzzlLogo to={null} size="xs" /></p>
                <p className="text-xs text-muted-foreground">Everything in one place</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Card", "CRM", "Booking", "Estimates", "Jobs", "Social", "Marketing", "Analytics"].map((f) => (
                <span key={f} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{f}</span>
              ))}
            </div>
            <p className="text-sm text-foreground mt-4 font-medium">1 login · 1 invoice · all your data connected</p>
          </div>
        </motion.div>

        {/* ── Comparison table ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-20"
        >
          <h3 className="text-xl font-bold text-foreground text-center mb-8">Feature-by-feature comparison</h3>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left text-sm font-semibold text-foreground px-5 py-4 w-[220px]">Feature</th>
                  {COMPETITORS.map((c) => (
                    <th
                      key={c.name}
                      className={`text-center text-sm font-semibold px-4 py-4 ${c.highlight ? "text-primary bg-primary/[0.06]" : "text-muted-foreground"}`}
                    >
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, ri) => (
                  <tr key={f.label} className={`border-t border-border/60 ${ri % 2 === 0 ? "bg-card" : "bg-muted/20"} hover:bg-primary/[0.02] transition-colors`}>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground flex items-center gap-2.5">
                      <span className="text-muted-foreground">{f.icon}</span>
                      {f.label}
                    </td>
                    {f.values.map((v, vi) => (
                      <td key={vi} className={`text-center px-4 py-3.5 ${COMPETITORS[vi].highlight ? "bg-primary/[0.03]" : ""}`}>
                        <SupportCell value={v} highlight={COMPETITORS[vi].highlight} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> Full support</span>
            <span className="flex items-center gap-1.5"><Minus className="h-3 w-3 text-warning" /> Partial</span>
            <span className="flex items-center gap-1.5"><X className="h-3 w-3 text-muted-foreground/40" /> Not included</span>
          </div>
        </motion.div>

        {/* ── Benefits grid ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20"
        >
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                {b.icon}
              </div>
              <h4 className="text-base font-semibold text-foreground mb-1">{b.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center rounded-2xl border border-primary/20 bg-primary/[0.03] p-10 md:p-14"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Stop juggling tools. Start growing your business.
          </h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of service professionals who simplified their business with guzzl.pro.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow px-8">
                Start Free <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <a href="#demo-builder">
              <Button size="lg" variant="outline" className="px-8">
                Create Your Card
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
