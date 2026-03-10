// ── CRM module barrel ──
export {
  useContacts,
  usePipelineStages,
  useTags,
  useCreateTag,
  useToggleContactTag,
} from "@/hooks/useContacts";
export {
  useLogActivity,
  useCreateContact,
  useUpdateContact,
  useCancelFollowup,
  useReactivateFollowups,
} from "@/hooks/useContactActions";
export {
  useContact,
  useContactActivities,
  useContactTasks,
  useContactBookings,
  useContactFollowups,
  useContactFollowupHistory,
} from "@/hooks/useContactDetail";
export { useTasks, useCreateTask, useUpdateTask } from "@/hooks/useTasks";
export { useNeedsFollowUp, type FollowUpContact } from "@/hooks/useNeedsFollowUp";
