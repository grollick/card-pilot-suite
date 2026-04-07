import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  bookingEnabled: boolean;
  onToggleBooking: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepBookingSetup({ bookingEnabled, onToggleBooking, onNext, onBack }: Props) {
  return (
    <OnboardingStepWrapper stepKey="booking-setup">
      <div className="text-center space-y-1">
        <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center bg-primary/10 mb-2">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Let clients book you instantly
        </h2>
        <p className="text-sm text-muted-foreground">
          Add booking to your card so customers can schedule with you directly
        </p>
      </div>

      {/* Preview of booking benefit */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Instant Scheduling</p>
              <p className="text-xs text-muted-foreground">Clients pick a time that works for both of you</p>
            </div>
          </div>

          {/* Mini booking preview */}
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
            <div className="flex gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                <div
                  key={day}
                  className="flex-1 text-center py-1.5 rounded-md bg-background border border-border text-[11px] font-medium text-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              {["9:00 AM", "10:30 AM", "2:00 PM"].map((time) => (
                <span
                  key={time}
                  className="flex-1 text-center py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium"
                >
                  {time}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <motion.button
        onClick={() => onToggleBooking(!bookingEnabled)}
        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
          bookingEnabled
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/30"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
          bookingEnabled ? "bg-primary" : "bg-muted"
        }`}>
          {bookingEnabled && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
            </motion.div>
          )}
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold text-foreground">
            {bookingEnabled ? "Booking enabled ✓" : "Enable booking on my card"}
          </p>
          <p className="text-xs text-muted-foreground">
            {bookingEnabled ? "Clients can schedule with you" : "You can customize hours later"}
          </p>
        </div>
      </motion.button>

      {/* Social proof */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-primary/80">Pros with booking enabled get 3× more conversions</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          {bookingEnabled ? "Continue" : "Skip for now"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </OnboardingStepWrapper>
  );
}
