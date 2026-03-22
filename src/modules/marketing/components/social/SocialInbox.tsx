import { useState } from "react";
import { Inbox, MessageCircle, Heart, Share2, AtSign, Filter, RefreshCw, CheckCheck, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type InboxFilter = "all" | "comments" | "mentions" | "likes" | "shares";

interface MockEngagement {
  id: string;
  type: "comment" | "mention" | "like" | "share";
  platform: string;
  author: string;
  avatar: string;
  content: string;
  postPreview: string;
  time: string;
  read: boolean;
}

// Mock data — will be replaced with real API data when platforms are connected
const MOCK_ENGAGEMENTS: MockEngagement[] = [
  { id: "1", type: "comment", platform: "Instagram", author: "Sarah M.", avatar: "SM", content: "Love this transformation! How long did it take?", postPreview: "Before & after kitchen remodel...", time: "2h ago", read: false },
  { id: "2", type: "mention", platform: "Facebook", author: "Mike's Plumbing", avatar: "MP", content: "@yourbusiness great work on the Johnson project!", postPreview: "", time: "4h ago", read: false },
  { id: "3", type: "comment", platform: "LinkedIn", author: "David R.", avatar: "DR", content: "Very professional results. Do you service the downtown area?", postPreview: "5 tips for choosing a contractor...", time: "6h ago", read: true },
  { id: "4", type: "like", platform: "Instagram", author: "HomeOwnerMag", avatar: "HM", content: "Liked your post", postPreview: "Summer special: 15% off...", time: "8h ago", read: true },
  { id: "5", type: "share", platform: "Facebook", author: "Lisa W.", avatar: "LW", content: "Shared your post to their timeline", postPreview: "Check out our latest bathroom...", time: "1d ago", read: true },
  { id: "6", type: "comment", platform: "Google Business", author: "James T.", avatar: "JT", content: "Can you provide a quote for a similar project?", postPreview: "Commercial flooring project...", time: "1d ago", read: false },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  comment: MessageCircle,
  mention: AtSign,
  like: Heart,
  share: Share2,
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-600",
  Facebook: "bg-blue-500/10 text-blue-600",
  LinkedIn: "bg-sky-600/10 text-sky-700",
  "Google Business": "bg-red-500/10 text-red-600",
};

export default function SocialInbox() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [engagements, setEngagements] = useState(MOCK_ENGAGEMENTS);
  const [selected, setSelected] = useState<string | null>(null);

  const filterMap: Record<InboxFilter, string | null> = { all: null, comments: "comment", mentions: "mention", likes: "like", shares: "share" };
  const filtered = engagements.filter(e => !filterMap[filter] || e.type === filterMap[filter]);
  const unreadCount = engagements.filter(e => !e.read).length;
  const selectedItem = engagements.find(e => e.id === selected);

  const markRead = (id: string) => {
    setEngagements(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const markAllRead = () => {
    setEngagements(prev => prev.map(e => ({ ...e, read: true })));
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-0 rounded-xl border border-border overflow-hidden bg-background">
      {/* Left: message list */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Inbox className="h-4 w-4" /> Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1.5">{unreadCount}</Badge>
              )}
            </h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markAllRead} title="Mark all read">
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Refresh">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as InboxFilter)}>
            <TabsList className="w-full h-8">
              <TabsTrigger value="all" className="text-xs flex-1">All</TabsTrigger>
              <TabsTrigger value="comments" className="text-xs flex-1">Comments</TabsTrigger>
              <TabsTrigger value="mentions" className="text-xs flex-1">Mentions</TabsTrigger>
              <TabsTrigger value="likes" className="text-xs flex-1">Likes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">No messages</p>
            </div>
          ) : (
            filtered.map(item => {
              const Icon = TYPE_ICONS[item.type] || MessageCircle;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSelected(item.id); markRead(item.id); }}
                  className={cn(
                    "w-full text-left p-3 border-b border-border transition-colors",
                    selected === item.id ? "bg-accent" : "hover:bg-muted/50",
                    !item.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {item.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("text-xs font-semibold truncate", !item.read && "text-foreground")}>
                          {item.author}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.content}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", PLATFORM_COLORS[item.platform] || "bg-muted")}>
                          {item.platform}
                        </span>
                      </div>
                    </div>
                    {!item.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Right: detail view */}
      <div className="flex-1 flex flex-col">
        {selectedItem ? (
          <>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {selectedItem.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedItem.author}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", PLATFORM_COLORS[selectedItem.platform])}>
                        {selectedItem.platform}
                      </span>
                      <span className="text-xs text-muted-foreground">{selectedItem.time}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="max-w-lg">
                <p className="text-sm leading-relaxed">{selectedItem.content}</p>
                {selectedItem.postPreview && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">In response to:</p>
                    <p className="text-sm">{selectedItem.postPreview}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  placeholder="Type your reply..."
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button size="sm" className="h-9">Reply</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Inbox className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Select a message</p>
            <p className="text-xs mt-1">Choose an engagement to view details and respond</p>
          </div>
        )}
      </div>
    </div>
  );
}
