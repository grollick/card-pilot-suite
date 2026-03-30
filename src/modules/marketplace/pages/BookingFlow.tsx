import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Check, Calendar, Clock, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getBusinessBySlug, type MockService } from "../data/mockData";

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

type Step = "service" | "date" | "time" | "info" | "confirmed";

export default function BookingFlow() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const biz = getBusinessBySlug(slug || "");

  const preselectedService = searchParams.get("service");

  const [step, setStep] = useState<Step>(preselectedService ? "date" : "service");
  const [selectedService, setSelectedService] = useState<string | null>(preselectedService);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [info, setInfo] = useState({ name: "", email: "", phone: "", notes: "" });

  const service = useMemo(() => biz?.services.find((s) => s.id === selectedService), [biz, selectedService]);

  if (!biz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Business not found.</p>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!info.name.trim()) { toast.error("Please enter your name."); return; }
    setStep("confirmed");
  };

  const steps: { key: Step; label: string }[] = [
    { key: "service", label: "Service" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "info", label: "Details" },
  ];

  const activeIdx = steps.findIndex((s) => s.key === step);

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Helmet><title>Booking Confirmed | guzzl.pro</title></Helmet>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">You're booked!</h1>
          <p className="text-muted-foreground mb-6">
            Your booking with <strong>{biz.business_name}</strong> has been confirmed.
          </p>
          <div className="rounded-xl border border-border bg-card p-5 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{service?.title}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{selectedDate?.toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTime}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{info.name}</span></div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate(`/marketplace/${biz.slug}`)}>View Provider</Button>
            <Button variant="outline" onClick={() => navigate(`/marketplace/${biz.slug}/post-booking`)}>
              Leave a Review <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => navigate("/marketplace")}>Explore More Services</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Book {biz.business_name} | guzzl.pro</title></Helmet>
      <div className="max-w-lg mx-auto px-4 py-6">
        <button onClick={() => navigate(`/marketplace/${biz.slug}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to {biz.business_name}
        </button>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "h-1.5 rounded-full flex-1 transition-colors",
                i <= activeIdx ? "bg-primary" : "bg-muted"
              )} />
            </div>
          ))}
        </div>

        {/* Step: Service */}
        {step === "service" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Select a service</h2>
            <div className="space-y-3">
              {biz.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s.id); setStep("date"); }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selectedService === s.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-foreground">{s.title}</span>
                    <span className="text-sm font-semibold text-primary">
                      {s.price_type === "fixed" ? `$${s.price_amount}` : s.price_type === "starting_at" ? `From $${s.price_amount}` : "Quote"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Date */}
        {step === "date" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Pick a date</h2>
            <div className="flex justify-center">
              <CalendarWidget
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); if (d) setStep("time"); }}
                disabled={(d) => d < new Date()}
                className="p-3 pointer-events-auto rounded-xl border border-border"
              />
            </div>
            <Button variant="ghost" className="mt-4" onClick={() => setStep("service")}>← Back</Button>
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Select a time</h2>
            <p className="text-sm text-muted-foreground mb-4">{selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => { setSelectedTime(t); setStep("info"); }}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    selectedTime === t ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:border-primary/30 text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="mt-4" onClick={() => setStep("date")}>← Back</Button>
          </div>
        )}

        {/* Step: Info */}
        {step === "info" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Your details</h2>
            <div className="space-y-3">
              <Input placeholder="Full name *" required value={info.name} onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))} />
              <Input type="email" placeholder="Email" value={info.email} onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))} />
              <Input type="tel" placeholder="Phone" value={info.phone} onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))} />
              <Textarea placeholder="Notes (optional)" rows={3} value={info.notes} onChange={(e) => setInfo((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="ghost" onClick={() => setStep("time")}>← Back</Button>
              <Button className="flex-1" onClick={handleConfirm}>Confirm Booking</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
