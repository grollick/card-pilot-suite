import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, Users, Calendar, Mail, BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: CreditCard, title: "Digital Business Card", desc: "Stunning, shareable cards with QR codes" },
  { icon: Users, title: "CRM & Leads", desc: "Track and manage your pipeline" },
  { icon: Calendar, title: "Booking System", desc: "Let clients book directly" },
  { icon: Mail, title: "Email Marketing", desc: "Send campaigns to your contacts" },
  { icon: BarChart3, title: "Analytics", desc: "Track views, clicks, and conversions" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">CardPilot</span>
          <div className="flex items-center gap-3">
            <Link to="/app"><Button variant="ghost" size="sm">Dashboard</Button></Link>
            <Link to="/onboarding"><Button size="sm" className="shadow-glow">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" /> Built for professionals
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
            The digital business card that{" "}
            <span className="gradient-text">automatically follows up</span>{" "}
            with every lead
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-6">
            Create a stunning card, capture leads, book appointments, and let smart automations close the loop — all from one platform.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow">
                Create Your Card <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg">See Demo</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-6 hover:shadow-card-hover transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">© 2026 CardPilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
