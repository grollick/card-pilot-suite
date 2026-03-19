import { useState } from "react";
import { Play, Pause, Plus, Trash2, ChevronRight, Mail, Clock, Zap, UserPlus, Eye, Settings2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useEmailSequences,
  useCreateSequence,
  useUpdateSequence,
  useDeleteSequence,
  useSequenceSteps,
  useCreateStep,
  useUpdateStep,
  useDeleteStep,
  useSequenceEnrollments,
  useRunSequenceProcessor,
} from "@/hooks/useEmailSequences";

const TRIGGERS = [
  { value: "signup", label: "User Signup", icon: UserPlus },
  { value: "incomplete_profile", label: "Incomplete Profile", icon: Settings2 },
  { value: "inactivity", label: "User Inactivity", icon: Clock },
  { value: "lead_activity", label: "Lead Activity", icon: Zap },
  { value: "beta_expiry", label: "Beta Expiry", icon: Clock },
  { value: "manual", label: "Manual", icon: Mail },
];

const STOP_CONDITIONS = [
  { value: "profile_complete", label: "Profile completed" },
  { value: "has_card", label: "Card published" },
  { value: "has_lead", label: "Has leads" },
  { value: "is_active", label: "User became active" },
  { value: "plan_upgraded", label: "Plan upgraded" },
];

const PRESET_SEQUENCES = [
  {
    name: "Welcome Flow",
    description: "Guide new users through setup",
    trigger: "signup",
    steps: [
      { subject: "Welcome to CardPilot, {{name}}! 🎉", body: "Hey {{name}},\n\nWelcome to CardPilot! We're thrilled to have you.\n\nYour first step: Create your digital business card. It takes less than 30 seconds.\n\n→ Log in and hit \"Create Card\" to get started.\n\nLet's make this your best business tool yet!", delay: 0 },
      { subject: "Did you create your card yet?", body: "Hey {{name}},\n\nJust checking in — have you created your digital business card yet?\n\nIt's the fastest way to start capturing leads and booking clients.\n\nHere's what you can do:\n• Share your card link anywhere\n• Capture leads automatically\n• Let clients book directly\n\n→ Create your card now — it's free!", delay: 24 },
      { subject: "Pro tip: Share your card to get leads", body: "Hey {{name}},\n\nHere's a quick win: Share your CardPilot link on your social media, email signature, or Google Business profile.\n\nEvery visitor becomes a potential lead — automatically tracked in your CRM.\n\nNeed help? Reply to this email and we'll guide you.", delay: 72 },
    ],
  },
  {
    name: "Activation Flow",
    description: "Push users to complete key actions",
    trigger: "incomplete_profile",
    steps: [
      { subject: "Complete your profile, {{name}}", body: "Hey {{name}},\n\nYou're almost there! Complete your profile to unlock the full power of CardPilot.\n\nWhat to do:\n1. Add your business name\n2. Set your services and pricing\n3. Publish your card\n\nPros who complete their profile get 3x more leads. Let's go! 💪", delay: 48 },
      { subject: "Your card is waiting to be published", body: "Hey {{name}},\n\nYou signed up for CardPilot but haven't published your card yet.\n\nA published card means:\n✅ Clients can find and book you\n✅ Leads are captured automatically\n✅ You look professional online\n\nIt takes 30 seconds. Let's do this!", delay: 96 },
    ],
  },
  {
    name: "Engagement Flow",
    description: "Re-engage inactive users",
    trigger: "inactivity",
    steps: [
      { subject: "We miss you, {{name}}!", body: "Hey {{name}},\n\nIt's been a while since you logged into CardPilot.\n\nWhile you were away, your competitors have been:\n• Capturing leads\n• Booking clients\n• Growing their business\n\nDon't fall behind. Log in today and check your dashboard.", delay: 0 },
      { subject: "Your leads are waiting", body: "Hey {{name}},\n\nQuick reminder: CardPilot is working for you even when you're not logged in.\n\nBut to make the most of it, you should:\n1. Check your new leads\n2. Follow up with prospects\n3. Send your first estimate\n\nOne new job can pay for months of growth. Let's make it happen!", delay: 72 },
    ],
  },
  {
    name: "Upgrade Flow",
    description: "Convert free users to Pro",
    trigger: "lead_activity",
    steps: [
      { subject: "You're outgrowing the free plan, {{name}}", body: "Hey {{name}},\n\nGreat news — you're getting traction on CardPilot! 🎉\n\nBut with the free plan, you're limited on:\n• Number of contacts\n• Services you can offer\n• Advanced features\n\nUpgrade to Pro and unlock:\n✅ Unlimited contacts\n✅ Unlimited services\n✅ Estimates & invoicing\n✅ AI tools\n\nOne new job pays for your entire month. Worth it? We think so.", delay: 0 },
      { subject: "Special: Upgrade to Pro today", body: "Hey {{name}},\n\nJust a friendly nudge — upgrading to Pro means you never hit a limit again.\n\nPro users close 3x more deals. The math speaks for itself.\n\n→ Upgrade now from your settings page.\n\nQuestions? Just reply to this email.", delay: 72 },
    ],
  },
  {
    name: "Beta Expiry Flow",
    description: "Notify beta users before access expires",
    trigger: "beta_expiry",
    steps: [
      { subject: "Your beta access expires soon, {{name}}", body: "Hey {{name}},\n\nHeads up — your beta access to CardPilot Pro features expires soon.\n\nTo keep everything you've built:\n• Your card and leads are safe\n• But Pro features will be locked\n• Upgrade to keep full access\n\nDon't lose momentum. Upgrade to Pro before your trial ends!", delay: 0 },
      { subject: "Last chance: Keep your Pro features", body: "Hey {{name}},\n\nThis is your final reminder — your beta access is about to expire.\n\nAfter expiry, you'll lose access to:\n❌ Unlimited contacts\n❌ Estimates & invoices\n❌ AI tools\n❌ Advanced analytics\n\nUpgrade now to keep everything. Your data is safe either way.", delay: 48 },
    ],
  },
];

