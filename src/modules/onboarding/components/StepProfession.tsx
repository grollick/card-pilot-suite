import { useState } from "react";
import { Search, ArrowRight, HardHat, Plus } from "lucide-react";
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
  onCustomProfession?: (name: string) => void;
}

export default function StepProfession({ professions, selectedId, onSelect, onNext, onCustomProfession }: Props) {
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");

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

  const handleCustomSubmit = () => {
    if (customName.trim() && onCustomProfession) {
      onCustomProfession(customName.trim());
    }
  };

  const isCustomReady = showCustom && customName.trim().length > 1;

  return (
    <OnboardingStepWrapper stepKey="profession">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HardHat className="h-5 w-5 text-primary" />
          What's your trade?
        </h2>
        <p className="text-sm text-muted-foreground">We'll customize your card, services, and pipeline</p>
      </div>

      {!showCustom ? (
        <>
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
                  onClick={() => { onSelect(p.id); setShowCustom(false); }}
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
            {filtered.length === 0 && search && (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">No matches for "{search}"</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCustomName(search); setShowCustom(true); }}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add "{search}" as your trade
                </Button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCustom(true)}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-all flex items-center gap-2 border border-dashed border-border"
          >
            <Plus className="h-4 w-4" />
            My trade isn't listed
          </button>

          <Button onClick={onNext} disabled={!selectedId} className="w-full">
            Continue <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Enter your trade or profession:</p>
          <Input
            placeholder="e.g. SaaS Founder, Dog Walker, DJ..."
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === "Enter" && isCustomReady && handleCustomSubmit()}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCustom(false)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleCustomSubmit} disabled={!isCustomReady} className="flex-1">
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </OnboardingStepWrapper>
  );
}
