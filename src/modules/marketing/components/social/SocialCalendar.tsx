import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, addMonths, subMonths, isToday,
} from "date-fns";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { getPlatformConfig, getStatusConfig } from "./constants";
import { cn } from "@/lib/utils";

interface Props {
  onNewPost: () => void;
  onViewPost: (post: SocialPost) => void;
}

export default function SocialCalendar({ onNewPost, onViewPost }: Props) {
  const { data: posts = [] } = useSocialPosts();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const postsByDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    posts.forEach(p => {
      if (!p.scheduled_at) return;
      const key = format(new Date(p.scheduled_at), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    });
    return map;
  }, [posts]);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold min-w-[140px] text-center">{format(currentMonth, "MMMM yyyy")}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={v => setView(v as any)}>
            <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50">
          {weekdays.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground border-r border-border last:border-r-0">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[90px] border-r border-b border-border last:border-r-0 p-1 transition-colors group",
                  !inMonth && "bg-muted/30",
                  isToday(day) && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full",
                    isToday(day) && "bg-primary text-primary-foreground",
                    !inMonth && "text-muted-foreground"
                  )}>{format(day, "d")}</span>
                  {inMonth && (
                    <button onClick={onNewPost} className="h-4 w-4 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map(post => {
                    const platforms = ((post.platforms_json as any) || []) as string[];
                    const cfg = getPlatformConfig(platforms[0]);
                    const statusCfg = getStatusConfig(post.approval_status ?? "draft");
                    return (
                      <button
                        key={post.id}
                        onClick={() => onViewPost(post)}
                        className={cn("w-full text-left text-[9px] px-1 py-0.5 rounded truncate flex items-center gap-1", cfg?.color ?? "bg-muted text-muted-foreground")}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", statusCfg.dotColor)} />
                        {post.content.slice(0, 25)}
                      </button>
                    );
                  })}
                  {dayPosts.length > 3 && <span className="text-[9px] text-muted-foreground pl-1">+{dayPosts.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
