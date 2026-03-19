import { ArrowLeft, ArrowRight, Eye, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  name: string;
  company: string;
  phone: string;
  city: string;
  tagline?: string;
  services: string[];
  aiLoading: boolean;
  onNext: () => void;
  onBack: () => void;
}

const AI_MESSAGES = [
  "Generating your card...",
  "Crafting services & content...",
  "Building your digital presence...",
  "Almost ready!",
];

export default function StepCardPreview({ name, company, phone, city, tagline, services, aiLoading, onNext, onBack }: Props) {
  if (aiLoading) {
    return (
      <OnboardingStepWrapper stepKey="card-loading">
        <div className="text-center py-10 space-y-5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold">Building your card</h2>
            <p className="text-sm text-muted-foreground mt-1">AI is generating everything for you...</p>
          </div>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="h-2 w-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </OnboardingStepWrapper>
    );
  }

  return (
    <OnboardingStepWrapper stepKey="card-preview">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Your card preview
        </h2>
        <p className="text-sm text-muted-foreground">Here's what your digital card looks like</p>
      </div>

      {/* Mini card preview */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
        <div className="h-24 bg-gradient-to-br from-primary to-accent relative">
          <div className="absolute -bottom-7 left-4 h-14 w-14 rounded-full bg-card border-3 border-card flex items-center justify-center text-primary font-bold text-xl shadow-md">
            {name ? name[0].toUpperCase() : "?"}
          </div>
        </div>
        <div className="pt-10 px-4 pb-4 space-y-2">
          <div>
            <p className="font-bold text-base text-foreground">{name || "Your Name"}</p>
            {tagline && <p className="text-xs text-primary font-medium mt-0.5">{tagline}</p>}
            {company && <p className="text-sm text-muted-foreground">{company}</p>}
          </div>
          <div className="flex flex-wrap gap-1">
            {city && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">📍 {city}</span>
            )}
            {phone && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">📞 {phone}</span>
            )}
          </div>
          {services.length > 0 && (
            <div className="pt-2 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Services</p>
              <div className="flex flex-wrap gap-1">
                {services.slice(0, 4).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">{s}</span>
                ))}
                {services.length > 4 && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground">+{services.length - 4}</span>
                )}
              </div>
            </div>
          )}
          <div className="pt-2 flex gap-2">
            <span className="flex-1 text-center py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Get Estimate</span>
            <span className="flex-1 text-center py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold">Call Now</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">You can customize everything later in the card builder</p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </OnboardingStepWrapper>
  );
}
