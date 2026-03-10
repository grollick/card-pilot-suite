export const PLATFORMS = [
  { id: "Instagram", color: "bg-pink-500/10 text-pink-600", borderColor: "border-pink-500/30", charLimit: 2200 },
  { id: "Facebook", color: "bg-blue-500/10 text-blue-600", borderColor: "border-blue-500/30", charLimit: 63206 },
  { id: "LinkedIn", color: "bg-sky-600/10 text-sky-700", borderColor: "border-sky-600/30", charLimit: 3000 },
  { id: "Twitter", color: "bg-gray-500/10 text-gray-600", borderColor: "border-gray-500/30", charLimit: 280 },
  { id: "Google Business", color: "bg-red-500/10 text-red-600", borderColor: "border-red-500/30", charLimit: 1500 },
  { id: "TikTok", color: "bg-teal-500/10 text-teal-600", borderColor: "border-teal-500/30", charLimit: 2200 },
] as const;

export const CONTENT_LABELS = [
  { value: "promo", label: "Promotion", color: "bg-orange-500/10 text-orange-600" },
  { value: "educational", label: "Educational", color: "bg-blue-500/10 text-blue-600" },
  { value: "testimonial", label: "Testimonial", color: "bg-green-500/10 text-green-600" },
  { value: "seasonal", label: "Seasonal", color: "bg-purple-500/10 text-purple-600" },
  { value: "portfolio", label: "Portfolio", color: "bg-amber-500/10 text-amber-600" },
  { value: "lead_gen", label: "Lead Gen", color: "bg-cyan-500/10 text-cyan-600" },
] as const;

export const APPROVAL_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { value: "pending_approval", label: "Pending Approval", color: "bg-amber-500/10 text-amber-600" },
  { value: "approved", label: "Approved", color: "bg-green-500/10 text-green-600" },
  { value: "rejected", label: "Rejected", color: "bg-destructive/10 text-destructive" },
  { value: "scheduled", label: "Scheduled", color: "bg-primary/10 text-primary" },
  { value: "published", label: "Published", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "failed", label: "Failed", color: "bg-destructive/10 text-destructive" },
] as const;

export const PLANNER_COLUMNS = [
  { id: "idea", label: "Ideas", color: "border-muted-foreground/30" },
  { id: "drafting", label: "Drafting", color: "border-amber-500/30" },
  { id: "ready", label: "Ready", color: "border-blue-500/30" },
  { id: "scheduled", label: "Scheduled", color: "border-primary/30" },
  { id: "published", label: "Published", color: "border-emerald-500/30" },
] as const;

export type PlatformId = typeof PLATFORMS[number]["id"];

export function getPlatformConfig(id: string) {
  return PLATFORMS.find(p => p.id === id);
}

export function getApprovalConfig(status: string) {
  return APPROVAL_STATUSES.find(s => s.value === status) ?? APPROVAL_STATUSES[0];
}

export function getLabelConfig(label: string) {
  return CONTENT_LABELS.find(l => l.value === label);
}
