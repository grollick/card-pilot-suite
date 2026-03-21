import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DutyRealtimeEvent {
  userId: string;
  isOnDuty: boolean;
  timestamp: number;
}

/**
 * Subscribes to realtime duty status changes.
 * Throttles events to max 1 per 3 seconds, batches rapid updates.
 * Returns the latest event for UI animations/notifications.
 */
export function useOnDutyRealtime() {
  const qc = useQueryClient();
  const [latestEvent, setLatestEvent] = useState<DutyRealtimeEvent | null>(null);
  const throttleRef = useRef<number>(0);
  const pendingRef = useRef<DutyRealtimeEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const THROTTLE_MS = 3000;

  const processEvent = useCallback((event: DutyRealtimeEvent) => {
    setLatestEvent(event);
    // Invalidate the query to refetch map data
    qc.invalidateQueries({ queryKey: ["on-duty-map"] });
  }, [qc]);

  const handlePayload = useCallback((payload: any) => {
    const row = payload.new as any;
    if (!row) return;

    const event: DutyRealtimeEvent = {
      userId: row.user_id,
      isOnDuty: row.is_on_duty,
      timestamp: Date.now(),
    };

    const now = Date.now();
    const elapsed = now - throttleRef.current;

    if (elapsed >= THROTTLE_MS) {
      // Process immediately
      throttleRef.current = now;
      processEvent(event);
    } else {
      // Queue for later
      pendingRef.current = event;
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (pendingRef.current) {
            throttleRef.current = Date.now();
            processEvent(pendingRef.current);
            pendingRef.current = null;
          }
        }, THROTTLE_MS - elapsed);
      }
    }
  }, [processEvent]);

  useEffect(() => {
    const channel = supabase
      .channel("duty-status-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "estimate_duty_status",
        },
        handlePayload
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "estimate_duty_status",
        },
        handlePayload
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handlePayload]);

  const clearEvent = useCallback(() => setLatestEvent(null), []);

  return { latestEvent, clearEvent };
}
