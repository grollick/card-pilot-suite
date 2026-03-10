// ── Marketing module barrel ──
export {
  useSendEmail,
  useEmailTemplates,
  useCreateTemplate,
  useUpdateTemplate,
} from "@/hooks/useEmail";
export {
  useSocialPosts,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useSocialAccounts,
  useToggleAccount,
  useSocialCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useQueueSlots,
  useCreateQueueSlot,
  useDeleteQueueSlot,
  useBulkDeletePosts,
  useBulkUpdatePosts,
  type SocialPostExtended,
  type SocialCampaign,
  type QueueSlot,
} from "@/hooks/useSocial";
export { useQRCampaigns } from "@/hooks/useQRCampaigns";
export { useAutomationRules, useCreateRule, useUpdateRule, useToggleRule, useDeleteRule, runAutomation } from "@/hooks/useAutomation";
