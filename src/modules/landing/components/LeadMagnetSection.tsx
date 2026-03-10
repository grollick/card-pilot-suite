import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Download,
  Mail,
  CheckCircle2,
  Sparkles,
  Target,
  CalendarCheck,
  FileText,
  Megaphone,
  ArrowRight,
  User,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const TOOLKIT_ITEMS = [
  { icon: <Target className="h-5 w-5" />, title: "Lead Capture Strategies", desc: "Proven tactics to turn visitors into paying customers" },
  { icon: <CalendarCheck className="h-5 w-5" />, title: "Booking Best Practices", desc: "Fill your calendar with qualified appointments" },
  { icon: <FileText className="h-5 w-5" />, title: "Estimate Templates", desc: "Professional quote templates ready to customize" },
  { icon: <Megaphone className="h-5 w-5" />, title: "Local Marketing Tips", desc: "Grow your reputation in your community" },
];

const PROFESSIONS = [
  "Landscaper", "Electrician", "Plumber", "Painter", "Handyman",
  "Cleaner", "Photographer", "Personal Trainer", "Barber", "Other",
];

export default function LeadMagnetSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !profession) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Store lead in CRM via edge function
      await supabase.functions.invoke("lead-magnet-signup", {
        body: { name: name.trim(), email: email.trim(), profession },
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/30 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              {/* Left: Value proposition */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <BookOpen className="h-4 w-4" />
                  Free Resource
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  Free Toolkit: Get More Customers for Your Service Business
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Download a free toolkit designed to help service professionals capture more leads,
                  book more jobs, and grow their business — no signup required.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  {TOOLKIT_ITEMS.map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i, duration: 0.4 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> 100% free
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Instant access
                  </span>
                </div>
              </div>

              {/* Right: Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <form
                  onSubmit={handleSubmit}
                  className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-5"
                >
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Download className="h-5 w-5" />
                    <span className="font-semibold text-sm">Get Your Free Toolkit</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Gary Johnson"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="gary@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Your Profession</label>
                    <div className="relative">
                      <Select value={profession} onValueChange={setProfession} required>
                        <SelectTrigger className="w-full">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select your profession" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {PROFESSIONS.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full shadow-glow text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" /> Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" /> Get the Free Toolkit
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    We respect your privacy. Unsubscribe anytime.
                  </p>
                </form>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-lg mx-auto text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Your toolkit is on its way! 🎉
              </h3>

              <p className="text-muted-foreground text-lg">
                Check your inbox for the free toolkit. We've also included some bonus tips
                to help you get started.
              </p>

              <div className="pt-4">
                <Link to="/onboarding">
                  <Button size="lg" className="shadow-glow">
                    Create Your Smart Card Now <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                Skip the wait — start capturing leads today.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
