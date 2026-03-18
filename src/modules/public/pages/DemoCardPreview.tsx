import { useParams, Link } from "react-router-dom";
import { getDemoCardBySlug } from "@/lib/demoCards";
import {
  Phone, MessageSquare, Mail, Calendar, Star, MapPin,
  ArrowLeft, ChevronRight, Sparkles, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DemoCardPreview() {
  const { slug } = useParams();
  const card = getDemoCardBySlug(slug ?? "");

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Demo card not found</h1>
          <Link to="/"><Button variant="outline">Back to home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top banner */}
      <div className="bg-primary text-primary-foreground text-center py-2.5 text-sm font-medium">
        <Sparkles className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
        This is a demo card — <Link to="/onboarding" className="underline font-semibold">Create yours free →</Link>
      </div>

      <div className="max-w-lg mx-auto pb-20">
        {/* Back link */}
        <div className="px-4 pt-4">
          <Link to="/#examples" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to examples
          </Link>
        </div>

        {/* Hero */}
        <motion.div
          initial="hidden" animate="visible" variants={fade}
          className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}dd)` }}
        >
          <div className="p-8 text-center text-white">
            <div className="h-20 w-20 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold mb-4">
              {card.name.split(" ").map(n => n[0]).join("")}
            </div>
            <h1 className="text-2xl font-extrabold">{card.name}</h1>
            <p className="text-white/80 text-sm mt-1">{card.company}</p>
            <p className="text-white/90 text-sm mt-2 font-medium">{card.tagline}</p>
            <div className="flex items-center justify-center gap-1 text-white/70 text-xs mt-2">
              <MapPin className="h-3 w-3" /> {card.city}
            </div>
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div initial="hidden" animate="visible" variants={fade} className="grid grid-cols-3 gap-2.5 mx-4 mt-4">
          {[
            { icon: Phone, label: "Call" },
            { icon: MessageSquare, label: "Text" },
            { icon: Calendar, label: "Book" },
          ].map((cta) => (
            <button
              key={cta.label}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <cta.icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{cta.label}</span>
            </button>
          ))}
        </motion.div>

        {/* About */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{card.bio}</p>
        </motion.section>

        {/* Promo banner */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="mx-4 mt-6">
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
            <p className="font-bold text-foreground text-sm">{card.promoTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.promoText}</p>
          </div>
        </motion.section>

        {/* Services */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Services</h2>
          <div className="space-y-2.5">
            {card.services.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.duration}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold">{s.price}</Badge>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Projects */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Projects</h2>
          <div className="space-y-3">
            {card.projects.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">Project Photo</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-foreground">{p.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span className="text-2xs text-primary font-medium">{p.services}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Testimonials</h2>
          <div className="space-y-3">
            {card.testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-4">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">— {t.name}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Contact form placeholder */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Get in Touch</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Phone className="h-4 w-4 text-primary" /> {card.phone}
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Mail className="h-4 w-4 text-primary" /> {card.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {card.city}
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} className="mx-4 mt-8">
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-center text-primary-foreground">
            <h3 className="text-lg font-bold mb-2">Want a card like this?</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">Create your own CardPilot card in under 2 minutes — completely free.</p>
            <Link to="/onboarding">
              <Button variant="secondary" size="lg" className="shadow-lg">
                Create Your Free Card <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Powered by */}
        <div className="text-center mt-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Powered by <span className="font-semibold">CardPilot</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
