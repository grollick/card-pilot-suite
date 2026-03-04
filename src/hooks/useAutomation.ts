import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addHours } from "date-fns";

export interface AutomationRule {
  id: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  enabled: boolean;
  created_at?: string;
}

// ── Trigger / Action definitions ──
export const TRIGGER_TYPES = [
  { value: "new_lead", label: "New contact created" },
  { value: "booking_created", label: "Booking created" },
  { value: "booking_completed", label: "Booking completed" },
  { value: "stage_changed", label: "Pipeline stage changed" },
  { value: "lead_idle", label: "Contact idle for X days" },
] as const;

export const ACTION_TYPES = [
  { value: "create_task", label: "Create a task" },
  { value: "send_email", label: "Send email template" },
  { value: "log_activity", label: "Log an activity" },
  { value: "move_stage", label: "Move pipeline stage" },
  { value: "send_notification", label: "Send notification" },
] as const;

export const TASK_TYPES = ["follow_up", "call", "email", "meeting", "reminder"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

const DEFAULT_RULES: Omit<AutomationRule, "id">[] = [
  {
    trigger_type: "new_lead",
    trigger_config: {},
    action_type: "create_task",
    action_config: { title: "Follow up with {name}", type: "follow_up", priority: "high", due_offset_hours: 24 },
    enabled: true,
  },
  {
    trigger_type: "booking_created",
    trigger_config: {},
    action_type: "create_task",
    action_config: { title: "Prep for booking with {name}", type: "meeting", priority: "medium", due_before_hours: 2 },
    enabled: true,
  },
  {
    trigger_type: "booking_completed",
    trigger_config: {},
    action_type: "create_task",
    action_config: { title: "Send follow-up to {name}", type: "follow_up", priority: "medium", due_offset_hours: 24 },
    enabled: true,
  },
  {
    trigger_type: "stage_changed",
    trigger_config: { to_stage_name_contains: "" },
    action_type: "create_task",
    action_config: { title: "Send next steps email to {name}", type: "email", priority: "high", due_offset_hours: 0 },
    enabled: true,
  },
  {
    trigger_type: "lead_idle",
    trigger_config: { idle_days: 7 },
    action_type: "create_task",
    action_config: { title: "Follow up with {name} (idle)", type: "follow_up", priority: "medium", due_offset_hours: 0 },
    enabled: true,
  },
];

// ── Queries & Mutations ──
export function useAutomationRules() {
  return useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AutomationRule[];
    },
  });
}

export function useEnsureDefaultRules() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { data: existing } = await supabase
        .from("automation_rules")
        .select("trigger_type, action_type")
        .eq("user_id", user.id);

      const existingKeys = new Set((existing ?? []).map((r: any) => `${r.trigger_type}:${r.action_type}`));
      const missing = DEFAULT_RULES.filter(r => !existingKeys.has(`${r.trigger_type}:${r.action_type}`));

      if (missing.length > 0) {
        await supabase.from("automation_rules").insert(
          missing.map(r => ({ ...r, user_id: user.id }))
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
}

export function useCreateRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<AutomationRule, "id">) => {
      const { error } = await supabase.from("automation_rules").insert({ ...rule, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationRule> & { id: string }) => {
      const { error } = await supabase.from("automation_rules").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
}

/**
 * Run automation rules client-side after a trigger event.
 */
export async function runAutomation(
  userId: string,
  triggerType: string,
  context: {
    contactId: string;
    contactName: string;
    bookingStartAt?: string;
    toStageName?: string;
  }
) {
  const { data: rules } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("trigger_type", triggerType)
    .eq("enabled", true);

  if (!rules || rules.length === 0) return;

  for (const rule of rules) {
    const config = rule.action_config as Record<string, any>;
    const triggerConfig = rule.trigger_config as Record<string, any>;

    // Check trigger conditions
    if (triggerType === "stage_changed" && triggerConfig.to_stage_name_contains) {
      if (!context.toStageName?.toLowerCase().includes(triggerConfig.to_stage_name_contains.toLowerCase())) {
        continue;
      }
    }

    const title = (config.title ?? "Follow up")
      .replace("{name}", context.contactName);

    if (rule.action_type === "create_task") {
      let dueDate: string | null = null;
      if (config.due_offset_hours !== undefined) {
        dueDate = format(addHours(new Date(), config.due_offset_hours), "yyyy-MM-dd");
      }
      if (config.due_before_hours !== undefined && context.bookingStartAt) {
        dueDate = format(addHours(new Date(context.bookingStartAt), -config.due_before_hours), "yyyy-MM-dd");
      }

      await supabase.from("tasks").insert({
        user_id: userId,
        lead_id: context.contactId,
        title,
        type: config.type ?? "follow_up",
        priority: config.priority ?? "medium",
        due_date: dueDate,
        status: "open",
        created_by_user_id: userId,
        assigned_to_user_id: userId,
      });

      await supabase.from("contact_activities").insert({
        user_id: userId,
        lead_id: context.contactId,
        activity_type: "task_created",
        title: `Auto: ${title}`,
        occurred_at: new Date().toISOString(),
      });
    }

    if (rule.action_type === "send_email") {
      // Queue a campaign email for the contact (template-based)
      const templateId = config.template_id;
      if (templateId) {
        await supabase.from("contact_activities").insert({
          user_id: userId,
          lead_id: context.contactId,
          activity_type: "email",
          title: `Auto: ${title}`,
          description: `Queued from template (${templateId})`,
          occurred_at: new Date().toISOString(),
        });
      }
    }

    if (rule.action_type === "log_activity") {
      await supabase.from("contact_activities").insert({
        user_id: userId,
        lead_id: context.contactId,
        activity_type: config.activity_type ?? "note",
        title,
        description: config.description ?? "",
        occurred_at: new Date().toISOString(),
      });
    }

    if (rule.action_type === "move_stage") {
      const targetStageId = config.target_stage_id;
      if (targetStageId) {
        await supabase.from("leads").update({ stage_id: targetStageId }).eq("id", context.contactId);
        await supabase.from("contact_activities").insert({
          user_id: userId,
          lead_id: context.contactId,
          activity_type: "stage_change",
          title: `Auto: ${title}`,
          occurred_at: new Date().toISOString(),
        });
      }
    }

    if (rule.action_type === "send_notification") {
      // In-app notification logged as activity with special type
      await supabase.from("contact_activities").insert({
        user_id: userId,
        lead_id: context.contactId,
        activity_type: "notification",
        title: `🔔 ${title}`,
        description: config.message ?? "",
        occurred_at: new Date().toISOString(),
      });
    }
  }
}
