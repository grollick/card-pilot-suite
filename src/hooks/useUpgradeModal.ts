import { useState, useCallback } from "react";
import type { UpgradeTrigger } from "@/modules/billing/config/planLimits";

/** Simple hook to manage UpgradeModal open/close state with a trigger */
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, setTrigger] = useState<UpgradeTrigger>("generic");

  const showUpgrade = useCallback((t: UpgradeTrigger = "generic") => {
    setTrigger(t);
    setIsOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, trigger, showUpgrade, closeUpgrade };
}
