// ── Re-export barrel for backwards compatibility ──
// New code should import from the specific hooks directly.

export { useSocialPosts, useCreatePost, useUpdatePost, useDeletePost, useBulkDeletePosts, useBulkUpdatePosts } from "./useSocialPosts";
export type { SocialPost as SocialPostExtended, SocialPost } from "./useSocialPosts";

export { useSocialAccounts, useToggleAccount } from "./useSocialAccounts";

export { useSocialCampaigns, useCreateCampaign, useDeleteCampaign } from "./useSocialCampaigns";
export type { SocialCampaign } from "./useSocialCampaigns";

export { useQueueSlots, useCreateQueueSlot, useDeleteQueueSlot } from "./useSocialQueue";
export type { QueueSlot } from "./useSocialQueue";
