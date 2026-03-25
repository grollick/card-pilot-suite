import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, BadgeCheck } from "lucide-react";
import TrustBadge from "@/components/trust/TrustBadge";
import PublicTopBar from "@/modules/public/components/PublicTopBar";

const sections = [
  {
    icon: Lock,
    title: "Data Encryption",
    body: "All data is encrypted in transit using TLS 1.3 and at rest with AES-256 encryption. Your sensitive information is never stored in plain text.",
  },
  {
    icon: Eye,
    title: "Privacy First",
    body: "We never sell your data. Access is strictly limited to what's needed to provide the service. You can request data export or deletion at any time.",
  },
  {
    icon: Shield,
    title: "Account Protection",
    body: "Multi-layered account protection including rate limiting, bot detection, disposable email blocking, and progressive trust scoring keeps your account safe.",
  },
  {
    icon: Server,
    title: "Platform Reliability",
    body: "Your data is hosted on enterprise-grade infrastructure with automated backups, redundancy, and 99.9% uptime. We monitor 24/7 for threats.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Businesses",
    body: "Businesses on our marketplace go through a verification process. Look for the Verified badge when choosing a professional.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function SecurityPage() {
  return (
    <>
      <Helmet>
        <title>Security — Guzzl</title>
        <meta name="description" content="Learn how Guzzl protects your data with encryption, privacy-first practices, and enterprise-grade security." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <span className="text-sm font-semibold text-foreground ml-auto flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              Security
            </span>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-16">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-5">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Security at Guzzl
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Your trust is our priority. Here's how we protect your data, your business, and your customers.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <TrustBadge variant="secure" size="md" />
              <TrustBadge variant="protected" size="md" />
              <TrustBadge variant="encrypted" size="md" />
            </div>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-1">{s.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center mt-16 pt-8 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Questions about security?{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" · "}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
