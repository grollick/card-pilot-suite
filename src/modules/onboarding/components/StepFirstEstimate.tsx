import { useState } from "react";
import { ArrowLeft, ArrowRight, FileText, Send, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  services: string[];
  aiServices?: { name: string; price_range: string }[];
  onCreateEstimate: (data: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceName: string;
    price: number;
    sendNow: boolean;
  }) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepFirstEstimate({ services, aiServices, onCreateEstimate, onSkip, onBack, saving }: Props) {
  const firstService = services[0] || "General Service";
  const aiSvc = aiServices?.find(s => s.name === firstService);
  
  // Parse a default price from price_range like "$50-$100" or "From $75"
  const parseDefaultPrice = (range?: string): number => {
    if (!range) return 250;
    const match = range.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(",", ""), 10) : 250;
  };

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceName, setServiceName] = useState(firstService);
  const [price, setPrice] = useState(parseDefaultPrice(aiSvc?.price_range).toString());

  const handleSend = async (sendNow: boolean) => {
    await onCreateEstimate({
      clientName,
      clientEmail,
      clientPhone,
      serviceName,
      price: parseFloat(price) || 0,
      sendNow,
    });
  };

  return (
    <OnboardingStepWrapper stepKey="first-estimate">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Send your first estimate
        </h2>
        <p className="text-sm text-muted-foreground">
          This is how you start earning — create a real estimate now
        </p>
      </div>

      {/* Estimate form - streamlined */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <DollarSign className="h-3.5 w-3.5" />
          Quick Estimate
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Client name"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Email"
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
            />
            <Input
              placeholder="Phone"
              type="tel"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Service</label>
          <select
            value={serviceName}
            onChange={e => setServiceName(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {services.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="text-lg font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => handleSend(true)}
          disabled={saving || !clientName || (!clientEmail && !clientPhone)}
          className="w-full gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" /> Send Estimate Now
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleSend(false)}
            disabled={saving}
            className="text-xs"
          >
            Save as Draft
          </Button>
          <Button variant="ghost" onClick={onSkip} className="text-xs text-muted-foreground">
            Skip for now
          </Button>
        </div>
      </div>

      <Button variant="outline" onClick={onBack} size="sm" className="w-full">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
    </OnboardingStepWrapper>
  );
}
