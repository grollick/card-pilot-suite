import { useMemo } from "react";
import { useEstimates } from "@/hooks/useEstimates";
import { useInvoices } from "@/hooks/useInvoices";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { startOfMonth, endOfMonth, differenceInDays } from "date-fns";

export type CoachingSuggestion = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action: string;
  route: string;
  icon: "estimate" | "lead" | "card" | "booking" | "followup" | "review";
};

export function useRevenuePrediction() {
  const { data: estimates = [] } = useEstimates();
  const { data: invoices = [] } = useInvoices();
  const { data: perf } = useBusinessPerformance();
  const { planKey } = usePlanLimits();

  return useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const dayOfMonth = now.getDate();
    const daysInMonth = monthEnd.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // Collected revenue (paid invoices this month)
    const paidThisMonth = invoices
      .filter((i: any) => i.status === "paid" && new Date(i.updated_at) >= monthStart)
      .reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);

    // Pipeline value (pending + approved estimates)
    const pipelineEstimates = estimates.filter((e: any) =>
      ["sent", "viewed", "approved"].includes(e.status)
    );
    const pipelineValue = pipelineEstimates.reduce(
      (s: number, e: any) => s + Number(e.grand_total || 0), 0
    );

    // Conversion rate from estimates
    const totalEstimates = estimates.length;
    const approvedEstimates = estimates.filter((e: any) => e.status === "approved").length;
    const estimateConversionRate = totalEstimates > 0
      ? approvedEstimates / totalEstimates
      : 0.3; // default assumption

    // Projected revenue = collected + (pipeline × conversion rate)
    const projectedFromPipeline = Math.round(pipelineValue * estimateConversionRate);

    // Pace-based projection (extrapolate current pace)
    const dailyPace = dayOfMonth > 0 ? paidThisMonth / dayOfMonth : 0;
    const paceProjection = Math.round(dailyPace * daysInMonth);

    // Blended projection (weighted average)
    const projectedRevenue = Math.round(
      (paceProjection * 0.4) + ((paidThisMonth + projectedFromPipeline) * 0.6)
    );

    // Unpaid invoices
    const unpaidValue = invoices
      .filter((i: any) => ["sent", "viewed", "overdue"].includes(i.status))
      .reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);

    // Generate coaching suggestions
    const suggestions: CoachingSuggestion[] = [];

    const thisMonthEstimates = estimates.filter(
      (e: any) => new Date(e.created_at) >= monthStart
    ).length;

    const leads = perf?.leads ?? 0;
    const bookings = perf?.bookings ?? 0;
    const views = perf?.views ?? 0;

    // High priority: no estimates sent
    if (thisMonthEstimates === 0) {
      suggestions.push({
        id: "send-estimate",
        title: "Send your first estimate this month",
        description: "Estimates are your fastest path to revenue. Create and send one now.",
        priority: "high",
        action: "Create Estimate",
        route: "/app/estimates",
        icon: "estimate",
      });
    } else if (thisMonthEstimates < 3) {
      suggestions.push({
        id: "more-estimates",
        title: "Send more estimates to grow revenue",
        description: `You've sent ${thisMonthEstimates} estimate${thisMonthEstimates > 1 ? "s" : ""} this month. Top performers send 5+.`,
        priority: "medium",
        action: "Send Estimate",
        route: "/app/estimates",
        icon: "estimate",
      });
    }

    // Leads but no bookings
    if (leads > 0 && bookings === 0) {
      suggestions.push({
        id: "convert-leads",
        title: "Convert your leads into bookings",
        description: `You have ${leads} lead${leads > 1 ? "s" : ""} waiting. Follow up to book them.`,
        priority: "high",
        action: "View Leads",
        route: "/app/contacts",
        icon: "lead",
      });
    }

    // Low card views
    if (views < 10) {
      suggestions.push({
        id: "share-card",
        title: "Share your card to get more visibility",
        description: "More card views = more leads. Share your card on social media or via QR code.",
        priority: views === 0 ? "high" : "medium",
        action: "Share Card",
        route: "/app/card",
        icon: "card",
      });
    }

    // Unpaid invoices
    if (unpaidValue > 0) {
      suggestions.push({
        id: "collect-payments",
        title: `Collect $${unpaidValue.toLocaleString()} in unpaid invoices`,
        description: "Follow up on outstanding invoices to improve cash flow.",
        priority: unpaidValue > 500 ? "high" : "medium",
        action: "View Invoices",
        route: "/app/invoices",
        icon: "followup",
      });
    }

    // Unapproved estimates
    const unapproved = estimates.filter(
      (e: any) => ["sent", "viewed"].includes(e.status)
    ).length;
    if (unapproved > 0) {
      suggestions.push({
        id: "followup-estimates",
        title: `Follow up on ${unapproved} pending estimate${unapproved > 1 ? "s" : ""}`,
        description: "A quick follow-up can double your approval rate.",
        priority: "medium",
        action: "View Estimates",
        route: "/app/estimates",
        icon: "followup",
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Plan-based feature gating
    const isPro = planKey !== "starter";
    const isProPlus = planKey === "pro" || planKey === "agency";

    return {
      collectedRevenue: Math.round(paidThisMonth),
      projectedRevenue,
      pipelineValue: Math.round(pipelineValue),
      unpaidValue: Math.round(unpaidValue),
      estimateConversionRate: Math.round(estimateConversionRate * 100),
      dailyPace: Math.round(dailyPace),
      daysRemaining,
      suggestions: isPro ? suggestions : suggestions.slice(0, 2),
      showPrediction: isPro,
      showAdvancedInsights: isProPlus,
      planKey,
    };
  }, [estimates, invoices, perf, planKey]);
}
