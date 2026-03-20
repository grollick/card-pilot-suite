import { useState } from "react";
import { motion } from "framer-motion";
import {
  Hammer, Scissors, Home, Briefcase, Sparkles, ArrowRight, Check,
  Camera, Dumbbell, ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateOption {
  id: string;
  templateId: string;
  label: string;
  description: string;
  icon: typeof Hammer;
  color: string;
  sections: string[];
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "contractor",
    templateId: "contractor_template",
    label: "Contractor",
    description: "Quotes, gallery, testimonials & booking",
    icon: Hammer,
    color: "hsl(25, 95%, 53%)",
    sections: ["Hero", "Services", "Gallery", "Testimonials", "Quote Request"],
  },
  {
    id: "barber",
    templateId: "barber_template",
    label: "Barber / Salon",
    description: "Booking-first with style gallery",
    icon: Scissors,
    color: "hsl(262, 83%, 58%)",
    sections: ["Hero", "Booking", "Services", "Gallery", "Reviews"],
  },
  {
    id: "realtor",
    templateId: "realtor_template",
    label: "Realtor",
    description: "Contact-forward with trust signals",
    icon: Home,
    color: "hsl(199, 89%, 48%)",
    sections: ["Hero", "About", "Testimonials", "Booking", "Contact"],
  },
  {
    id: "photographer",
    templateId: "photographer_template",
    label: "Photographer",
    description: "Visual-first with large gallery",
    icon: Camera,
    color: "hsl(340, 82%, 52%)",
    sections: ["Hero", "Gallery", "Services", "Testimonials", "Booking"],
  },
  {
    id: "trainer",
    templateId: "booking_first",
    label: "Health & Wellness",
    description: "Appointments and services front & center",
    icon: Dumbbell,
    color: "hsl(142, 71%, 45%)",
    sections: ["Hero", "Booking", "Services", "Gallery", "About"],
  },
  {
    id: "general",
    templateId: "modern_professional",
    label: "General Business",
    description: "Clean and versatile for any industry",
    icon: Briefcase,
    color: "hsl(221, 83%, 53%)",
    sections: ["Hero", "About", "Services", "Testimonials", "Booking"],
  },
];

interface Props {
  onSelect: (templateId: string) => void;
  onSkip: () => void;
  professionName?: string;
}

export default function CardTemplateChooser({ onSelect, onSkip, professionName }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      const option = TEMPLATE_OPTIONS.find((o) => o.id === selected);
      if (option) onSelect(option.templateId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-y-auto">
      <div className="w-full max-w-3xl px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Quick Start
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ lineHeight: 1.15 }}>
            Choose a starting template
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Pick one that fits your business. Everything is fully customizable after.
          </p>
        </motion.div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {TEMPLATE_OPTIONS.map((option, i) => {
            const isSelected = selected === option.id;
            const Icon = option.icon;

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSelected(option.id)}
                className={`relative text-left rounded-xl border p-4 transition-all duration-200 active:scale-[0.97] ${
                  isSelected
                    ? "border-primary bg-primary/[0.04] shadow-md ring-1 ring-primary/20"
                    : "border-border/60 hover:border-border hover:shadow-sm bg-card"
                }`}
              >
                {/* Icon */}
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${option.color}14` }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: option.color }} />
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-0.5">{option.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{option.description}</p>

                {/* Section pills */}
                <div className="flex flex-wrap gap-1">
                  {option.sections.map((sec) => (
                    <span
                      key={sec}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
                    >
                      {sec}
                    </span>
                  ))}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            size="lg"
            className="gap-2 min-w-[200px]"
            disabled={!selected}
            onClick={handleContinue}
          >
            Use Template <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-muted-foreground"
            onClick={onSkip}
          >
            Start from scratch
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