export default function AdminEmailSequences() {
  const { data: sequences = [], isLoading } = useEmailSequences();
  const createSeq = useCreateSequence();
  const updateSeq = useUpdateSequence();
  const deleteSeq = useDeleteSequence();
  const runProcessor = useRunSequenceProcessor();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreatePreset = async (preset: typeof PRESET_SEQUENCES[number]) => {
    try {
      const result = await createSeq.mutateAsync({
        name: preset.name,
        description: preset.description,
        trigger_type: preset.trigger,
      });
      // We'll use the step creator inside the detail view
      toast.success(`Created "${preset.name}" — open it to add steps`);
      setSelectedId(result.id);
    } catch {
      toast.error("Failed to create sequence");
    }
  };

  if (selectedId) {
    return (
      <SequenceDetail
        sequenceId={selectedId}
        onBack={() => setSelectedId(null)}
        preset={PRESET_SEQUENCES.find((p) => sequences.find((s) => s.id === selectedId)?.name === p.name)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Email Sequences</h2>
          <p className="text-sm text-muted-foreground">Automated email flows triggered by user actions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => runProcessor.mutate("enroll_new_signups")} disabled={runProcessor.isPending}>
            {runProcessor.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
            Enroll Users
          </Button>
          <Button size="sm" variant="outline" onClick={() => runProcessor.mutate("check_stop_conditions")} disabled={runProcessor.isPending}>
            Check Stops
          </Button>
          <Button size="sm" onClick={() => runProcessor.mutate("process")} disabled={runProcessor.isPending}>
            {runProcessor.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            Process Queue
          </Button>
        </div>
      </div>

      {/* Preset templates */}
      {sequences.length === 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Start — Pre-built Sequences</CardTitle>
            <CardDescription>Click any to create it instantly</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_SEQUENCES.map((preset) => {
              const trigger = TRIGGERS.find((t) => t.value === preset.trigger);
              const Icon = trigger?.icon ?? Mail;
              return (
                <Card
                  key={preset.name}
                  className="cursor-pointer hover:shadow-card transition-shadow"
                  onClick={() => handleCreatePreset(preset)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{preset.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{preset.steps.length} steps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Existing sequences */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : sequences.length > 0 ? (
        <div className="space-y-3">
          {sequences.map((seq) => {
            const trigger = TRIGGERS.find((t) => t.value === seq.trigger_type);
            return (
              <Card key={seq.id} className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setSelectedId(seq.id)}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{seq.name}</p>
                      <p className="text-xs text-muted-foreground">{trigger?.label ?? seq.trigger_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={seq.status === "active" ? "default" : seq.status === "paused" ? "secondary" : "outline"}>
                      {seq.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add new */}
          <div className="flex gap-2 flex-wrap pt-2">
            {PRESET_SEQUENCES.filter((p) => !sequences.some((s) => s.name === p.name)).map((preset) => (
              <Button key={preset.name} size="sm" variant="outline" onClick={() => handleCreatePreset(preset)}>
                <Plus className="h-3 w-3 mr-1" />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Sequence Detail View ──
function SequenceDetail({ sequenceId, onBack, preset }: { sequenceId: string; onBack: () => void; preset?: typeof PRESET_SEQUENCES[number] }) {
  const { data: sequences = [] } = useEmailSequences();
  const sequence = sequences.find((s) => s.id === sequenceId);
  const { data: steps = [], isLoading: loadingSteps } = useSequenceSteps(sequenceId);
  const { data: enrollments = [] } = useSequenceEnrollments(sequenceId);
  const createStep = useCreateStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const updateSeq = useUpdateSequence();
  const deleteSeq = useDeleteSequence();
  const [editingStep, setEditingStep] = useState<string | null>(null);

  if (!sequence) return null;

  const handleToggleStatus = () => {
    const newStatus = sequence.status === "active" ? "paused" : "active";
    updateSeq.mutate({ id: sequenceId, status: newStatus });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this sequence and all its steps?")) return;
    await deleteSeq.mutateAsync(sequenceId);
    onBack();
  };

  const handleSeedSteps = async () => {
    if (!preset || steps.length > 0) return;
    for (let i = 0; i < preset.steps.length; i++) {
      await createStep.mutateAsync({
        sequence_id: sequenceId,
        step_number: i + 1,
        subject: preset.steps[i].subject,
        body: preset.steps[i].body,
        delay_hours: preset.steps[i].delay,
        stop_conditions: i === 0 ? [] : [{ type: "profile_complete" }],
      });
    }
  };

  const handleAddStep = async () => {
    const nextNum = steps.length > 0 ? Math.max(...steps.map((s) => s.step_number)) + 1 : 1;
    await createStep.mutateAsync({
      sequence_id: sequenceId,
      step_number: nextNum,
      subject: "New step",
      body: "Email content here...",
      delay_hours: 24,
    });
  };

  const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
  const completedEnrollments = enrollments.filter((e) => e.status === "completed").length;
  const cancelledEnrollments = enrollments.filter((e) => e.status === "cancelled").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onBack}>← Back</Button>
          <div>
            <h2 className="text-lg font-semibold">{sequence.name}</h2>
            <p className="text-xs text-muted-foreground">{sequence.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={sequence.status === "active" ? "default" : "secondary"}>{sequence.status}</Badge>
          <Button size="sm" variant={sequence.status === "active" ? "outline" : "default"} onClick={handleToggleStatus}>
            {sequence.status === "active" ? <><Pause className="h-3 w-3 mr-1" />Pause</> : <><Play className="h-3 w-3 mr-1" />Activate</>}
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{activeEnrollments}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{completedEnrollments}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{cancelledEnrollments}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Steps */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Steps ({steps.length})</CardTitle>
            <div className="flex gap-2">
              {preset && steps.length === 0 && (
                <Button size="sm" variant="outline" onClick={handleSeedSteps} disabled={createStep.isPending}>
                  {createStep.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                  Load Preset Steps
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleAddStep} disabled={createStep.isPending}>
                <Plus className="h-3 w-3 mr-1" /> Add Step
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSteps ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No steps yet. Add steps or load preset.</p>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <StepEditor
                  key={step.id}
                  step={step}
                  isEditing={editingStep === step.id}
                  onEdit={() => setEditingStep(editingStep === step.id ? null : step.id)}
                  onSave={(updates) => {
                    updateStep.mutate({ id: step.id, sequence_id: sequenceId, ...updates });
                    setEditingStep(null);
                  }}
                  onDelete={() => deleteStep.mutate({ id: step.id, sequence_id: sequenceId })}
                  onToggle={(enabled) => updateStep.mutate({ id: step.id, sequence_id: sequenceId, enabled })}
                  isLast={idx === steps.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Step Editor ──
function StepEditor({
  step,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onToggle,
  isLast,
}: {
  step: any;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: any) => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  isLast: boolean;
}) {
  const [subject, setSubject] = useState(step.subject);
  const [body, setBody] = useState(step.body);
  const [delayHours, setDelayHours] = useState(step.delay_hours);

  return (
    <div className={`border rounded-lg p-4 ${!step.enabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {step.step_number}
            </div>
            {!isLast && <div className="w-px h-4 bg-border mt-1" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{step.subject}</p>
            <p className="text-xs text-muted-foreground">
              {step.delay_hours === 0 ? "Immediately" : `After ${step.delay_hours}h`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={step.enabled} onCheckedChange={onToggle} />
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Delay (hours after previous step)</Label>
            <Input type="number" value={delayHours} onChange={(e) => setDelayHours(Number(e.target.value))} min={0} className="mt-1 w-32" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave({ subject, body, delay_hours: delayHours })}>Save</Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>Cancel</Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Variables: <code className="bg-muted px-1 rounded">{"{{name}}"}</code> <code className="bg-muted px-1 rounded">{"{{business}}"}</code> <code className="bg-muted px-1 rounded">{"{{booking_link}}"}</code>
          </div>
        </div>
      )}
    </div>
  );
}
