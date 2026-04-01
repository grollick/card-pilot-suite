import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles, Loader2, RefreshCw, ArrowRight, Send, Save, Clock, Hash,
  Image, Upload, Check, Wand2, X, CalendarDays, BarChart3, Eye,
  FileText, CheckCircle, AlertCircle, MoreHorizontal, Trash2, Edit3, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSocialPosts, useCreatePost, useUpdatePost, useDeletePost } from "@/hooks/useSocialPosts";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { PLATFORMS, getPlatformConfig, getStatusConfig, deriveDbStatus } from "./constants";
import { useSocialPostLimits } from "./SocialPlanGate";
import PostDetailDrawer from "./PostDetailDrawer";

interface PostIdea {
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_url: string;
  image_query: string;
  style: string;
}

const STYLE_EMOJI: Record<string, string> = {
  showcase: "📸", educational: "💡", promotional: "🎯", personal: "🎬",
};

export default function SocialDashboard() {
  const { user } = useAuth();
  const { data: posts = [], isLoading: postsLoading } = useSocialPosts();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const socialLimits = useSocialPostLimits();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI suggestions
  const [suggestions, setSuggestions] = useState<PostIdea[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const hasFetched = useRef(false);

  // Quick compose
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [uploading, setUploading] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  // Detail drawer
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);

  // Posts filter
  const [postsTab, setPostsTab] = useState("all");

  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-ideas", {
        body: { platforms: ["Instagram", "Facebook"], count: 4 },
      });
      if (error) throw error;
      setSuggestions(data?.posts ?? []);
    } catch (err) {
      console.error("AI suggestion error:", err);
      toast.error("Couldn't generate suggestions. Try again.");
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchSuggestions();
    }
  }, [fetchSuggestions]);

  const useSuggestion = (idea: PostIdea) => {
    const hashtagStr = idea.hashtags.join(", ");
    setContent(`${idea.caption}\n\n${idea.cta}`);
    setHashtags(hashtagStr);
    setImageUrl(idea.image_url);
    setEditingPost(null);
    toast.success("Post loaded — edit and publish!");
    // Scroll to compose
    document.getElementById("quick-compose")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/social/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("card-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("card-assets").getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  }, [user]);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const resetCompose = () => {
    setContent(""); setHashtags(""); setImageUrl("");
    setSelectedPlatforms(["Instagram", "Facebook"]);
    setScheduledDate(undefined); setScheduledTime("10:00");
    setEditingPost(null);
  };

  const handlePublish = async (asDraft = false) => {
    if (!content.trim()) { toast.error("Write some content first"); return; }
    if (selectedPlatforms.length === 0) { toast.error("Pick at least one platform"); return; }

    if (!editingPost && socialLimits.isAtLimit) {
      toast.error(`Monthly post limit reached (${socialLimits.monthlyLimit}).`);
      return;
    }

    let scheduled_at: string | null = null;
    if (scheduledDate && !asDraft) {
      const [h, m] = scheduledTime.split(":").map(Number);
      const d = new Date(scheduledDate);
      d.setHours(h, m, 0, 0);
      scheduled_at = d.toISOString();
    }

    const hashtagArr = hashtags.split(",").map(s => s.trim()).filter(Boolean);
    const hashtagStr = hashtagArr.map(h => `#${h}`).join(" ");
    const finalContent = hashtagStr ? `${content}\n\n${hashtagStr}` : content;

    const approvalStatus = asDraft ? "draft" : (scheduled_at ? "scheduled" : "published");

    try {
      const payload = {
        content: finalContent,
        platforms_json: selectedPlatforms,
        scheduled_at,
        status: deriveDbStatus(approvalStatus as any),
        approval_status: approvalStatus,
        media_urls: imageUrl ? [imageUrl] : null,
      };

      if (editingPost) {
        await updatePost.mutateAsync({ id: editingPost.id, ...payload } as any);
        toast.success("Post updated!");
      } else {
        await createPost.mutateAsync(payload as any);
        toast.success(asDraft ? "Saved as draft!" : scheduled_at ? "Post scheduled!" : "Post published!");
      }
      resetCompose();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEditPost = (post: SocialPost) => {
    setEditingPost(post);
    setContent(post.content);
    setSelectedPlatforms((post.platforms_json as any) || ["Instagram"]);
    if (post.media_urls?.[0]) setImageUrl(post.media_urls[0]);
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at);
      setScheduledDate(d);
      setScheduledTime(format(d, "HH:mm"));
    }
    document.getElementById("quick-compose")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDuplicate = async (post: SocialPost) => {
    try {
      await createPost.mutateAsync({
        content: post.content,
        platforms_json: post.platforms_json,
        status: "draft",
        approval_status: "draft",
        media_urls: post.media_urls,
      } as any);
      toast.success("Post duplicated as draft!");
    } catch (e: any) { toast.error(e.message); }
  };

  const filteredPosts = posts.filter(p => {
    if (postsTab === "all") return true;
    if (postsTab === "drafts") return ["idea", "draft"].includes(p.approval_status ?? "draft");
    if (postsTab === "scheduled") return p.status === "scheduled";
    if (postsTab === "published") return p.status === "published";
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ─── AI Suggestions ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Ready to Post</h2>
            <Badge variant="secondary" className="text-[10px]">AI</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={fetchSuggestions}
            disabled={suggestionsLoading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", suggestionsLoading && "animate-spin")} />
            {suggestionsLoading ? "Generating..." : "New Ideas"}
          </Button>
        </div>

        {suggestionsLoading && suggestions.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {suggestions.map((idea, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer border-border hover:border-primary/30">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  <img
                    src={idea.image_url}
                    alt={idea.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(idea.image_query || idx.toString())}/800/600`;
                    }}
                  />
                  <Badge className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm text-foreground border-border">
                    {STYLE_EMOJI[idea.style] || "📝"} {idea.style}
                  </Badge>
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-semibold leading-tight line-clamp-1">{idea.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{idea.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {idea.hashtags.slice(0, 3).map(h => (
                      <span key={h} className="text-[9px] text-primary/70">#{h}</span>
                    ))}
                    {idea.hashtags.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{idea.hashtags.length - 3}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5"
                    onClick={() => useSuggestion(idea)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" /> Use This Post
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Wand2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Click "New Ideas" to get AI-crafted posts tailored to your business</p>
          </Card>
        )}
      </section>

      <Separator />

      {/* ─── Quick Compose ─── */}
      <section id="quick-compose">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            {editingPost ? "Edit Post" : "Quick Compose"}
          </h2>
          {editingPost && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={resetCompose}>
              <X className="h-3 w-3 mr-1" /> Cancel Edit
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Platforms */}
            <div className="flex gap-1.5 flex-wrap">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    selectedPlatforms.includes(p.id)
                      ? `${p.color} ${p.borderColor} font-medium`
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {p.id}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4">
              <div className="space-y-3">
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="What do you want to share? Write your post or use an AI suggestion above..."
                  rows={4}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={hashtags}
                      onChange={e => setHashtags(e.target.value)}
                      placeholder="Hashtags (comma-separated)"
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
                {imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-border aspect-square bg-muted group">
                    <img
                      src={imageUrl}
                      alt="Post image"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => setImageUrl("")}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-full min-h-[100px] border-dashed flex flex-col gap-1 text-xs text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Image className="h-5 w-5" />
                    {uploading ? "Uploading…" : "Add Image"}
                  </Button>
                )}
              </div>
            </div>

            {/* Schedule + Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              {socialLimits.canSchedule && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", scheduledDate && "text-primary border-primary/30")}>
                      <CalendarDays className="h-3.5 w-3.5" />
                      {scheduledDate ? format(scheduledDate, "MMM d") : "Schedule"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                    <div className="px-3 pb-3">
                      <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <div className="flex-1" />

              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handlePublish(true)}>
                <Save className="h-3.5 w-3.5" /> Save Draft
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => handlePublish(false)}
                disabled={createPost.isPending || updatePost.isPending || !content.trim()}
              >
                {(createPost.isPending || updatePost.isPending) ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : scheduledDate ? (
                  <Clock className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {editingPost ? "Update" : scheduledDate ? "Schedule" : "Publish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ─── Your Posts ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Your Posts
          </h2>
          {socialLimits.monthlyLimit !== -1 && (
            <span className={cn("text-xs", socialLimits.isAtLimit ? "text-destructive font-medium" : "text-muted-foreground")}>
              {socialLimits.postsThisMonth}/{socialLimits.monthlyLimit} this month
            </span>
          )}
        </div>

        <Tabs value={postsTab} onValueChange={setPostsTab}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs h-7">All ({posts.length})</TabsTrigger>
            <TabsTrigger value="drafts" className="text-xs h-7">
              Drafts ({posts.filter(p => ["idea", "draft"].includes(p.approval_status ?? "draft")).length})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="text-xs h-7">
              Scheduled ({posts.filter(p => p.status === "scheduled").length})
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs h-7">
              Published ({posts.filter(p => p.status === "published").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={postsTab} className="mt-3">
            {postsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {postsTab === "all" ? "No posts yet. Use an AI suggestion or write your own!" : `No ${postsTab} posts.`}
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredPosts.slice(0, 20).map(post => {
                  const platforms = ((post.platforms_json as any) || []) as string[];
                  const statusCfg = getStatusConfig(post.approval_status || "draft");
                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer group"
                      onClick={() => setDetailPost(post)}
                    >
                      {post.media_urls?.[0] && (
                        <img
                          src={post.media_urls[0]}
                          alt=""
                          className="w-16 h-16 rounded-md object-cover shrink-0"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 leading-relaxed">{post.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className={cn("text-[9px] h-5", statusCfg.color)}>
                            {statusCfg.label}
                          </Badge>
                          {platforms.slice(0, 3).map(p => {
                            const cfg = getPlatformConfig(p);
                            return <span key={p} className={cn("text-[9px] px-1.5 py-0.5 rounded-full", cfg?.color)}>{p}</span>;
                          })}
                          {post.scheduled_at && (
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              <CalendarDays className="h-3 w-3 inline mr-0.5" />
                              {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditPost(post); }}>
                            <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(post); }}>
                            <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePost.mutate(post.id, { onSuccess: () => toast.success("Post deleted") });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                {filteredPosts.length > 20 && (
                  <p className="text-xs text-center text-muted-foreground py-2">
                    Showing 20 of {filteredPosts.length} posts
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <PostDetailDrawer
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onEdit={(post) => { setDetailPost(null); handleEditPost(post); }}
      />
    </div>
  );
}
