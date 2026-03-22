import { cn } from "@/lib/utils";
import {
  LayoutGrid, PenLine, CalendarDays, BarChart3, Inbox, Upload,
  Megaphone, Newspaper, Rocket, Settings, Crown, Layers
} from "lucide-react";
import { ProBadge } from "./SocialPlanGate";

export type SocialView =
  | "streams" | "compose" | "calendar" | "planner"
  | "campaigns" | "feed" | "analytics" | "inbox"
  | "bulk" | "dfy";

interface NavItem {
  id: SocialView;
  label: string;
  icon: React.ElementType;
  section: "publish" | "engage" | "analyze" | "grow";
  locked?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "streams", label: "Streams", icon: LayoutGrid, section: "publish" },
  { id: "compose", label: "Compose", icon: PenLine, section: "publish" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, section: "publish" },
  { id: "planner", label: "Planner", icon: Layers, section: "publish" },
  { id: "bulk", label: "Bulk Import", icon: Upload, section: "publish" },
  { id: "inbox", label: "Inbox", icon: Inbox, section: "engage" },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, section: "grow" },
  { id: "feed", label: "Content Feed", icon: Newspaper, section: "grow" },
  { id: "dfy", label: "Done-For-You", icon: Rocket, section: "grow" },
  { id: "analytics", label: "Analytics", icon: BarChart3, section: "analyze" },
];

const SECTIONS = [
  { key: "publish", label: "Publishing" },
  { key: "engage", label: "Engagement" },
  { key: "grow", label: "Growth" },
  { key: "analyze", label: "Insights" },
];

interface Props {
  activeView: SocialView;
  onChangeView: (view: SocialView) => void;
  lockedFeatures?: Set<string>;
  collapsed?: boolean;
}

export default function SocialSidebar({ activeView, onChangeView, lockedFeatures = new Set(), collapsed }: Props) {
  return (
    <aside className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-200",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Brand header */}
      <div className="flex items-center gap-2 px-3 h-12 border-b border-sidebar-border">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <LayoutGrid className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="text-sm tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal text-sidebar-foreground">Social</span></span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-4">
        {SECTIONS.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section.key);
          if (items.length === 0) return null;
          return (
            <div key={section.key}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/50">
                  {section.label}
                </p>
              )}
              {items.map(item => {
                const isActive = activeView === item.id;
                const isLocked = lockedFeatures.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onChangeView(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      item.id === "dfy" && !isActive && "text-primary"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {isLocked && <ProBadge tier={item.id === "dfy" ? "Pro Plus" : "Pro"} />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
