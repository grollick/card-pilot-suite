import { useState } from "react";
import { Target, Users, CalendarCheck, Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GOALS = [
  { key: "leads", label: "Generate Leads", desc: "Focus on content that drives inquiries and form fills", icon: Target },
  { key: "bookings", label: "Get Bookings", desc: "Promote your services and drive appointment bookings", icon: CalendarCheck },
  { key: "awareness", label: "Build Awareness", desc: "Grow your brand presence and local reputation", icon: Users },
] as const;

const CONTENT_MIX = [
  { key: "promotions", label: "Promotions", desc: "Special offers & seasonal deals" },
  { key: "testimonials", label: "Testimonials", desc: "Client reviews & success stories" },
  { key: "before_after", label: "Before / After", desc: "Visual project transformations" },
  { key: "tips", label: "Pro Tips", desc: "Industry expertise & how-tos" },
];

const FREQUENCIES = [
  { key: "3x_week", label: "3x / week", desc: "Recommended" },
  { key: "5x_week", label: "5x / week", desc: "High volume" },
  { key: "daily", label: "Daily", desc: "Maximum growth" },
];

export type DFYConfig = {
  goal: string;
  contentTypes: string[];
  frequency: string;
};

interface Props {
  onComplete: (config: DFYConfig) => void;
  loading?: boolean;
}

export default function DFYSetupWizard({ onComplete, loading }: Props) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>(["promotions", "testimonials", "before_after", "tips"]);
  const [frequency, setFrequency] = useState("3x_week");

  const toggleContent = (key: string) => {
    setContentTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const canNext = step === 0 ? !!goal : step === 1 ? contentTypes.length > 0 : true;

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else onComplete({ goal, contentTypes, frequency });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors",
              i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < 2 && <div className={cn("h-0.5 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 && (
          <motion.div key="goal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-bold mb-1">What's your primary goal?</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll tailor your content strategy to match</p>
            <div className="space-y-3">
              {GOALS.map(g => (
                <button
                  key={g.key}
                  onClick={() => setGoal(g.key)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                    goal === g.key
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    goal === g.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <g.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{g.label}</p>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-bold mb-1">Content Strategy</h2>
            <p className="text-sm text-muted-foreground mb-6">Select the types of content to rotate</p>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_MIX.map(c => (
                <button
                  key={c.key}
                  onClick={() => toggleContent(c.key)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    contentTypes.includes(c.key)
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="freq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-bold mb-1">Posting Frequency</h2>
            <p className="text-sm text-muted-foreground mb-6">How often should we post for you?</p>
            <div className="space-y-3">
              {FREQUENCIES.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFrequency(f.key)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                    frequency === f.key
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <p className="text-sm font-semibold">{f.label}</p>
                  <span className="text-xs text-muted-foreground">{f.desc}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8">
        <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={!canNext || loading} onClick={handleNext} className="gap-1.5">
          {loading ? <Sparkles className="h-3.5 w-3.5 animate-spin" /> : null}
          {step === 2 ? "Activate Marketing" : "Next"}
          {step < 2 && <ArrowRight className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
