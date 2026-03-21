import { ArrowLeft, ArrowRight, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  businessName: string;
  externalUrl: string;
  onBusinessNameChange: (v: string) => void;
  onExternalUrlChange: (v: string) => void;
  onGenerate: () => void;
  onBack: () => void;
}

export default function StepAutoBuild({
  businessName,
  externalUrl,
  onBusinessNameChange,
  onExternalUrlChange,
  onGenerate,
  onBack,
}: Props) {
  const canGenerate = businessName.trim().length > 1;

  return (
    <OnboardingStepWrapper stepKey="auto-build">
      <div className="text-center space-y-1">
        <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center bg-primary/10 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Build Your Card Instantly
        </h2>
        <p className="text-sm text-muted-foreground">
          Just your business name — AI creates everything else
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Business Name *
          </label>
          <Input
            placeholder="e.g. Gary's Landscaping"
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            className="h-12 text-base"
            maxLength={80}
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Website or Social Link
            <span className="text-muted-foreground font-normal ml-1">(optional)</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="https://yourbusiness.com"
              value={externalUrl}
              onChange={(e) => onExternalUrlChange(e.target.value)}
              className="h-12 text-base pl-10"
              maxLength={200}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            We'll import your content and services automatically
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onGenerate} disabled={!canGenerate} className="flex-1 gap-1.5">
          Generate My Card <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    </OnboardingStepWrapper>
  );
}
