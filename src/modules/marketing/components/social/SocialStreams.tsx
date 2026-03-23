import { useState, useEffect, useRef } from "react";
import { Plus, X, GripVertical, FileText, CalendarDays, Send, MessageCircle, Hash, Bell, AlertCircle, CheckCircle, Sparkles, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { getPlatformConfig, STREAM_TYPES } from "./constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamConfig {
  id: string;
  type: string;
  platform?: string;
  label: string;
}

const STREAM_ICONS: Record<string, any> = {
  drafts: FileText,
  in_review: AlertCircle,
  scheduled: CalendarDays,
  published: Send,
  failed: AlertCircle,
  comments: MessageCircle,
  mentions: Bell,
  hashtags: Hash,
};

interface Props {
  onViewPost: (post: SocialPost) => void;
  onCompose?: (data: { content: string; hashtags: string[]; imageUrl?: string }) => void;
}

interface SuggestedPost {
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_url: string;
  style: string;
}

export default function SocialStreams({ onViewPost, onCompose }: Props) {
  const { data: posts = [] } = useSocialPosts();
  const [streams, setStreams] = useState<StreamConfig[]>([
    { id: "1", type: "drafts", label: "Drafts" },
    { id: "2", type: "in_review", label: "In Review" },
    { id: "3", type: "scheduled", label: "Scheduled" },
    { id: "4", type: "published", label: "Published" },
  ]);

  // Auto-generate a suggested post on mount
  const [suggestedPost, setSuggestedPost] = useState<SuggestedPost | null>(null);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedDismissed, setSuggestedDismissed] = useState(false);
  const hasFetched = useRef(false);

  const fetchSuggestion = async () => {
    setSuggestedLoading(true);
    setSuggestedPost(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-ideas", {
        body: { platforms: ["Instagram", "Facebook"] },
      });
      if (error) throw error;
      const posts = data?.posts ?? [];
      if (posts.length > 0) {
        setSuggestedPost(posts[0]);
      }
    } catch (err) {
      console.error("Auto-suggestion error:", err);
    } finally {
      setSuggestedLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchSuggestion();
    }
  }, []);

  const handleUseSuggestion = () => {
    if (!suggestedPost || !onCompose) return;
    const hashtagStr = suggestedPost.hashtags.map(h => `#${h}`).join(" ");
    const fullContent = `${suggestedPost.caption}\n\n${suggestedPost.cta}\n\n${hashtagStr}`;
    onCompose({ content: fullContent, hashtags: suggestedPost.hashtags, imageUrl: suggestedPost.image_url });
    toast.success("Post loaded into Compose — edit and publish!");
  };

  const addStream = () => {
    setStreams(prev => [...prev, { id: String(Date.now()), type: "drafts", label: "New Stream" }]);
  };

  const removeStream = (id: string) => setStreams(prev => prev.filter(s => s.id !== id));

  const updateStreamType = (id: string, type: string) => {
    const cfg = STREAM_TYPES.find(s => s.value === type);
    setStreams(prev => prev.map(s => s.id === id ? { ...s, type, label: cfg?.label ?? type } : s));
  };

  const getStreamPosts = (stream: StreamConfig) => {
    const cfg = STREAM_TYPES.find(s => s.value === stream.type);
    if (!cfg) return [];
    return posts.filter(cfg.filterFn);
  };

  return (
    <div className="space-y-3">
      {/* AI Suggested Post Card */}
      {!suggestedDismissed && (suggestedLoading || suggestedPost) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Today's Suggested Post</span>
              <Badge variant="secondary" className="text-[9px] h-4">AI</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchSuggestion()} disabled={suggestedLoading}>
                <RefreshCw className={`h-3 w-3 ${suggestedLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSuggestedDismissed(true)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {suggestedLoading ? (
            <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Crafting a post idea for you…</span>
            </div>
          ) : suggestedPost ? (
            <div className="flex gap-3">
              {suggestedPost.image_url && (
                <img
                  src={suggestedPost.image_url}
                  alt=""
                  className="w-24 h-24 rounded-lg object-cover shrink-0"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-medium text-foreground">{suggestedPost.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{suggestedPost.caption}</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedPost.hashtags.slice(0, 4).map(h => (
                    <span key={h} className="text-[9px] text-primary/70">#{h}</span>
                  ))}
                </div>
                {onCompose && (
                  <Button size="sm" className="h-7 text-xs gap-1 mt-1" onClick={handleUseSuggestion}>
                    <ArrowRight className="h-3 w-3" /> Use & Edit in Compose
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Monitor different content streams. Add columns for each feed.</p>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addStream}>
          <Plus className="h-3 w-3" /> Add Stream
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 min-w-max pb-4">
          {streams.map(stream => {
            const streamPosts = getStreamPosts(stream);
            const StreamIcon = STREAM_ICONS[stream.type] ?? FileText;
            const isPlaceholder = ["comments", "mentions", "hashtags"].includes(stream.type);
            return (
              <div key={stream.id} className="w-[280px] flex-shrink-0 rounded-xl border border-border bg-card">
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
                <ScrollArea className="h-[500px]">
                  <div className="p-2 space-y-2">
                    {!isPlaceholder && streamPosts.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-xs text-muted-foreground">No posts in this stream</p>
                      </div>
                    )}
                    {!isPlaceholder && streamPosts.map(post => {
                      const platforms = ((post.platforms_json as any) || []) as string[];
                      return (
                        <button
                          key={post.id}
                          onClick={() => onViewPost(post)}
                          className="w-full text-left rounded-lg border border-border p-2.5 hover:bg-accent/50 transition-colors"
                        >
                          {post.media_urls && post.media_urls.length > 0 && (
                            <div className="rounded-md overflow-hidden mb-2 aspect-video bg-muted">
                              <img
                                src={post.media_urls[0]}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                          )}
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
                    })}
                    {isPlaceholder && (
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
