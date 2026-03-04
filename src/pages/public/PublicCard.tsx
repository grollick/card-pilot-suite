import { Phone, MessageSquare, Mail, Download, MapPin, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";

export default function PublicCard() {
  const { handle } = useParams();
  const [formSent, setFormSent] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg">
          {/* Header */}
          <div className="h-36 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent relative">
            <div className="absolute -bottom-12 left-6">
              <div className="h-24 w-24 rounded-2xl bg-card border-4 border-card shadow-card flex items-center justify-center text-2xl font-bold text-primary">
                {(handle || "U")[0].toUpperCase()}
              </div>
            </div>
          </div>

          <div className="px-6 pt-14 pb-6 space-y-6">
            {/* Name */}
            <div>
              <h1 className="text-xl font-bold">Your Name</h1>
              <p className="text-sm text-muted-foreground">Professional Title</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> Your City, ST</p>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button className="shadow-glow"><Phone className="h-4 w-4 mr-1.5" /> Call</Button>
              <Button variant="outline"><MessageSquare className="h-4 w-4 mr-1.5" /> Text</Button>
              <Button variant="outline"><Mail className="h-4 w-4 mr-1.5" /> Email</Button>
              <Button variant="outline"><Download className="h-4 w-4 mr-1.5" /> Save</Button>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About</h2>
              <p className="text-sm leading-relaxed">Passionate professional dedicated to delivering exceptional results. With years of experience, I help clients achieve their goals efficiently.</p>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Services</h2>
              <div className="space-y-2">
                {["Consultation", "Strategy Session", "Full Service"].map(s => (
                  <div key={s} className="p-3 rounded-xl border border-border/50 bg-muted/20 text-sm font-medium">{s}</div>
                ))}
              </div>
            </div>

            {/* Book Button */}
            <Link to={`/${handle}/book`}>
              <Button className="w-full shadow-glow" size="lg">Book an Appointment</Button>
            </Link>

            {/* Testimonials */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Testimonials</h2>
              <div className="p-4 rounded-xl border border-border/50 bg-muted/10">
                <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />)}</div>
                <p className="text-sm italic">"Absolutely amazing experience. Highly recommend!"</p>
                <p className="text-xs text-muted-foreground mt-2">— Happy Client</p>
              </div>
            </div>

            {/* Lead Capture */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Get in Touch</h2>
              {formSent ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-[hsl(var(--success))]/10 text-center">
                  <p className="text-sm font-medium text-[hsl(var(--success))]">Message sent! We'll be in touch.</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <Input placeholder="Your name" />
                  <Input placeholder="Phone number" />
                  <Input type="email" placeholder="Email" />
                  <Textarea placeholder="Message (optional)" className="min-h-[60px]" />
                  <Button onClick={() => setFormSent(true)} className="w-full"><Send className="h-4 w-4 mr-1.5" /> Send Message</Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-muted-foreground">Powered by <span className="font-semibold gradient-text">CardPilot</span></p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
