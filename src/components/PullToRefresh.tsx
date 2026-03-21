import { useState, useRef, useCallback, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const THRESHOLD = 80;
const MAX_PULL = 120;
const DEAD_ZONE = 10; // Minimum px before pull activates

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const activated = useRef(false); // true only after exceeding dead zone
  const tracking = useRef(false); // true when we might pull
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    tracking.current = true;
    activated.current = false;
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tracking.current) return;
    const delta = e.touches[0].clientY - startY.current;

    // If swiping up, abort
    if (delta < 0) {
      tracking.current = false;
      activated.current = false;
      setPullDistance(0);
      return;
    }

    // Don't activate until past dead zone
    if (!activated.current) {
      if (delta < DEAD_ZONE) return;
      activated.current = true;
    }

    const dampened = Math.min((delta - DEAD_ZONE) * 0.5, MAX_PULL);
    setPullDistance(dampened);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!activated.current) {
      // Was just a tap or small movement — don't interfere
      tracking.current = false;
      return;
    }

    tracking.current = false;
    activated.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      await queryClient.invalidateQueries();
      await new Promise((r) => setTimeout(r, 400));
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, queryClient]);

  const showIndicator = pullDistance > 5 || refreshing;
  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="flex items-center justify-center pointer-events-none"
          style={{
            height: pullDistance,
            transition: activated.current ? "none" : "height 0.25s ease-out",
          }}
        >
          <div
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shadow-sm border border-border"
            style={{ opacity: progress }}
          >
            <RefreshCw
              className={`h-4 w-4 text-primary ${refreshing ? "animate-spin" : ""}`}
              style={{
                transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
                transition: activated.current ? "none" : "transform 0.2s ease-out",
              }}
            />
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
