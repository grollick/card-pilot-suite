import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useRecurringPlan, useCreateRecurringPlan, useUpdateRecurringPlan,
  usePausePlan, useResumePlan, useCancelPlan, useSkipNextService,
  FREQUENCY_LABELS, BILLING_CYCLE_LABELS, PLAN_STATUS_LABELS, PLAN_STATUS_COLORS,
  getScheduleSummary, calculateNextServiceDate,
  type RecurringFrequency, type RecurringBillingCycle, type RecurringPlanStatus,
} from "@/hooks/useRecurringPlans";
import { useContacts } from "@/hooks/useContacts";
import { useJobs } from "@/hooks/useJobs";
import { format, addWeeks, addMonths, addDays } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function RecurringPlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data: plan, isLoading } = useRecurringPlan(isNew ? undefined : id);
  const { data: contacts = [] } = useContacts();
  const { data: jobs = [] } = useJobs();

  const createPlan = useCreateRecurringPlan();
  const updatePlan = useUpdateRecurringPlan();
  const pausePlan = usePausePlan();
  const resumePlan = useResumePlan();
  const cancelPlan = useCancelPlan();
  const skipNext = useSkipNextService();

  const [leadId, setLeadId] = useState("");
  const [jobId, setJobId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [customDays, setCustomDays] = useState(30);
  const [preferredDay, setPreferredDay] = useState<number | undefined>(undefined);
  const [billingCycle, setBillingCycle] = useState<RecurringBillingCycle>("per_visit");
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (plan) {
      setLeadId(plan.lead_id || "");
      setJobId(plan.job_id || "");
      setServiceName(plan.service_name || "");
      setFrequency(plan.frequency || "monthly");
      setCustomDays(plan.custom_interval_days || 30);
      setPreferredDay(plan.preferred_day_of_week ?? undefined);
      setBillingCycle(plan.billing_cycle || "per_visit");
      setPrice(Number(plan.price));
      setStartDate(plan.start_date || "");
      setEndDate(plan.end_date || "");
      setNotes(plan.notes || "");
    }
  }, [plan]);

  // Pre-populate from job query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("job_id")) setJobId(params.get("job_id")!);
    if (params.get("lead_id")) setLeadId(params.get("lead_id")!);
    if (params.get("service")) setServiceName(params.get("service")!);
    if (params.get("price")) setPrice(Number(params.get("price")));
  }, []);

  const scheduleSummary = useMemo(() => {
    if (!startDate) return "";
    return getScheduleSummary(frequency, startDate, preferredDay, customDays);
  }, [frequency, startDate, preferredDay, customDays]);

  // Preview next 5 dates
  const previewDates = useMemo(() => {
    if (!startDate) return [];
    const dates: Date[] = [];
    let d = new Date(startDate);
    for (let i = 0; i < 5; i++) {
      dates.push(d);
      d = calculateNextServiceDate(frequency, d, customDays);
    }
    return dates;
  }, [frequency, startDate, customDays]);

  const handleSave = async () => {
    if (!serviceName) return;
    if (isNew) {
      await createPlan.mutateAsync({
        lead_id: leadId || null,
        job_id: jobId || null,
        service_name: serviceName,
        frequency,
        custom_interval_days: frequency === "custom" ? customDays : undefined,
        preferred_day_of_week: preferredDay,
        billing_cycle: billingCycle,
        price,
        start_date: startDate,
        end_date: endDate || undefined,
        notes: notes || undefined,
      });
      navigate("/app/recurring");
    } else {
      await updatePlan.mutateAsync({
        id: id!,
        lead_id: leadId || null,
        job_id: jobId || null,
        service_name: serviceName,
        frequency,
        custom_interval_days: frequency === "custom" ? customDays : null,
        preferred_day_of_week: preferredDay ?? null,
        billing_cycle: billingCycle,
        price,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes || null,
      });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/recurring")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {isNew ? "New Recurring Plan" : plan?.service_name}
            </h1>
            {!isNew && plan && (
              <Badge className={`text-[10px] mt-1 ${PLAN_STATUS_COLORS[plan.status as RecurringPlanStatus]}`}>
                {PLAN_STATUS_LABELS[plan.status as RecurringPlanStatus]}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && plan?.status === "active" && (
            <>
              <Button variant="outline" size="sm" onClick={() => pausePlan.mutate(id!)}>Pause</Button>
              <Button variant="outline" size="sm" onClick={() => skipNext.mutate(id!)}>Skip Next</Button>
            </>
          )}
          {!isNew && plan?.status === "paused" && (
            <Button variant="outline" size="sm" onClick={() => resumePlan.mutate(id!)}>Resume</Button>
          )}
          {!isNew && ["active", "paused"].includes(plan?.status) && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => { cancelPlan.mutate(id!); navigate("/app/recurring"); }}>Cancel</Button>
          )}
          <Button onClick={handleSave} disabled={createPlan.isPending || updatePlan.isPending || !serviceName}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      {/* Service Details */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Service Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Service Name *</Label>
            <Input placeholder="e.g., Weekly Lawn Mowing" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Customer</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Linked Job (optional)</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue placeholder="Link to job" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {jobs.map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>{j.job_number} — {j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Price per Service</Label>
            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {frequency === "custom" && (
              <div>
                <Label>Repeat Every (days)</Label>
                <Input type="number" min={1} value={customDays} onChange={(e) => setCustomDays(Number(e.target.value))} />
              </div>
            )}
            {["weekly", "biweekly"].includes(frequency) && (
              <div>
                <Label>Preferred Day</Label>
                <Select value={preferredDay?.toString()} onValueChange={(v) => setPreferredDay(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Any day" /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Schedule summary */}
          {scheduleSummary && (
            <div className="bg-muted/50 rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{scheduleSummary}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Upcoming dates:</p>
              <div className="flex flex-wrap gap-1.5">
                {previewDates.map((d, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(d, "MMM d, yyyy")}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Billing</CardTitle></CardHeader>
        <CardContent>
          <div>
            <Label>Billing Cycle</Label>
            <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as RecurringBillingCycle)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BILLING_CYCLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats (existing plan only) */}
      {!isNew && plan && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Plan Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{plan.visits_completed}</p>
                <p className="text-xs text-muted-foreground">Visits Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">${(Number(plan.price) * plan.visits_completed).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {plan.last_completed_at ? format(new Date(plan.last_completed_at), "MMM d, yyyy") : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Last Visit</p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {plan.next_service_date ? format(new Date(plan.next_service_date), "MMM d, yyyy") : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Next Visit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
