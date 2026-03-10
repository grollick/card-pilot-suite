// ── Marketing module barrel ──
export {
  useSendEmail,
  useEmailTemplates,
  useCreateTemplate,
  useUpdateTemplate,
} from "@/hooks/useEmail";

// Social — re-exported from focused hook files
export {
  useSocialPosts,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useBulkDeletePosts,
  useBulkUpdatePosts,
} from "@/hooks/useSocialPosts";
export type { SocialPost, SocialPost as SocialPostExtended } from "@/hooks/useSocialPosts";

export { useSocialAccounts, useToggleAccount } from "@/hooks/useSocialAccounts";

export {
  useSocialCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
} from "@/hooks/useSocialCampaigns";
export type { SocialCampaign } from "@/hooks/useSocialCampaigns";

export {
  useQueueSlots,
  useCreateQueueSlot,
  useDeleteQueueSlot,
} from "@/hooks/useSocialQueue";
export type { QueueSlot } from "@/hooks/useSocialQueue";

export { useQRCampaigns } from "@/hooks/useQRCampaigns";
export { useAutomationRules, useCreateRule, useUpdateRule, useToggleRule, useDeleteRule, runAutomation } from "@/hooks/useAutomation";
