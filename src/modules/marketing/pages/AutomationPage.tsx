import { useEffect, useState } from "react";
import { Zap, Plus, ArrowRight, Trash2, Edit2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import {
  useAutomationRules, useEnsureDefaultRules, useToggleRule,
  useCreateRule, useUpdateRule, useDeleteRule,
  TRIGGER_TYPES, ACTION_TYPES, TASK_TYPES, PRIORITIES,
  type AutomationRule,
} from "@/hooks/useAutomation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const triggerLabel = (t: string) => TRIGGER_TYPES.find(x => x.value === t)?.label ?? t;
const actionLabel = (a: string) => ACTION_TYPES.find(x => x.value === a)?.label ?? a;

export default function AutomationPage() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const ensureDefaults = useEnsureDefaultRules();
  const toggleRule = useToggleRule();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates-list"],
    queryFn: async () => {
      const { data } = await supabase.from("email_templates").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["pipeline-stages-list"],
    queryFn: async () => {
      const { data } = await supabase.from("pipeline_stages").select("id, name").order("sort_order");
      return data ?? [];
    },
  });

  // Seed defaults on first visit
  useEffect(() => {
    if (!isLoading && rules.length === 0) {
      ensureDefaults.mutate();
    }
  }, [isLoading, rules.length]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState("new_lead");
  const [actionType, setActionType] = useState("create_task");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({
    title: "Follow up with {name}",
    type: "follow_up",
    priority: "medium",
    due_offset_hours: 24,
  });

  const resetForm = () => {
    setEditId(null);
    setTriggerType("new_lead");
    setActionType("create_task");
    setTriggerConfig({});
    setActionConfig({ title: "Follow up with {name}", type: "follow_up", priority: "medium", due_offset_hours: 24 });
  };

  const openEdit = (rule: AutomationRule) => {
    setEditId(rule.id);
    setTriggerType(rule.trigger_type);
    setActionType(rule.action_type);
    setTriggerConfig(rule.trigger_config);
    setActionConfig(rule.action_config);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { trigger_type: triggerType, trigger_config: triggerConfig, action_type: actionType, action_config: actionConfig, enabled: true };
      if (editId) {
        await updateRule.mutateAsync({ id: editId, ...payload });
        toast.success("Rule updated");
      } else {
        await createRule.mutateAsync(payload);
        toast.success("Rule created");
      }
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success("Rule deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground text-sm mt-1">Set triggers to automate follow-ups, emails, and tasks</p>
        </div>
        <Button className="shadow-glow" onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : rules.length === 0 ? (
        <EmptyState icon={Zap} title="No automations" description="Create rules to automate repetitive tasks." />
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className={`rounded-xl border bg-card p-5 group transition-all ${rule.enabled ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${rule.enabled ? "bg-primary/10" : "bg-muted"}`}>
                    <Zap className={`h-5 w-5 ${rule.enabled ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{triggerLabel(rule.trigger_type)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{actionLabel(rule.action_type)}</span>
                    </div>
                    <p className="text-sm mt-1 truncate">
                      {(rule.action_config as any).title || "Untitled action"}
                      {rule.trigger_type === "stage_changed" && (rule.trigger_config as any).to_stage_name_contains && (
                        <span className="text-muted-foreground"> · when stage contains "{(rule.trigger_config as any).to_stage_name_contains}"</span>
                      )}
                      {rule.trigger_type === "lead_idle" && (rule.trigger_config as any).idle_days && (
                        <span className="text-muted-foreground"> · after {(rule.trigger_config as any).idle_days} days</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={rule.enabled} onCheckedChange={val => toggleRule.mutate({ id: rule.id, enabled: val })} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(rule)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Rule" : "New Automation Rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Trigger */}
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">When this happens…</Label>
              <Select value={triggerType} onValueChange={v => { setTriggerType(v); setTriggerConfig({}); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {triggerType === "stage_changed" && (
                <div className="mt-2">
                  <Label className="text-xs">Stage name contains</Label>
                  <Input value={triggerConfig.to_stage_name_contains ?? ""} onChange={e => setTriggerConfig({ ...triggerConfig, to_stage_name_contains: e.target.value })}
                    placeholder="e.g. qualified" className="mt-1" />
                  <p className="text-[10px] text-muted-foreground mt-1">Leave empty to match any stage change</p>
                </div>
              )}

              {triggerType === "lead_idle" && (
                <div className="mt-2">
                  <Label className="text-xs">Idle days</Label>
                  <Input type="number" min={1} value={triggerConfig.idle_days ?? 7} onChange={e => setTriggerConfig({ ...triggerConfig, idle_days: parseInt(e.target.value) || 7 })}
                    className="mt-1 w-24" />
                </div>
              )}
            </div>

            {/* Action */}
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Do this…</Label>
              <Select value={actionType} onValueChange={v => {
                setActionType(v);
                const defaults: Record<string, Record<string, any>> = {
                  create_task: { title: "Follow up with {name}", type: "follow_up", priority: "medium", due_offset_hours: 24 },
                  send_email: { title: "Send email to {name}", template_id: "" },
                  log_activity: { title: "Log activity for {name}", activity_type: "note", description: "" },
                  move_stage: { title: "Move {name} to next stage", target_stage_id: "" },
                  send_notification: { title: "Reminder about {name}", message: "" },
                };
                setActionConfig(defaults[v] ?? { title: "" });
              }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Action config fields */}
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="text-xs">Title / description</Label>
                  <Input value={actionConfig.title ?? ""} onChange={e => setActionConfig({ ...actionConfig, title: e.target.value })}
                    placeholder="Use {name} for contact name" className="mt-1" />
                </div>

                {actionType === "create_task" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Task type</Label>
                      <Select value={actionConfig.type ?? "follow_up"} onValueChange={v => setActionConfig({ ...actionConfig, type: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Priority</Label>
                      <Select value={actionConfig.priority ?? "medium"} onValueChange={v => setActionConfig({ ...actionConfig, priority: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Due in (hours)</Label>
                      <Input type="number" min={0} value={actionConfig.due_offset_hours ?? 24} onChange={e => setActionConfig({ ...actionConfig, due_offset_hours: parseInt(e.target.value) || 0 })}
                        className="mt-1" />
                    </div>
                  </div>
                )}

                {actionType === "send_email" && (
                  <div>
                    <Label className="text-xs">Email template</Label>
                    <Select value={actionConfig.template_id ?? ""} onValueChange={v => setActionConfig({ ...actionConfig, template_id: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select template" /></SelectTrigger>
                      <SelectContent>
                        {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        {templates.length === 0 && <SelectItem value="" disabled>No templates created yet</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "log_activity" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Activity type</Label>
                      <Select value={actionConfig.activity_type ?? "note"} onValueChange={v => setActionConfig({ ...actionConfig, activity_type: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["note", "call", "email", "meeting", "text"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Input value={actionConfig.description ?? ""} onChange={e => setActionConfig({ ...actionConfig, description: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                )}

                {actionType === "move_stage" && (
                  <div>
                    <Label className="text-xs">Target stage</Label>
                    <Select value={actionConfig.target_stage_id ?? ""} onValueChange={v => setActionConfig({ ...actionConfig, target_stage_id: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>
                        {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        {stages.length === 0 && <SelectItem value="" disabled>No stages created yet</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "send_notification" && (
                  <div>
                    <Label className="text-xs">Notification message</Label>
                    <Input value={actionConfig.message ?? ""} onChange={e => setActionConfig({ ...actionConfig, message: e.target.value })}
                      placeholder="Custom message (optional)" className="mt-1" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createRule.isPending || updateRule.isPending}>
              {editId ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
