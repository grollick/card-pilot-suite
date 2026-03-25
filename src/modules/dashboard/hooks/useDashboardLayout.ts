import { useState, useCallback, useEffect } from "react";

export type WidgetSize = "full" | "half" | "third" | "two-thirds" | "three-fifths" | "two-fifths";

export interface WidgetConfig {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  size: WidgetSize;
  order: number;
  /** Some widgets are always visible and can't be hidden */
  locked?: boolean;
}

const STORAGE_KEY = "guzzl-dashboard-layout-v2";

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "opportunity-alert", label: "Opportunity Alert", icon: "Bell", visible: true, size: "full", order: 0, locked: true },
  { id: "hero-header", label: "Welcome Header", icon: "Sparkles", visible: true, size: "full", order: 1, locked: true },
  { id: "estimate-duty", label: "Estimate Duty", icon: "Shield", visible: true, size: "full", order: 2 },
  { id: "first-lead-guarantee", label: "First Lead Guarantee", icon: "Target", visible: true, size: "full", order: 3 },
  { id: "first-lead-assistant", label: "First Lead Assistant", icon: "Rocket", visible: true, size: "full", order: 4 },
  { id: "kpi-cards", label: "Revenue KPIs", icon: "TrendingUp", visible: true, size: "full", order: 5 },
  { id: "ai-coach", label: "AI Business Coach", icon: "Brain", visible: true, size: "three-fifths", order: 6 },
  { id: "health-score", label: "Business Health", icon: "Heart", visible: true, size: "two-fifths", order: 7 },
{ id: "quick-actions", label: "Jobs & Photo Quick Actions", icon: "Zap", visible: true, size: "full", order: 8 }
  { id: "next-actions", label: "Next Actions", icon: "ListChecks", visible: true, size: "full", order: 9 },
  { id: "daily-notes", label: "Daily Notes", icon: "StickyNote", visible: true, size: "half", order: 10 },
  { id: "activity-feed", label: "Activity Feed", icon: "Activity", visible: true, size: "half", order: 11 },
  { id: "growth-trends", label: "Growth Trends", icon: "BarChart3", visible: true, size: "full", order: 12 },
];

const SIZE_OPTIONS: WidgetSize[] = ["full", "half", "third", "two-thirds", "three-fifths", "two-fifths"];

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetConfig[];
        // Merge with defaults to pick up any new widgets
        const savedIds = new Set(parsed.map(w => w.id));
        const merged = [
          ...parsed,
          ...DEFAULT_WIDGETS.filter(d => !savedIds.has(d.id)),
        ];
        return merged.sort((a, b) => a.order - b.order);
      }
    } catch {}
    return DEFAULT_WIDGETS;
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const toggleVisibility = useCallback((id: string) => {
    setWidgets(prev => prev.map(w =>
      w.id === id && !w.locked ? { ...w, visible: !w.visible } : w
    ));
  }, []);

  const resizeWidget = useCallback((id: string, size: WidgetSize) => {
    setWidgets(prev => prev.map(w =>
      w.id === id ? { ...w, size } : w
    ));
  }, []);

  const cycleSize = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      const idx = SIZE_OPTIONS.indexOf(w.size);
      const next = SIZE_OPTIONS[(idx + 1) % SIZE_OPTIONS.length];
      return { ...w, size: next };
    }));
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setWidgets(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const moveWidget = useCallback((id: string, direction: "up" | "down") => {
    setWidgets(prev => {
      const idx = prev.findIndex(w => w.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    widgets,
    isEditing,
    setIsEditing,
    toggleVisibility,
    resizeWidget,
    cycleSize,
    reorder,
    moveWidget,
    resetLayout,
    SIZE_OPTIONS,
  };
}
