import { useState, useRef, useCallback, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    // Dampen the pull
    const dampened = Math.min(delta * 0.5, MAX_PULL);
    setPullDistance(dampened);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current && pullDistance === 0) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      await queryClient.invalidateQueries();
      // Small delay for visual feedback
      await new Promise((r) => setTimeout(r, 400));
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, queryClient]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || refreshing;

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
          style={{ height: pullDistance, transition: pulling.current ? "none" : "height 0.25s ease-out" }}
        >
          <div
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shadow-sm border border-border"
            style={{ opacity: progress }}
          >
            <RefreshCw
              className={`h-4 w-4 text-primary ${refreshing ? "animate-spin" : ""}`}
              style={{
                transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
                transition: pulling.current ? "none" : "transform 0.2s ease-out",
              }}
            />
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
