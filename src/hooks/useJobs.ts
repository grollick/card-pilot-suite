import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateInvoiceNumber } from "@/hooks/useInvoices";

export type JobStatus = "draft" | "scheduled" | "in_progress" | "paused" | "completed" | "cancelled";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft", scheduled: "Scheduled", in_progress: "In Progress",
  paused: "Paused", completed: "Completed", cancelled: "Cancelled",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  paused: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export const KANBAN_COLUMNS: JobStatus[] = ["scheduled", "in_progress", "paused", "completed"];

export function generateJobNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `JOB-${y}${m}-${rand}`;
}

// ── Hooks ──

export function useJobs(statusFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["jobs", statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("jobs" as any)
        .select("*, leads(name, email, phone, company), estimates(estimate_number, grand_total)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        q = q.eq("status", statusFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useJob(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["job", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs" as any)
        .select("*, leads(name, email, phone, company), estimates(estimate_number, grand_total)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useCreateJob() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (job: {
      title: string; job_number?: string; lead_id?: string | null;
      estimate_id?: string | null; booking_id?: string | null;
      job_address?: string; job_type?: string; status?: JobStatus;
      scheduled_start?: string; scheduled_end?: string;
      notes?: string; internal_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("jobs" as any)
        .insert({
          ...job,
          job_number: job.job_number || generateJobNumber(),
          user_id: user!.id,
          status: job.status || "draft",
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Log activity
      if (job.lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id: job.lead_id, user_id: user!.id,
          activity_type: "job_created",
          title: `Job ${job.job_number || "created"}: ${job.title}`,
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success("Job created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateJob() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("jobs" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", vars.id] });
      toast.success("Job updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateJobStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, lead_id, job_number, title, grandTotal }: {
      id: string; status: JobStatus; lead_id?: string | null; job_number?: string;
      title?: string; grandTotal?: number;
    }) => {
      const updates: any = { status };
      if (status === "in_progress" && !updates.actual_start) updates.actual_start = new Date().toISOString();
      if (status === "completed") updates.actual_end = new Date().toISOString();

      const { error } = await supabase.from("jobs" as any).update(updates).eq("id", id);
      if (error) throw error;

      if (lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id, user_id: user!.id,
          activity_type: `job_${status}`,
          title: `Job ${job_number ?? ""} → ${JOB_STATUS_LABELS[status]}`,
          related_id: id,
        });
      }

      // Auto-generate draft invoice when job is completed
      if (status === "completed") {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        const total = grandTotal ?? 0;

        await supabase.from("invoices").insert({
          user_id: user!.id,
          job_id: id,
          lead_id: lead_id ?? null,
          invoice_number: generateInvoiceNumber(),
          status: "draft" as any,
          due_date: dueDate.toISOString().split("T")[0],
          subtotal: total,
          grand_total: total,
        });
      }

      return { id, status };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", vars.id] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      if (vars.status === "completed") {
        toast.success(`Job completed — draft invoice created`);
      } else {
        toast.success(`Job marked as ${JOB_STATUS_LABELS[vars.status]}`);
      }
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Job Tasks ──

export function useJobTasks(jobId?: string) {
  return useQuery({
    queryKey: ["job-tasks", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_tasks" as any)
        .select("*")
        .eq("job_id", jobId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCreateJobTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: { job_id: string; title: string; due_date?: string; notes?: string }) => {
      const { data, error } = await supabase.from("job_tasks" as any).insert(task as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-tasks", vars.job_id] });
      toast.success("Task added");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateJobTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, job_id, ...updates }: { id: string; job_id: string; [key: string]: any }) => {
      const { error } = await supabase.from("job_tasks" as any).update(updates as any).eq("id", id);
      if (error) throw error;
      return { id, job_id };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-tasks", vars.job_id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteJobTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, job_id }: { id: string; job_id: string }) => {
      const { error } = await supabase.from("job_tasks" as any).delete().eq("id", id);
      if (error) throw error;
      return { job_id };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-tasks", vars.job_id] });
      toast.success("Task removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Job Photos ──

export function useJobPhotos(jobId?: string) {
  return useQuery({
    queryKey: ["job-photos", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_photos" as any)
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useUploadJobPhoto() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, file, category, caption }: {
      jobId: string; file: File; category: string; caption?: string;
    }) => {
      const ext = file.name.split(".").pop();
      const path = `job-photos/${user!.id}/${jobId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("card-assets").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("card-assets").getPublicUrl(path);
      const photo_url = urlData.publicUrl;

      const { data, error } = await supabase
        .from("job_photos" as any)
        .insert({ job_id: jobId, user_id: user!.id, photo_url, category, caption } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-photos", vars.jobId] });
      toast.success("Photo uploaded");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteJobPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, jobId }: { id: string; jobId: string }) => {
      const { error } = await supabase.from("job_photos" as any).delete().eq("id", id);
      if (error) throw error;
      return { jobId };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-photos", vars.jobId] });
      toast.success("Photo removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Job Materials ──

export function useJobMaterials(jobId?: string) {
  return useQuery({
    queryKey: ["job-materials", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_materials" as any)
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCreateJobMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mat: { job_id: string; name: string; quantity?: number; unit_cost?: number; notes?: string }) => {
      const { data, error } = await supabase.from("job_materials" as any).insert(mat as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-materials", vars.job_id] });
      toast.success("Material added");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteJobMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, jobId }: { id: string; jobId: string }) => {
      const { error } = await supabase.from("job_materials" as any).delete().eq("id", id);
      if (error) throw error;
      return { jobId };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-materials", vars.jobId] });
      toast.success("Material removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Convert Estimate to Job ──

export function useConvertEstimateToJobV2() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ estimateId, leadId, estimateNumber, title, jobAddress, jobType, scheduledStart, scheduledEnd }: {
      estimateId: string; leadId?: string | null; estimateNumber: string;
      title: string; jobAddress?: string; jobType?: string;
      scheduledStart?: string; scheduledEnd?: string;
    }) => {
      const jobNumber = generateJobNumber();
      const { data: job, error } = await supabase.from("jobs" as any).insert({
        user_id: user!.id,
        lead_id: leadId ?? null,
        estimate_id: estimateId,
        job_number: jobNumber,
        title,
        job_address: jobAddress ?? null,
        job_type: jobType ?? null,
        status: "scheduled",
        scheduled_start: scheduledStart ?? null,
        scheduled_end: scheduledEnd ?? null,
        internal_notes: `Converted from estimate ${estimateNumber}`,
      } as any).select().single();
      if (error) throw error;

      // Update estimate
      await supabase.from("estimates").update({ converted_booking_id: (job as any).id, status: "approved" } as any).eq("id", estimateId);

      // Log activity
      if (leadId) {
        await supabase.from("contact_activities").insert({
          lead_id: leadId, user_id: user!.id,
          activity_type: "estimate_converted_to_job",
          title: `Estimate ${estimateNumber} → Job ${jobNumber}`,
          related_id: (job as any).id,
        });
      }
      return job;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success("Estimate converted to job");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
