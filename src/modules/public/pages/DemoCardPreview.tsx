import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDemoCardBySlug } from "@/lib/demoCards";
import {
  Phone, MessageSquare, Mail, Calendar, Star, MapPin,
  ArrowLeft, ChevronRight, Sparkles, CheckCircle2, Clock,
  Download, FileText, Send, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import GuzzlLogo from "@/components/brand/GuzzlLogo";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── vCard generator ── */
function downloadVCard(card: { name: string; company: string; phone: string; email: string; city: string; tagline: string }) {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${card.name}`,
    `ORG:${card.company}`,
    `TEL;TYPE=WORK,VOICE:${card.phone}`,
    `EMAIL:${card.email}`,
    `ADR;TYPE=WORK:;;${card.city}`,
    `TITLE:${card.tagline}`,
    `URL:${window.location.href}`,
    "END:VCARD",
  ].join("\n");

  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${card.name.replace(/\s+/g, "_")}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Contact downloaded!", { description: "Check your downloads folder." });
}

/* ── Estimate Request Modal ── */
function EstimateModal({ card, open, onClose }: { card: { name: string; company: string; email: string; services: { name: string }[] }; open: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", service: "", details: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Estimate request sent!", { description: `${card.name} will get back to you soon.` });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Request Free Estimate</h3>
                <p className="text-xs text-muted-foreground">from {card.company}</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-bold text-foreground mb-1">Request Sent!</h4>
                <p className="text-sm text-muted-foreground mb-4">This is a demo — in a real card, {card.name} would receive your request instantly.</p>
                <Button variant="outline" onClick={onClose}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Your name *" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <Input placeholder="Phone *" type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                >
                  <option value="">Select a service...</option>
                  {card.services.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <Textarea placeholder="Describe what you need..." rows={3} value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} />
                <Button type="submit" className="w-full gap-2">
                  <Send className="h-4 w-4" /> Send Estimate Request
                </Button>
                <p className="text-2xs text-muted-foreground text-center">Demo only — no data is actually sent</p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Booking Modal ── */
function BookingModal({ card, open, onClose }: { card: { name: string; company: string; services: { name: string; duration: string }[] }; open: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ name: "", phone: "", service: "", date: "", time: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Booking requested!", { description: `${card.name} will confirm your appointment.` });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Book Appointment</h3>
                <p className="text-xs text-muted-foreground">with {card.name}</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-bold text-foreground mb-1">Booking Requested!</h4>
                <p className="text-sm text-muted-foreground mb-4">This is a demo — in a real card, {card.name} would receive this and confirm your slot.</p>
                <Button variant="outline" onClick={onClose}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <Input placeholder="Your name *" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <Input placeholder="Phone *" type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  required
                >
                  <option value="">Select a service *</option>
                  {card.services.map((s) => (
                    <option key={s.name} value={s.name}>{s.name} ({s.duration})</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  <Input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                </div>
                <Textarea placeholder="Any notes..." rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                <Button type="submit" className="w-full gap-2">
                  <Calendar className="h-4 w-4" /> Request Booking
                </Button>
                <p className="text-2xs text-muted-foreground text-center">Demo only — no booking is actually created</p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main Page ── */
export default function DemoCardPreview() {
  const { slug } = useParams();
  const card = getDemoCardBySlug(slug ?? "");
  const [showEstimate, setShowEstimate] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

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

  const handleCall = () => {
    window.location.href = `tel:${card.phone}`;
  };

  const handleText = () => {
    window.location.href = `sms:${card.phone}`;
  };

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
          className="mx-4 mt-4 rounded-2xl overflow-visible shadow-xl"
        >
          {/* Cover photo */}
          <div className="relative h-44 overflow-hidden rounded-t-2xl">
            <img
              src={card.coverUrl}
              alt={card.company}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>

          {/* Profile overlay */}
          <div className="relative bg-card px-5 pb-5 rounded-b-2xl overflow-visible">
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
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-5 gap-2 mx-4 mt-4">
          {[
            { icon: Phone, label: "Call", color: "hsl(142, 71%, 45%)", onClick: handleCall },
            { icon: MessageSquare, label: "Text", color: "hsl(217, 91%, 60%)", onClick: handleText },
            { icon: Calendar, label: "Book", color: card.accentColor, onClick: () => setShowBooking(true) },
            { icon: FileText, label: "Estimate", color: "hsl(25, 95%, 53%)", onClick: () => setShowEstimate(true) },
            { icon: Download, label: "Save", color: "hsl(262, 83%, 58%)", onClick: () => downloadVCard(card) },
          ].map((cta) => (
            <motion.button
              key={cta.label}
              variants={fade}
              onClick={cta.onClick}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.95] shadow-sm"
              whileTap={{ scale: 0.93 }}
            >
              <cta.icon className="h-5 w-5" style={{ color: cta.color }} />
              <span className="text-2xs font-medium text-foreground">{cta.label}</span>
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
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              {card.phone}
            </a>
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              {card.email}
            </a>
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
            <div className="relative p-6 text-center bg-foreground">
              <div className="absolute inset-0 opacity-80" style={{ background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}cc)` }} />
              <h3 className="relative text-lg font-bold text-white mb-2">Want a card like this?</h3>
              <p className="relative text-sm text-white/90 mb-4">Create your own guzzl.pro card in under 2 minutes — completely free.</p>
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
            Powered by <GuzzlLogo to={null} size="xs" />
          </Link>
        </div>
      </div>

      {/* Modals */}
      <EstimateModal card={card} open={showEstimate} onClose={() => setShowEstimate(false)} />
      <BookingModal card={card} open={showBooking} onClose={() => setShowBooking(false)} />
    </div>
  );
}
