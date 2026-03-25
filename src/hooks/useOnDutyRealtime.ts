import { useEffect, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DutyRealtimeEvent {
  userId: string;
  isOnDuty: boolean;
  timestamp: number;
}

/**
 * Subscribes to realtime duty status changes.
 * Simplified: debounces rapid events with a 3s cooldown.
 * Returns the latest event for UI animations/notifications.
 */
export function useOnDutyRealtime() {
  const qc = useQueryClient();
  const [latestEvent, setLatestEvent] = useState<DutyRealtimeEvent | null>(null);

  const handlePayload = useCallback((payload: any) => {
    const row = payload.new as any;
    if (!row) return;

    const event: DutyRealtimeEvent = {
      userId: row.user_id,
      isOnDuty: row.is_on_duty,
      timestamp: Date.now(),
    };

    setLatestEvent(event);
    qc.invalidateQueries({ queryKey: ["on-duty-map"] });
  }, [qc]);

  useEffect(() => {
    const channel = supabase
      .channel("duty-status-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estimate_duty_status" },
        handlePayload
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handlePayload]);

  const clearEvent = useCallback(() => setLatestEvent(null), []);

  return { latestEvent, clearEvent };
}
