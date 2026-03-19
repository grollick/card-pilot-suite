import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──
export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  status: string;
  max_emails_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  subject: string;
  body: string;
  delay_hours: number;
  enabled: boolean;
  stop_conditions: any[];
  created_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  user_id: string;
  current_step: number;
  status: string;
  enrolled_at: string;
  last_email_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

// ── Sequences ──
export function useEmailSequences() {
  return useQuery({
    queryKey: ["email-sequences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EmailSequence[];
    },
  });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { name: string; description?: string; trigger_type: string; trigger_config?: Record<string, any> }) => {
      const { data, error } = await supabase
        .from("email_sequences")
        .insert([s as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-sequences"] });
      toast.success("Sequence created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create sequence"),
  });
}

export function useUpdateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; status?: string; description?: string; max_emails_per_day?: number }) => {
      const { error } = await supabase.from("email_sequences").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-sequences"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update sequence"),
  });
}

export function useDeleteSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_sequences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-sequences"] });
      toast.success("Sequence deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete sequence"),
  });
}

// ── Steps ──
export function useSequenceSteps(sequenceId: string | null) {
  return useQuery({
    queryKey: ["sequence-steps", sequenceId],
    enabled: !!sequenceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequence_steps")
        .select("*")
        .eq("sequence_id", sequenceId!)
        .order("step_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EmailSequenceStep[];
    },
  });
}

export function useCreateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { sequence_id: string; step_number: number; subject: string; body: string; delay_hours?: number; stop_conditions?: any[] }) => {
      const { data, error } = await supabase
        .from("email_sequence_steps")
        .insert(s)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sequence-steps", vars.sequence_id] });
      toast.success("Step added");
    },
  });
}

export function useUpdateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sequence_id, ...updates }: { id: string; sequence_id: string; subject?: string; body?: string; delay_hours?: number; enabled?: boolean; stop_conditions?: any[] }) => {
      const { error } = await supabase.from("email_sequence_steps").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sequence-steps", vars.sequence_id] });
    },
  });
}

export function useDeleteStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sequence_id }: { id: string; sequence_id: string }) => {
      const { error } = await supabase.from("email_sequence_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sequence-steps", vars.sequence_id] });
      toast.success("Step removed");
    },
  });
}

// ── Enrollments ──
export function useSequenceEnrollments(sequenceId: string | null) {
  return useQuery({
    queryKey: ["sequence-enrollments", sequenceId],
    enabled: !!sequenceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequence_enrollments")
        .select("*")
        .eq("sequence_id", sequenceId!)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SequenceEnrollment[];
    },
  });
}

// ── Trigger processing ──
export function useRunSequenceProcessor() {
  return useMutation({
    mutationFn: async (action: "process" | "enroll_new_signups" | "check_stop_conditions") => {
      const { data, error } = await supabase.functions.invoke("process-email-sequences", {
        body: { action },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, action) => {
      if (action === "process") toast.success(`Processed: ${data.sent ?? 0} sent, ${data.skipped ?? 0} skipped`);
      else if (action === "enroll_new_signups") toast.success(`Enrolled ${data.enrolled ?? 0} users`);
      else toast.success(`Checked ${data.checked ?? 0}, cancelled ${data.cancelled ?? 0}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
