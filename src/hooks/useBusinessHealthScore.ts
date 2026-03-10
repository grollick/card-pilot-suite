import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay } from "date-fns";

export interface HealthFactor {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  suggestion: string | null;
}

export interface BusinessHealthData {
  totalScore: number;
  maxScore: number;
  factors: HealthFactor[];
  trend: number | null; // percent change from last week
}

export function useBusinessHealthScore() {
  return useQuery({
    queryKey: ["business-health-score"],
    queryFn: async (): Promise<BusinessHealthData> => {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7).toISOString();
      const fourteenDaysAgo = subDays(now, 14).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [
        leadsRes,
        activitiesRes,
        bookingsRes,
        estimatesRes,
        jobsRes,
        reviewsRes,
        referralsRes,
        socialPostsRes,
        leadsOlderRes,
        bookingsOlderRes,
      ] = await Promise.all([
        // Leads last 30 days
        supabase.from("leads").select("id, created_at, last_activity_at, status").gte("created_at", thirtyDaysAgo),
        // Activities last 7 days (response speed)
        supabase.from("contact_activities").select("lead_id, created_at, activity_type").gte("created_at", sevenDaysAgo).limit(200),
        // Bookings last 30 days
        supabase.from("bookings").select("id, status, created_at").gte("created_at", thirtyDaysAgo),
        // Estimates last 30 days
        supabase.from("estimates").select("id, status, created_at").gte("created_at", thirtyDaysAgo),
        // Jobs last 30 days
        supabase.from("jobs").select("id, status, created_at").gte("created_at", thirtyDaysAgo),
        // Reviews last 30 days
        supabase.from("reviews").select("id, created_at").gte("created_at", thirtyDaysAgo),
        // Referrals last 30 days
        supabase.from("referrals").select("id, created_at").gte("created_at", thirtyDaysAgo),
        // Social posts last 7 days
        supabase.from("social_posts").select("id, status, created_at").gte("created_at", sevenDaysAgo),
        // Previous week leads for trend
        supabase.from("leads").select("id, created_at, last_activity_at, status")
          .gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        // Previous week bookings for trend
        supabase.from("bookings").select("id, status, created_at")
          .gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
      ]);

      const leads = leadsRes.data ?? [];
      const activities = activitiesRes.data ?? [];
      const bookings = bookingsRes.data ?? [];
      const estimates = estimatesRes.data ?? [];
      const jobs = jobsRes.data ?? [];
      const reviews = reviewsRes.data ?? [];
      const referrals = referralsRes.data ?? [];
      const socialPosts = socialPostsRes.data ?? [];

      const factors: HealthFactor[] = [];

      // 1. Lead Response (max 20) — % of leads with activity within 24h
      const leadsLast7 = leads.filter(l => l.created_at >= sevenDaysAgo);
      const leadsWithQuickResponse = leadsLast7.filter(l => {
        const leadActivities = activities.filter(a => a.lead_id === l.id);
        if (leadActivities.length === 0) return false;
        const firstActivity = new Date(Math.min(...leadActivities.map(a => new Date(a.created_at).getTime())));
        const diff = firstActivity.getTime() - new Date(l.created_at).getTime();
        return diff < 24 * 60 * 60 * 1000;
      });
      const responseRate = leadsLast7.length > 0 ? leadsWithQuickResponse.length / leadsLast7.length : 1;
      const responseScore = Math.round(responseRate * 20);
      factors.push({
        key: "lead_response",
        label: "Lead Response Time",
        score: responseScore,
        maxScore: 20,
        suggestion: responseScore < 15 && leadsLast7.length > 0
          ? `Respond to ${leadsLast7.length - leadsWithQuickResponse.length} lead${leadsLast7.length - leadsWithQuickResponse.length > 1 ? "s" : ""} faster (within 24h)`
          : null,
      });

      // 2. Booking Activity (max 20)
      const bookingScore = Math.min(20, bookings.length * 4);
      factors.push({
        key: "booking_activity",
        label: "Booking Activity",
        score: bookingScore,
        maxScore: 20,
        suggestion: bookingScore < 12 ? "Increase bookings by promoting your availability or sending offers." : null,
      });

      // 3. Estimate Approval Rate (max 20)
      const sentEstimates = estimates.filter(e => ["sent", "viewed", "approved", "declined"].includes(e.status));
      const approvedEstimates = estimates.filter(e => e.status === "approved");
      const approvalRate = sentEstimates.length > 0 ? approvedEstimates.length / sentEstimates.length : 1;
      const estimateScore = sentEstimates.length === 0 ? 10 : Math.round(approvalRate * 20);
      const pendingEstimates = estimates.filter(e => ["sent", "viewed"].includes(e.status)).length;
      factors.push({
        key: "estimate_approvals",
        label: "Estimate Approvals",
        score: estimateScore,
        maxScore: 20,
        suggestion: pendingEstimates > 0
          ? `Send reminders for ${pendingEstimates} pending estimate${pendingEstimates > 1 ? "s" : ""}`
          : null,
      });

      // 4. Job Completion (max 15)
      const completedJobs = jobs.filter(j => j.status === "completed");
      const totalJobs = jobs.filter(j => !["draft", "cancelled"].includes(j.status));
      const completionRate = totalJobs.length > 0 ? completedJobs.length / totalJobs.length : 1;
      const jobScore = totalJobs.length === 0 ? 8 : Math.round(completionRate * 15);
      factors.push({
        key: "job_completion",
        label: "Job Completion",
        score: jobScore,
        maxScore: 15,
        suggestion: jobScore < 10 ? "Focus on completing in-progress jobs to improve this score." : null,
      });

      // 5. Customer Follow-up (max 10) — % of leads with recent activity
      const leadsWithRecentActivity = leads.filter(l =>
        l.last_activity_at && new Date(l.last_activity_at) > subDays(now, 7)
      );
      const followupRate = leads.length > 0 ? leadsWithRecentActivity.length / leads.length : 1;
      const followupScore = Math.round(followupRate * 10);
      const pendingFollowups = leads.length - leadsWithRecentActivity.length;
      factors.push({
        key: "customer_followup",
        label: "Customer Follow-up",
        score: followupScore,
        maxScore: 10,
        suggestion: pendingFollowups > 2
          ? `Follow up with ${pendingFollowups} pending contact${pendingFollowups > 1 ? "s" : ""}`
          : null,
      });

      // 6. Marketing Activity (max 10)
      const publishedOrScheduled = socialPosts.filter(p => ["published", "scheduled"].includes(p.status)).length;
      const marketingScore = Math.min(10, publishedOrScheduled * 2);
      factors.push({
        key: "marketing_activity",
        label: "Marketing Activity",
        score: marketingScore,
        maxScore: 10,
        suggestion: marketingScore < 6 ? "Schedule social posts for next week to boost visibility." : null,
      });

      // 7. Reviews & Referrals (max 5)
      const reviewRefScore = Math.min(5, reviews.length + referrals.length);
      const reviewSuggestion = reviews.length === 0
        ? "Request reviews from recent customers."
        : referrals.length === 0
          ? "Encourage satisfied customers to refer friends."
          : null;
      factors.push({
        key: "reviews_referrals",
        label: "Reviews & Referrals",
        score: reviewRefScore,
        maxScore: 5,
        suggestion: reviewRefScore < 3 ? reviewSuggestion : null,
      });

      const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
      const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);

      // Trend: compare current week activity to previous week
      const prevLeads = leadsOlderRes.data ?? [];
      const prevBookings = bookingsOlderRes.data ?? [];
      const currentWeekActivity = leadsLast7.length + bookings.filter(b => b.created_at >= sevenDaysAgo).length;
      const prevWeekActivity = prevLeads.length + prevBookings.length;
      const trend = prevWeekActivity > 0
        ? Math.round(((currentWeekActivity - prevWeekActivity) / prevWeekActivity) * 100)
        : currentWeekActivity > 0 ? 100 : 0;

      return { totalScore, maxScore, factors, trend };
    },
    refetchInterval: 120_000,
  });
}
