import { ArrowLeft, ArrowRight, Phone, Mail, MapPin, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  phone: string;
  email: string;
  city: string;
  services: string[];
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onServicesChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepContactDetails({
  phone, email, city, services,
  onPhoneChange, onEmailChange, onCityChange, onServicesChange,
  onNext, onBack,
}: Props) {
  const addService = (name: string) => {
    if (name.trim() && !services.includes(name.trim())) {
      onServicesChange([...services, name.trim()]);
    }
  };

  const removeService = (idx: number) => {
    onServicesChange(services.filter((_, i) => i !== idx));
  };

  return (
    <OnboardingStepWrapper stepKey="contact-details">
      <div className="text-center space-y-1">
        <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center bg-primary/10 mb-2">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          How can clients reach you?
        </h2>
        <p className="text-sm text-muted-foreground">
          Add your contact info so customers can connect
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="h-12 text-base pl-10"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="h-12 text-base pl-10"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="City / Service area"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="h-12 text-base pl-10"
          />
        </div>

        {/* Services */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-primary" />
            Services you offer
          </label>
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {services.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  {s}
                  <button
                    onClick={() => removeService(i)}
                    className="ml-0.5 text-primary/50 hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <Input
            placeholder="Type a service and press Enter"
            className="h-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addService((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {services.length === 0 ? "Pre-filled from your profession — add more or skip" : `${services.length} service${services.length !== 1 ? "s" : ""} added`}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        All fields are optional — you can add them later
      </p>
    </OnboardingStepWrapper>
  );
}
