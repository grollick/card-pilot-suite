import { ArrowLeft, ArrowRight, Plus, X, Wrench, Wand2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface AIService {
  name: string;
  description: string;
  duration_min: number;
  price_range: string;
}

interface Props {
  services: string[];
  onServicesChange: (s: string[]) => void;
  aiServices?: AIService[];
  professionName?: string;
  defaultServices?: any[];
  onNext: () => void;
  onBack: () => void;
}

export default function StepServices({ services, onServicesChange, aiServices, professionName, defaultServices, onNext, onBack }: Props) {
  const [newService, setNewService] = useState("");

  const addService = () => {
    const trimmed = newService.trim();
    if (trimmed && !services.includes(trimmed)) {
      onServicesChange([...services, trimmed]);
      setNewService("");
    }
  };

  const removeService = (idx: number) => {
    onServicesChange(services.filter((_, i) => i !== idx));
  };

  // AI suggestions that aren't added yet
  const unusedAI = aiServices?.filter(s => !services.includes(s.name)) || [];
  const unusedDefaults = (defaultServices || [])
    .map((s: any) => s.name)
    .filter((s: string) => !services.includes(s));

  return (
    <OnboardingStepWrapper stepKey="services">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Your services
        </h2>
        <p className="text-sm text-muted-foreground">
          {aiServices ? "AI-generated for you — edit or add more" : `Services for ${professionName || "your trade"}`}
        </p>
      </div>

      {/* Service chips */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {services.map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            {s}
            <button onClick={() => removeService(i)} className="hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No services added yet</p>
        )}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a service..."
          value={newService}
          onChange={e => setNewService(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addService()}
        />
        <Button variant="outline" size="icon" onClick={addService} disabled={!newService.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* AI suggestions */}
      {unusedAI.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Wand2 className="h-3 w-3" /> AI suggestions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unusedAI.map(s => (
              <button key={s.name} onClick={() => onServicesChange([...services, s.name])}
                className="px-2.5 py-1 rounded-full border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5 transition-colors">
                + {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fallback defaults */}
      {!aiServices && unusedDefaults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Suggested for {professionName}:</p>
          <div className="flex flex-wrap gap-1.5">
            {unusedDefaults.slice(0, 6).map((s: string) => (
              <button key={s} onClick={() => onServicesChange([...services, s])}
                className="px-2.5 py-1 rounded-full border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5 transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onNext} disabled={services.length === 0} className="flex-1">
          Continue <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </OnboardingStepWrapper>
  );
}
