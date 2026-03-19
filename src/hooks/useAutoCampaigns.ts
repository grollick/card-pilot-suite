import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AutoCampaign {
  id: string;
  user_id: string;
  org_id: string | null;
  name: string;
  campaign_type: string;
  profession: string | null;
  frequency: string;
  posts_per_week: number;
  status: string;
  content_types: string[];
  settings_json: Record<string, any>;
  next_post_at: string | null;
  posts_generated: number;
  created_at: string;
  updated_at: string;
}

export const CAMPAIGN_TYPES = [
  {
    key: "contractor",
    label: "Contractor",
    description: "Showcase completed projects, before/after transformations, and seasonal promos",
    contentTypes: ["project_completed", "before_after", "now_booking", "tip", "promotion"],
    defaultFrequency: "3x_week",
    defaultPostsPerWeek: 3,
  },
  {
    key: "barber",
    label: "Barber",
    description: "Share fresh cuts, style trends, open appointment slots, and client transformations",
    contentTypes: ["fresh_cut", "style_trend", "open_slots", "before_after", "promotion"],
    defaultFrequency: "daily",
    defaultPostsPerWeek: 5,
  },
  {
    key: "realtor",
    label: "Realtor",
    description: "Feature new listings, just sold, open houses, and market updates",
    contentTypes: ["just_listed", "just_sold", "open_house", "market_update", "tip"],
    defaultFrequency: "3x_week",
    defaultPostsPerWeek: 3,
  },
  {
    key: "landscaper",
    label: "Landscaper",
    description: "Display lawn transformations, seasonal services, and maintenance tips",
    contentTypes: ["project_completed", "before_after", "seasonal_service", "tip", "promotion"],
    defaultFrequency: "2x_week",
    defaultPostsPerWeek: 2,
  },
  {
    key: "general",
    label: "General Business",
    description: "Versatile content mix for any trade or service business",
    contentTypes: ["project_completed", "promotion", "tip", "now_booking", "testimonial"],
    defaultFrequency: "2x_week",
    defaultPostsPerWeek: 2,
  },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily", postsPerWeek: 7 },
  { value: "5x_week", label: "5x per week", postsPerWeek: 5 },
  { value: "3x_week", label: "3x per week", postsPerWeek: 3 },
  { value: "2x_week", label: "2x per week", postsPerWeek: 2 },
  { value: "weekly", label: "Once a week", postsPerWeek: 1 },
] as const;

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  project_completed: "Project Completed",
  before_after: "Before & After",
  now_booking: "Now Booking",
  tip: "Industry Tip",
  promotion: "Promotion / Deal",
  fresh_cut: "Fresh Cut Showcase",
  style_trend: "Style Trend",
  open_slots: "Open Appointments",
  just_listed: "Just Listed",
  just_sold: "Just Sold",
  open_house: "Open House",
  market_update: "Market Update",
  seasonal_service: "Seasonal Service",
  testimonial: "Client Testimonial",
};

/** Plan-based campaign limits */
export function getCampaignLimits(plan: string) {
  switch (plan) {
    case "starter":
      return { maxCampaigns: 0, maxPostsPerWeek: 0, aiContent: false };
    case "growth":
      return { maxCampaigns: 1, maxPostsPerWeek: 3, aiContent: true };
    case "pro":
    case "agency":
      return { maxCampaigns: 5, maxPostsPerWeek: 7, aiContent: true };
    default:
      return { maxCampaigns: 0, maxPostsPerWeek: 0, aiContent: false };
  }
}

const KEY = ["auto-campaigns"] as const;

export function useAutoCampaigns() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("auto_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AutoCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (campaign: {
      name: string;
      campaign_type: string;
      profession?: string;
      frequency: string;
      posts_per_week: number;
      content_types: string[];
      settings_json?: Record<string, any>;
    }) => {
      const { data, error } = await (supabase as any)
        .from("auto_campaigns")
        .insert({ ...campaign, user_id: user!.id, status: "active" })
        .select()
        .single();
      if (error) throw error;
      return data as AutoCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutoCampaign> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("auto_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AutoCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("auto_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
