// ── Social Module Constants ──
// Single source of truth for platforms, statuses, labels, and planner columns

export const PLATFORMS = [
  { id: "Instagram", color: "bg-pink-500/10 text-pink-600", borderColor: "border-pink-500/30", charLimit: 2200 },
  { id: "Facebook", color: "bg-blue-500/10 text-blue-600", borderColor: "border-blue-500/30", charLimit: 63206 },
  { id: "LinkedIn", color: "bg-sky-600/10 text-sky-700", borderColor: "border-sky-600/30", charLimit: 3000 },
  { id: "Twitter", color: "bg-gray-500/10 text-gray-600", borderColor: "border-gray-500/30", charLimit: 280 },
  { id: "Google Business", color: "bg-red-500/10 text-red-600", borderColor: "border-red-500/30", charLimit: 1500 },
  { id: "TikTok", color: "bg-teal-500/10 text-teal-600", borderColor: "border-teal-500/30", charLimit: 2200 },
] as const;

// ── Unified Post Status System ──
// All views (Planner, Calendar, Posts, Streams, Analytics) use this one model.
// DB stores `approval_status` with these values. `status` field derives from it.
export const POST_STATUSES = [
  { value: "idea", label: "Idea", color: "bg-muted text-muted-foreground", dotColor: "bg-muted-foreground" },
  { value: "draft", label: "Draft", color: "bg-slate-500/10 text-slate-600", dotColor: "bg-slate-500" },
  { value: "pending_approval", label: "Pending Approval", color: "bg-amber-500/10 text-amber-600", dotColor: "bg-amber-500" },
  { value: "approved", label: "Approved", color: "bg-green-500/10 text-green-600", dotColor: "bg-green-500" },
  { value: "queued", label: "Queued", color: "bg-violet-500/10 text-violet-600", dotColor: "bg-violet-500" },
  { value: "scheduled", label: "Scheduled", color: "bg-primary/10 text-primary", dotColor: "bg-primary" },
  { value: "publishing", label: "Publishing", color: "bg-blue-500/10 text-blue-600", dotColor: "bg-blue-500" },
  { value: "published", label: "Published", color: "bg-emerald-500/10 text-emerald-600", dotColor: "bg-emerald-500" },
  { value: "failed", label: "Failed", color: "bg-destructive/10 text-destructive", dotColor: "bg-destructive" },
  { value: "archived", label: "Archived", color: "bg-muted text-muted-foreground", dotColor: "bg-muted-foreground" },
] as const;

export type PostStatus = typeof POST_STATUSES[number]["value"];

export const CONTENT_LABELS = [
  { value: "promo", label: "Promotion", color: "bg-orange-500/10 text-orange-600" },
  { value: "educational", label: "Educational", color: "bg-blue-500/10 text-blue-600" },
  { value: "testimonial", label: "Testimonial", color: "bg-green-500/10 text-green-600" },
  { value: "seasonal", label: "Seasonal", color: "bg-purple-500/10 text-purple-600" },
  { value: "portfolio", label: "Portfolio", color: "bg-amber-500/10 text-amber-600" },
  { value: "lead_gen", label: "Lead Gen", color: "bg-cyan-500/10 text-cyan-600" },
] as const;

// Planner columns map 1:1 to post statuses
export const PLANNER_COLUMNS = [
  { id: "idea" as PostStatus, label: "Ideas", color: "border-muted-foreground/30" },
  { id: "draft" as PostStatus, label: "Drafts", color: "border-slate-500/30" },
  { id: "pending_approval" as PostStatus, label: "In Review", color: "border-amber-500/30" },
  { id: "approved" as PostStatus, label: "Ready", color: "border-green-500/30" },
  { id: "scheduled" as PostStatus, label: "Scheduled", color: "border-primary/30" },
  { id: "published" as PostStatus, label: "Published", color: "border-emerald-500/30" },
] as const;

// Maps DB approval_status → planner column (same now that we unified)
export const STATUS_TO_COLUMN: Record<string, PostStatus> = {
  idea: "idea",
  draft: "draft",
  pending_approval: "pending_approval",
  approved: "approved",
  queued: "scheduled",
  scheduled: "scheduled",
  publishing: "published",
  published: "published",
  failed: "draft",
  archived: "published",
};

// Maps planner column → DB fields when moving posts
export const COLUMN_TO_DB: Record<string, { approval_status: string; status: string }> = {
  idea: { approval_status: "idea", status: "draft" },
  draft: { approval_status: "draft", status: "draft" },
  pending_approval: { approval_status: "pending_approval", status: "draft" },
  approved: { approval_status: "approved", status: "draft" },
  scheduled: { approval_status: "scheduled", status: "scheduled" },
  published: { approval_status: "published", status: "published" },
};

// Stream types for the Streams workspace
export const STREAM_TYPES = [
  { value: "drafts", label: "Drafts", filterFn: (p: any) => ["idea", "draft"].includes(p.approval_status ?? "draft") },
  { value: "in_review", label: "In Review", filterFn: (p: any) => p.approval_status === "pending_approval" },
  { value: "scheduled", label: "Scheduled", filterFn: (p: any) => p.status === "scheduled" },
  { value: "published", label: "Published", filterFn: (p: any) => p.status === "published" },
  { value: "failed", label: "Failed", filterFn: (p: any) => p.approval_status === "failed" },
  { value: "comments", label: "Comments", filterFn: () => false },
  { value: "mentions", label: "Mentions", filterFn: () => false },
  { value: "hashtags", label: "Hashtag Monitor", filterFn: () => false },
] as const;

export type PlatformId = typeof PLATFORMS[number]["id"];

// ── Utility Lookups ──
export function getPlatformConfig(id: string) {
  return PLATFORMS.find(p => p.id === id);
}

export function getStatusConfig(status: string) {
  return POST_STATUSES.find(s => s.value === status) ?? POST_STATUSES[1]; // fallback to "draft"
}

export function getLabelConfig(label: string) {
  return CONTENT_LABELS.find(l => l.value === label);
}

/** @deprecated Use getStatusConfig instead */
export function getApprovalConfig(status: string) {
  return getStatusConfig(status);
}

/** Derive the DB `status` field from `approval_status` */
export function deriveDbStatus(approvalStatus: PostStatus): string {
  if (approvalStatus === "scheduled" || approvalStatus === "queued") return "scheduled";
  if (approvalStatus === "published" || approvalStatus === "publishing") return "published";
  if (approvalStatus === "failed") return "failed";
  return "draft";
}
