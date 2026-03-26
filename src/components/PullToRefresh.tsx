import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

const THRESHOLD = 80;
const MAX_PULL = 120;
const DEAD_ZONE = 15;

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const disablePullToRefresh = pathname.startsWith("/app/scan-card");
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const activated = useRef(false);
  const tracking = useRef(false);

  useEffect(() => {
    if (!disablePullToRefresh) return;
    tracking.current = false;
    activated.current = false;
    setPullDistance(0);
    setRefreshing(false);
  }, [disablePullToRefresh]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disablePullToRefresh) return;

      // Only allow pull when scrolled to the very top
      const scrollTop =
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        (e.currentTarget as HTMLElement).scrollTop;
      if (scrollTop > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
      activated.current = false;
    },
    [disablePullToRefresh, refreshing]
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (disablePullToRefresh || !tracking.current) return;
    const delta = e.touches[0].clientY - startY.current;

    if (delta < 0) {
      tracking.current = false;
      activated.current = false;
      setPullDistance(0);
      return;
    }

    if (!activated.current) {
      if (delta < DEAD_ZONE) return;
      activated.current = true;
    }

    const dampened = Math.min((delta - DEAD_ZONE) * 0.4, MAX_PULL);
    setPullDistance(dampened);
  }, [disablePullToRefresh]);

  const onTouchEnd = useCallback(async () => {
    if (disablePullToRefresh) return;

    if (!activated.current) {
      tracking.current = false;
      return;
    }

    tracking.current = false;
    activated.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.5);
      await queryClient.invalidateQueries();
      await new Promise((r) => setTimeout(r, 400));
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [disablePullToRefresh, pullDistance, queryClient]);

  const showIndicator = !disablePullToRefresh && (pullDistance > 5 || refreshing);
  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      className="flex-1 flex flex-col min-w-0"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {showIndicator && (
        <div
          className="flex items-center justify-center pointer-events-none select-none"
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
