import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Check, Calendar, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, setHours, setMinutes, isBefore, isAfter } from "date-fns";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { usePublicBookingData } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function generateICS(
  name: string,
  service: string,
  start: Date,
  end: Date
): string {
  const pad = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${pad(start)}`,
    `DTEND:${pad(end)}`,
    `SUMMARY:${service} with ${name}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function PublicBooking() {
  const { handle } = useParams();
  const { data, isLoading, isError } = usePublicBookingData(handle);

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ start: Date; end: Date } | null>(null);

  const selectedService = data?.services.find((s) => s.id === selectedServiceId);

  // Compute available time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !data) return [];
    // day_of_week: 0=Mon .. 6=Sun in our DB
    const jsDay = selectedDate.getDay(); // 0=Sun
    const dbDay = jsDay === 0 ? 6 : jsDay - 1;
    const rule = data.availability.find((r) => r.day_of_week === dbDay);
    if (!rule) return [];

    const duration = selectedService?.duration_min ?? 30;
    const [startH, startM] = rule.start_time.split(":").map(Number);
    const [endH, endM] = rule.end_time.split(":").map(Number);

    const slots: string[] = [];
    let cursor = setMinutes(setHours(selectedDate, startH), startM);
    const dayEnd = setMinutes(setHours(selectedDate, endH), endM);
    const now = new Date();

    while (isBefore(cursor, dayEnd)) {
      const slotEnd = new Date(cursor.getTime() + duration * 60000);
      if (isAfter(slotEnd, dayEnd)) break;

      // Skip past times
      if (!isBefore(cursor, now) || !isBefore(selectedDate, now)) {
        // Check conflicts
        const hasConflict = data.existingBookings.some((b) => {
          const bStart = new Date(b.start_datetime);
          const bEnd = new Date(b.end_datetime);
          return cursor < bEnd && slotEnd > bStart;
        });
        if (!hasConflict) {
          slots.push(format(cursor, "h:mm a"));
        }
      }
      cursor = new Date(cursor.getTime() + 30 * 60000); // 30-min increments
    }
    return slots;
  }, [selectedDate, data, selectedService]);

  // Available days (next 30 days with availability rules)
  const availableDays = useMemo(() => {
    if (!data) return new Set<string>();
    const days = new Set<string>();
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = addDays(today, i);
      const jsDay = d.getDay();
      const dbDay = jsDay === 0 ? 6 : jsDay - 1;
      if (data.availability.some((r) => r.day_of_week === dbDay)) {
        days.add(format(d, "yyyy-MM-dd"));
      }
    }
    return days;
  }, [data]);

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !formData.name || !data) return;
    setSubmitting(true);

    try {
      // Parse time
      const [time, ampm] = selectedTime.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      const startDt = setMinutes(setHours(selectedDate, h), m);
      const endDt = new Date(startDt.getTime() + (selectedService.duration_min ?? 30) * 60000);

      // Visitor metadata for referral tracking
      const visitorMeta = {
        referrer: document.referrer || null,
        utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        user_agent: navigator.userAgent,
        capture_url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // Find first pipeline stage for auto-assignment
      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("user_id", data.profile.id)
        .order("sort_order", { ascending: true })
        .limit(1);
      const firstStageId = stages?.[0]?.id ?? null;

      // Create lead with pipeline stage + referral source
      const { data: lead } = await supabase
        .from("leads")
        .insert({
          user_id: data.profile.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          source: "booking" as const,
          stage_id: firstStageId,
          custom_fields_json: visitorMeta,
        })
        .select("id")
        .single();

      // Create booking
      await supabase.from("bookings").insert({
        user_id: data.profile.id,
        service_id: selectedService.id,
        lead_id: lead?.id ?? null,
        customer_name: formData.name,
        customer_email: formData.email || null,
        customer_phone: formData.phone || null,
        notes: formData.notes || null,
        start_datetime: startDt.toISOString(),
        end_datetime: endDt.toISOString(),
        status: "requested" as const,
      });

      // Track analytics
      await supabase.from("analytics_events").insert({
        user_id: data.profile.id,
        handle: handle!,
        event_type: "booking_created" as const,
        meta_json: { lead_id: lead?.id, service: selectedService.name, ...visitorMeta },
      });

      // Log activity on lead
      if (lead?.id) {
        await supabase.from("contact_activities").insert({
          user_id: data.profile.id,
          lead_id: lead.id,
          activity_type: "booking_created",
          title: `Booking requested: ${selectedService.name}`,
          description: `${format(startDt, "EEEE, MMMM d")} at ${selectedTime}`,
          occurred_at: new Date().toISOString(),
        });
      }

      setBookingResult({ start: startDt, end: endDt });
      setStep(4);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadICS = () => {
    if (!bookingResult || !selectedService || !data) return;
    const ics = generateICS(
      data.profile.name ?? handle ?? "",
      selectedService.name,
      bookingResult.start,
      bookingResult.end
    );
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "booking.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Booking page not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg">
          <div className="p-6 border-b border-border flex items-center gap-3">
            {step > 1 && step < 4 && (
              <button onClick={() => setStep((s) => s - 1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="font-bold">Book an Appointment</h1>
              <p className="text-xs text-muted-foreground">with {data.profile.name ?? `@${handle}`}</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`h-1.5 w-6 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Service */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <h2 className="font-semibold mb-3">Select a Service</h2>
                  {data.services.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No services available.</p>
                  ) : (
                    data.services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedServiceId(s.id); setStep(2); }}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedServiceId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <p className="font-medium text-sm">{s.name}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration_min} min</span>
                          {s.price != null ? (
                            <span className="font-medium text-foreground">${Number(s.price).toFixed(0)}</span>
                          ) : (
                            <span className="text-[hsl(var(--success))]">Free</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}

              {/* Step 2: Pick Date & Time */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-semibold">Pick a Date & Time</h2>
                  {availableDays.size === 0 ? (
                    <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-2">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium text-foreground">No availability set</p>
                      <p className="text-xs text-muted-foreground">
                        This person hasn't configured their available hours yet. Please check back later.
                      </p>
                    </div>
                  ) : (
                    <CalendarPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                      disabled={(date) => {
                        const key = format(date, "yyyy-MM-dd");
                        return !availableDays.has(key) || isBefore(date, addDays(new Date(), -1));
                      }}
                      className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
                    />
                  )}


                  {selectedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {format(selectedDate, "EEEE, MMMM d")} — {timeSlots.length} slots
                      </p>
                      {timeSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No available times. Try another day.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((t) => (
                            <button
                              key={t}
                              onClick={() => { setSelectedTime(t); setStep(3); }}
                              className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                                selectedTime === t
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Contact Info */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <h2 className="font-semibold">Your Information</h2>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1">
                    <p><span className="text-muted-foreground">Service:</span> {selectedService?.name}</p>
                    <p><span className="text-muted-foreground">Date:</span> {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                    <p><span className="text-muted-foreground">Time:</span> {selectedTime}</p>
                  </div>
                  <Input
                    placeholder="Full name *"
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Notes (optional)"
                    className="min-h-[60px]"
                    value={formData.notes}
                    onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  />
                  <Button
                    onClick={handleConfirm}
                    disabled={submitting || !formData.name}
                    className="w-full shadow-glow"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm Booking
                  </Button>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && bookingResult && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Booking Requested!</h2>
                    <p className="text-sm text-muted-foreground mt-1">You'll receive a confirmation once approved.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-sm text-left space-y-1">
                    <p><span className="text-muted-foreground">Service:</span> {selectedService?.name}</p>
                    <p><span className="text-muted-foreground">Date:</span> {format(bookingResult.start, "EEEE, MMMM d, yyyy")}</p>
                    <p><span className="text-muted-foreground">Time:</span> {format(bookingResult.start, "h:mm a")} – {format(bookingResult.end, "h:mm a")}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleDownloadICS}>
                    <Download className="h-4 w-4 mr-2" /> Add to Calendar (.ics)
                  </Button>
                  <Link to={`/${handle}`}>
                    <Button variant="ghost" className="w-full mt-1">Back to Card</Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
