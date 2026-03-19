import { useEffect, useRef } from "react";
import { useActivationChecklist } from "@/hooks/useActivationChecklist";
import { toast } from "@/hooks/use-toast";

/**
 * Listens to checklist completion changes and fires celebration toasts
 * when milestones are newly achieved. Runs silently — no UI rendered.
 */
export default function MilestoneCelebrationListener() {
  const { items, template, isLoading } = useActivationChecklist();
  const prevDoneRef = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (isLoading || items.length === 0) return;

    const currentDone = new Set(items.filter((i) => i.done).map((i) => i.key));

    // On first load, just capture state — don't celebrate
    if (!initialized.current) {
      prevDoneRef.current = currentDone;
      initialized.current = true;
      return;
    }

    // Find newly completed steps
    const newlyDone = [...currentDone].filter(
      (key) => !prevDoneRef.current.has(key)
    );

    for (const key of newlyDone) {
      const milestone = template.milestones.find((m) => m.key === key);
      if (milestone) {
        toast({
          title: milestone.title,
          description: milestone.description,
          duration: 6000,
        });
      }
    }

    prevDoneRef.current = currentDone;
  }, [items, isLoading, template]);

  return null;
}
