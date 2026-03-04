import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, addHours } from "date-fns";

export interface AutomationRule {
  id: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  enabled: boolean;
}

const DEFAULT_RULES: Omit<AutomationRule, "id">[] = [
  {
    trigger_type: "new_lead",
    trigger_config: {},
    action_type: "create_task",
    action_config: { title: "Follow up with new lead", type: "follow_up", priority: "high", due_offset_hours: 24 },
    enabled: true,
  },
  {
    trigger_type: "booking_created",
    trigger_config: {},
    action_type: "create_task",
    action_config: { title: "Prep for booking", type: "meeting", priority: "medium", due_before_hours: 2 },
    enabled: true,
  },
  {
    trigger_type: "stage_changed",
    trigger_config: { to_stage_name_contains: "qualif" },
    action_type: "create_task",
    action_config: { title: "Send next steps email", type: "email", priority: "high", due_offset_hours: 0 },
    enabled: true,
  },
];

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
        .select("trigger_type")
        .eq("user_id", user.id);

      const existingTypes = new Set((existing ?? []).map((r: any) => r.trigger_type));
      const missing = DEFAULT_RULES.filter(r => !existingTypes.has(r.trigger_type));

      if (missing.length > 0) {
        await supabase.from("automation_rules").insert(
          missing.map(r => ({ ...r, user_id: user.id }))
        );
      }
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

/**
 * Run automation rules client-side after a trigger event.
 * Call this from contact creation, booking creation, stage change hooks.
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
  // Fetch enabled rules for this trigger
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

    // Check trigger config conditions
    if (triggerType === "stage_changed" && triggerConfig.to_stage_name_contains) {
      if (!context.toStageName?.toLowerCase().includes(triggerConfig.to_stage_name_contains)) {
        continue;
      }
    }

    if (rule.action_type === "create_task") {
      let dueDate: string | null = null;
      if (config.due_offset_hours !== undefined) {
        dueDate = format(addHours(new Date(), config.due_offset_hours), "yyyy-MM-dd");
      }
      if (config.due_before_hours !== undefined && context.bookingStartAt) {
        dueDate = format(addHours(new Date(context.bookingStartAt), -config.due_before_hours), "yyyy-MM-dd");
      }

      const title = config.title?.replace("{name}", context.contactName) ?? "Follow up";

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

      // Log activity
      await supabase.from("contact_activities").insert({
        user_id: userId,
        lead_id: context.contactId,
        activity_type: "task_created",
        title: `Auto: ${title}`,
        occurred_at: new Date().toISOString(),
      });
    }
  }
}
