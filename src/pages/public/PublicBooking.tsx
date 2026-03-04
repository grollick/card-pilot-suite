import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Check, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

const services = [
  { id: 1, name: "Free Consultation", duration: 30, price: null, description: "Discuss your needs" },
  { id: 2, name: "Strategy Session", duration: 60, price: 150, description: "In-depth strategy" },
  { id: 3, name: "Follow-Up", duration: 30, price: 75, description: "Follow-up meeting" },
];

const timeSlots = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];

export default function PublicBooking() {
  const { handle } = useParams();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg">
          <div className="p-6 border-b border-border flex items-center gap-3">
            {step > 1 && step < 4 && (
              <button onClick={() => setStep(s => s - 1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="font-bold">Book an Appointment</h1>
              <p className="text-xs text-muted-foreground">with @{handle}</p>
            </div>
            <div className="flex gap-1">
              {[1,2,3,4].map(s => (
                <div key={s} className={`h-1.5 w-6 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <h2 className="font-semibold mb-3">Select a Service</h2>
                  {services.map(s => (
                    <button key={s.id} onClick={() => { setSelectedService(s.id); setStep(2); }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedService === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration} min</span>
                        {s.price && <span className="font-medium text-foreground">${s.price}</span>}
                        {!s.price && <span className="text-[hsl(var(--success))]">Free</span>}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-semibold">Pick a Time</h2>
                  <p className="text-sm text-muted-foreground">Available times for today</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(t => (
                      <button key={t} onClick={() => { setSelectedTime(t); setStep(3); }}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${selectedTime === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <h2 className="font-semibold">Your Information</h2>
                  <Input placeholder="Full name" />
                  <Input type="email" placeholder="Email" />
                  <Input placeholder="Phone number" />
                  <Textarea placeholder="Notes (optional)" className="min-h-[60px]" />
                  <Button onClick={() => setStep(4)} className="w-full shadow-glow">Confirm Booking</Button>
                </motion.div>
              )}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Booking Confirmed!</h2>
                    <p className="text-sm text-muted-foreground mt-1">You'll receive a confirmation email shortly.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-sm text-left space-y-1">
                    <p><span className="text-muted-foreground">Service:</span> {services.find(s => s.id === selectedService)?.name}</p>
                    <p><span className="text-muted-foreground">Time:</span> {selectedTime}</p>
                  </div>
                  <Button variant="outline" className="w-full"><Download className="h-4 w-4 mr-2" /> Add to Calendar (.ics)</Button>
                  <Link to={`/${handle}`}><Button variant="ghost" className="w-full mt-1">Back to Card</Button></Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
