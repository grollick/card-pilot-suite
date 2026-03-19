import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  name: string;
  company: string;
  phone: string;
  city: string;
  onNameChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepBusinessInfo(props: Props) {
  const { name, company, phone, city, onNameChange, onCompanyChange, onPhoneChange, onCityChange, onNext, onBack } = props;

  return (
    <OnboardingStepWrapper stepKey="business-info">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Business basics
        </h2>
        <p className="text-sm text-muted-foreground">Quick info for your card — takes 30 seconds</p>
      </div>

      <div className="space-y-3">
        <Input placeholder="Your name *" value={name} onChange={e => onNameChange(e.target.value)} />
        <Input placeholder="Business name *" value={company} onChange={e => onCompanyChange(e.target.value)} />
        <Input placeholder="Phone number" type="tel" value={phone} onChange={e => onPhoneChange(e.target.value)} />
        <Input placeholder="City / Service area" value={city} onChange={e => onCityChange(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onNext} disabled={!name || !company} className="flex-1">
          Continue <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </OnboardingStepWrapper>
  );
}
