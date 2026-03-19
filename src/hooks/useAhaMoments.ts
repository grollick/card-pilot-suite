import { useMemo } from "react";
import { useActivationChecklist } from "@/hooks/useActivationChecklist";
import type { LucideIcon } from "lucide-react";
import {
  Share2, FileText, CalendarCheck, Globe, Wrench,
} from "lucide-react";

export interface AhaPrompt {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  route: string;
  icon: LucideIcon;
  priority: number; // lower = more urgent
}

/**
 * Detects "almost there" states and returns contextual prompts
 * to nudge users toward their next success milestone.
 * Adapts based on profession via the activation checklist.
 */
export function useAhaMoments() {
  const { items, allDone, isLoading, template } = useActivationChecklist();

  const prompts = useMemo<AhaPrompt[]>(() => {
    if (isLoading || allDone || items.length === 0) return [];

    const done = (key: string) => items.find((i) => i.key === key)?.done ?? false;
    const result: AhaPrompt[] = [];

    // Card created but not shared → nudge sharing
    if (done("card") && !done("share_direct") && !done("lead")) {
      result.push({
        id: "share-card",
        title: "Share your card to get your first lead",
        description:
          "Your card is live! Send it to 5 people via text or email — most users get a lead within 24 hours.",
        actionLabel: "Share Now",
        route: "/app/card/qr",
        icon: Share2,
        priority: 1,
      });
    }

    // Services added but no estimate → nudge estimate (contractor-centric)
    if (
      done("services") &&
      !done("estimate") &&
      items.some((i) => i.key === "estimate")
    ) {
      result.push({
        id: "send-estimate",
        title: "Send your first estimate to win your first job",
        description:
          "You have services set up — create a quick estimate and send it to a potential customer.",
        actionLabel: "Create Estimate",
        route: "/app/estimates",
        icon: FileText,
        priority: 2,
      });
    }

    // Lead received but no booking → nudge conversion
    if (done("lead") && !done("booking")) {
      result.push({
        id: "convert-lead",
        title: "Convert your leads into bookings",
        description:
          "You have leads waiting! Follow up and book them before they go to a competitor.",
        actionLabel: "View Leads",
        route: "/app/contacts",
        icon: CalendarCheck,
        priority: 3,
      });
    }

    // Card not published yet → top priority
    if (!done("card")) {
      result.push({
        id: "publish-card",
        title: "Publish your card to get started",
        description:
          "Your card is almost ready — publish it so customers can find you.",
        actionLabel: "Open Card Builder",
        route: "/app/card",
        icon: Globe,
        priority: 0,
      });
    }

    // No services → setup nudge
    if (done("card") && !done("services")) {
      result.push({
        id: "add-services",
        title: "Add your services so customers can book",
        description:
          "Customers need to see what you offer. Add at least one service with pricing.",
        actionLabel: "Add Services",
        route: "/app/bookings",
        icon: Wrench,
        priority: 1,
      });
    }

    return result.sort((a, b) => a.priority - b.priority);
  }, [items, allDone, isLoading, template]);

  // Return only the top prompt to avoid overwhelming the user
  return {
    topPrompt: prompts[0] ?? null,
    allPrompts: prompts,
    isLoading,
  };
}
