import { useState } from "react";
import { Plus, X, Settings, GripVertical, FileText, CalendarDays, Send, MessageCircle, Hash, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useSocialPosts, type SocialPostExtended } from "@/hooks/useSocial";
import { getPlatformConfig } from "./constants";

interface StreamConfig {
  id: string;
  type: string;
  platform?: string;
  label: string;
}

const STREAM_TYPES = [
  { value: "drafts", label: "Drafts", icon: FileText },
  { value: "scheduled", label: "Scheduled", icon: CalendarDays },
  { value: "published", label: "Published", icon: Send },
  { value: "comments", label: "Comments", icon: MessageCircle },
  { value: "mentions", label: "Mentions", icon: Bell },
  { value: "hashtags", label: "Hashtag Monitor", icon: Hash },
];

interface Props {
  onViewPost: (post: SocialPostExtended) => void;
}

export default function SocialStreams({ onViewPost }: Props) {
  const { data: posts = [] } = useSocialPosts();
  const [streams, setStreams] = useState<StreamConfig[]>([
    { id: "1", type: "drafts", label: "Drafts" },
    { id: "2", type: "scheduled", label: "Scheduled" },
    { id: "3", type: "published", label: "Published" },
  ]);

  const addStream = () => {
    setStreams(prev => [...prev, {
      id: String(Date.now()),
      type: "drafts",
      label: "New Stream",
    }]);
  };

  const removeStream = (id: string) => {
    setStreams(prev => prev.filter(s => s.id !== id));
  };

  const updateStreamType = (id: string, type: string) => {
    const cfg = STREAM_TYPES.find(s => s.value === type);
    setStreams(prev => prev.map(s =>
      s.id === id ? { ...s, type, label: cfg?.label ?? type } : s
    ));
  };

  const getStreamPosts = (stream: StreamConfig) => {
    switch (stream.type) {
      case "drafts": return posts.filter(p => p.status === "draft");
      case "scheduled": return posts.filter(p => p.status === "scheduled");
      case "published": return posts.filter(p => p.status === "published");
      default: return [];
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Drag columns to reorder. Add streams to monitor different feeds.</p>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addStream}>
          <Plus className="h-3 w-3" /> Add Stream
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 min-w-max pb-4">
          {streams.map(stream => {
            const streamPosts = getStreamPosts(stream);
            const StreamIcon = STREAM_TYPES.find(s => s.value === stream.type)?.icon ?? FileText;
            return (
              <div key={stream.id} className="w-[280px] flex-shrink-0 rounded-xl border border-border bg-card">
                {/* Stream Header */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                    <StreamIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={stream.type} onValueChange={v => updateStreamType(stream.id, v)}>
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-xs font-medium shadow-none w-auto gap-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STREAM_TYPES.map(st => (
                          <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{streamPosts.length}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStream(stream.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Stream Content */}
                <ScrollArea className="h-[500px]">
                  <div className="p-2 space-y-2">
                    {streamPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-muted-foreground">No posts in this stream</p>
                      </div>
                    ) : (
                      streamPosts.map(post => {
                        const platforms = ((post.platforms_json as any) || []) as string[];
                        return (
                          <button
                            key={post.id}
                            onClick={() => onViewPost(post)}
                            className="w-full text-left rounded-lg border border-border p-2.5 hover:bg-accent/50 transition-colors"
                          >
                            <p className="text-[11px] line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              {platforms.slice(0, 2).map(p => {
                                const cfg = getPlatformConfig(p);
                                return <span key={p} className={`text-[8px] px-1.5 py-0.5 rounded-full ${cfg?.color}`}>{p}</span>;
                              })}
                              {post.scheduled_at && (
                                <span className="text-[9px] text-muted-foreground ml-auto">
                                  {format(new Date(post.scheduled_at), "MMM d")}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}

                    {/* Placeholder for engagement streams */}
                    {["comments", "mentions", "hashtags"].includes(stream.type) && (
                      <div className="text-center py-8 space-y-2">
                        <StreamIcon className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                        <p className="text-xs text-muted-foreground">
                          {stream.type === "comments" && "Comments will appear here when accounts are connected via API."}
                          {stream.type === "mentions" && "Mentions will appear here when accounts are connected via API."}
                          {stream.type === "hashtags" && "Hashtag monitoring will be available when accounts are connected via API."}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
