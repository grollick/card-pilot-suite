import { useParams, Link } from "react-router-dom";
import { getDemoCardBySlug } from "@/lib/demoCards";
import {
  Phone, MessageSquare, Mail, Calendar, Star, MapPin,
  ArrowLeft, ChevronRight, Sparkles, CheckCircle2, Clock, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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

        {/* Hero with cover image */}
        <motion.div
          initial="hidden" animate="visible" variants={fade}
          className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-xl"
        >
          {/* Cover photo */}
          <div className="relative h-44 overflow-hidden">
            <img
              src={card.coverUrl}
              alt={card.company}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>

          {/* Profile overlay */}
          <div className="relative bg-card px-5 pb-5">
            {/* Avatar */}
            <div className="absolute -top-8 left-5">
              <div className="h-16 w-16 rounded-full overflow-hidden ring-4 ring-card shadow-lg">
                <img src={card.avatarUrl} alt={card.name} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="pt-10">
              <h1 className="text-xl font-extrabold text-foreground">{card.name}</h1>
              <p className="text-sm text-muted-foreground font-medium">{card.company}</p>
              <p className="text-sm mt-1.5 font-medium" style={{ color: card.accentColor }}>
                {card.tagline}
              </p>
              <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1.5">
                <MapPin className="h-3 w-3" /> {card.city}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-3 gap-2.5 mx-4 mt-4">
          {[
            { icon: Phone, label: "Call", color: "hsl(142, 71%, 45%)" },
            { icon: MessageSquare, label: "Text", color: "hsl(217, 91%, 60%)" },
            { icon: Calendar, label: "Book", color: card.accentColor },
          ].map((cta) => (
            <motion.button
              key={cta.label}
              variants={fade}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.97] shadow-sm"
            >
              <cta.icon className="h-5 w-5" style={{ color: cta.color }} />
              <span className="text-xs font-medium text-foreground">{cta.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* About */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{card.bio}</p>
        </motion.section>

        {/* Promo banner */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
          <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${card.accentColor}15, ${card.accentColor}08)` }}>
            <div className="p-5 border border-border/40 rounded-xl">
              <p className="font-bold text-foreground text-sm">{card.promoTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.promoText}</p>
            </div>
          </div>
        </motion.section>

        {/* Services */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Services</h2>
          <div className="space-y-2">
            {card.services.map((s) => (
              <motion.div
                key={s.name}
                variants={fade}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {s.duration}
                    </span>
                  </div>
                </div>
                <Badge
                  className="text-xs font-bold shrink-0 ml-3"
                  style={{ backgroundColor: `${card.accentColor}18`, color: card.accentColor, border: 'none' }}
                >
                  {s.price}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Projects / Portfolio */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Portfolio</h2>
          <div className="space-y-3">
            {card.projects.map((p) => (
              <motion.div
                key={p.title}
                variants={fade}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-40 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Project Photo</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-foreground">{p.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: card.accentColor }} />
                    <span className="text-2xs font-medium" style={{ color: card.accentColor }}>{p.services}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Reviews</h2>
          <div className="space-y-3">
            {card.testimonials.map((t) => (
              <motion.div key={t.name} variants={fade} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                  <span className="text-2xs text-muted-foreground font-medium">{t.name}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Get in Touch</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              {card.phone}
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              {card.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              {card.city}
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-8">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <div className="relative p-6 text-center" style={{ background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}cc)` }}>
              <h3 className="text-lg font-bold text-white mb-2">Want a card like this?</h3>
              <p className="text-sm text-white/80 mb-4">Create your own guzzl.pro card in under 2 minutes — completely free.</p>
              <Link to="/onboarding">
                <Button variant="secondary" size="lg" className="shadow-lg">
                  Create Your Free Card <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Powered by */}
        <div className="text-center mt-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Powered by <span className="font-semibold"><span className="font-extrabold text-primary">guzzl</span>.pro</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
