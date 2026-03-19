import { useState } from "react";
import { Search, ArrowRight, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Profession {
  id: string;
  name: string;
  category: string;
  default_card_sections: any;
  default_pipeline_stages: any;
  default_booking_services: any;
  default_email_templates: any;
}

const CONTRACTOR_PROFESSIONS = [
  "General Contractor",
  "Electrician",
  "Plumber",
  "Landscaper",
  "HVAC Technician",
  "Roofer",
  "Painter",
  "Cleaning Service",
];

interface Props {
  professions: Profession[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export default function StepProfession({ professions, selectedId, onSelect, onNext }: Props) {
  const [search, setSearch] = useState("");

  // Prioritize contractor professions, then show all
  const contractorProfs = professions.filter(p =>
    CONTRACTOR_PROFESSIONS.includes(p.name)
  );
  const otherProfs = professions.filter(p =>
    !CONTRACTOR_PROFESSIONS.includes(p.name)
  );

  const allProfs = [...contractorProfs, ...otherProfs];
  const filtered = search
    ? allProfs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : allProfs;

  return (
    <OnboardingStepWrapper stepKey="profession">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HardHat className="h-5 w-5 text-primary" />
          What's your trade?
        </h2>
        <p className="text-sm text-muted-foreground">We'll customize your card, services, and pipeline</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search professions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {!search && contractorProfs.length > 0 && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 mt-1">Popular Trades</p>
        )}
        {filtered.map((p, i) => (
          <div key={p.id}>
            {!search && i === contractorProfs.length && contractorProfs.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 mt-3">All Professions</p>
            )}
            <button
              onClick={() => onSelect(p.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedId === p.id
                  ? "bg-primary/10 text-primary font-medium border border-primary/20"
                  : "hover:bg-muted"
              }`}
            >
              {p.name}
            </button>
          </div>
        ))}
      </div>

      <Button onClick={onNext} disabled={!selectedId} className="w-full">
        Continue <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </OnboardingStepWrapper>
  );
}
