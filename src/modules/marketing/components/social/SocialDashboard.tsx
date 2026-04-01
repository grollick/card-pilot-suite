import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Sparkles, Loader2, RefreshCw, ArrowRight, Send, Save, Clock, Hash,
  Image, Upload, Check, Wand2, X, CalendarDays, BarChart3, Eye,
  FileText, CheckCircle, AlertCircle, MoreHorizontal, Trash2, Edit3, Copy,
  Zap, Star, Repeat, Smartphone, Monitor, Layout
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
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

// ── Post Templates ──
const POST_TEMPLATES = [
  { id: "before_after", label: "Before & After", emoji: "🔄", template: "🔄 BEFORE → AFTER\n\nCheck out this transformation!\n\n[Describe the before]\n↓\n[Describe the after]\n\nReady for your own transformation?" },
  { id: "pro_tip", label: "Pro Tip", emoji: "💡", template: "💡 PRO TIP\n\nHere's something most people don't know:\n\n[Share your expert insight]\n\n👉 Save this for later!" },
  { id: "special_offer", label: "Special Offer", emoji: "🎉", template: "🎉 LIMITED TIME OFFER\n\n[Describe your offer]\n\n✅ [Benefit 1]\n✅ [Benefit 2]\n✅ [Benefit 3]\n\n📞 Book now before spots fill up!" },
  { id: "client_review", label: "Client Review", emoji: "⭐", template: "⭐⭐⭐⭐⭐\n\n\"[Client's review quote]\"\n— [Client Name]\n\nThank you for the kind words! We love what we do.\n\n📩 Want results like this? Let's chat!" },
];

// ── Best Time to Post by industry (simplified) ──
const BEST_TIMES = [
  { day: "Mon–Fri", time: "7:00 AM", label: "Morning commute" },
  { day: "Mon–Fri", time: "12:00 PM", label: "Lunch break" },
  { day: "Mon–Fri", time: "6:00 PM", label: "After work" },
  { day: "Sat–Sun", time: "10:00 AM", label: "Weekend morning" },
];

// ── Platform Preview configs ──
const PREVIEW_MODES = [
  { id: "instagram", label: "Instagram", icon: Smartphone, maxChars: 2200, aspect: "aspect-square" },
  { id: "facebook", label: "Facebook", icon: Monitor, maxChars: 63206, aspect: "aspect-video" },
  { id: "linkedin", label: "LinkedIn", icon: Layout, maxChars: 3000, aspect: "aspect-video" },
] as const;

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
  const [isEvergreen, setIsEvergreen] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);

  // Detail drawer
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);

  // Posts filter
  const [postsTab, setPostsTab] = useState("all");

  // ── Quick Stats ──
  const weekStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const thisWeek = posts.filter(p => {
      const d = new Date(p.created_at);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
    return {
      created: thisWeek.length,
      scheduled: posts.filter(p => p.status === "scheduled").length,
      published: thisWeek.filter(p => p.status === "published").length,
    };
  }, [posts]);

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
    document.getElementById("quick-compose")?.scrollIntoView({ behavior: "smooth" });
  };

  const useTemplate = (template: string) => {
    setContent(template);
    setEditingPost(null);
    toast.success("Template loaded — customize it!");
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
    setEditingPost(null); setIsEvergreen(false); setPreviewPlatform(null);
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

  // Platform preview
  const activePreview = PREVIEW_MODES.find(m => m.id === previewPlatform);

  if (postsLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-3">
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ─── Quick Stats Bar ─── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Created This Week", value: weekStats.created, icon: FileText, color: "text-primary" },
          { label: "Scheduled", value: weekStats.scheduled, icon: Clock, color: "text-amber-500" },
          { label: "Published This Week", value: weekStats.published, icon: CheckCircle, color: "text-emerald-500" },
        ].map(stat => (
          <Card key={stat.label} className="p-3">
            <div className="flex items-center gap-2">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* ─── Post Templates ─── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Quick Templates</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POST_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => useTemplate(t.template)}
              className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
            >
              <span className="text-lg">{t.emoji}</span>
              <span className="text-xs font-medium group-hover:text-primary transition-colors">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <Separator />

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
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial,sans-serif' font-size='36'%3EImage unavailable%3C/text%3E%3C/svg%3E";
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

            {/* Evergreen toggle + Platform Preview */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch checked={isEvergreen} onCheckedChange={setIsEvergreen} />
                <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Evergreen (re-suggest later)</span>
              </label>

              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-muted-foreground mr-1">Preview:</span>
                {PREVIEW_MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPreviewPlatform(previewPlatform === m.id ? null : m.id)}
                    className={cn(
                      "p-1.5 rounded border transition-all",
                      previewPlatform === m.id ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
                    )}
                    title={`Preview as ${m.label}`}
                  >
                    <m.icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Preview Panel */}
            {activePreview && content.trim() && (
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium">{activePreview.label} Preview</span>
                  {content.length > activePreview.maxChars && (
                    <Badge variant="destructive" className="text-[9px]">
                      {content.length}/{activePreview.maxChars} chars — too long!
                    </Badge>
                  )}
                </div>
                <div className="max-w-sm mx-auto bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                  {imageUrl && (
                    <div className={cn("bg-muted overflow-hidden", activePreview.aspect)}>
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs whitespace-pre-wrap line-clamp-6">{content}</p>
                    {hashtags && (
                      <p className="text-[10px] text-primary/70 mt-1.5">
                        {hashtags.split(",").map(h => `#${h.trim()}`).filter(h => h.length > 1).join(" ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                    <div className="px-3 pb-3 space-y-2">
                      <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="h-8 text-xs" />
                      <div className="border-t border-border pt-2">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Best times to post
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {BEST_TIMES.map((bt, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                const [h, m] = bt.time.replace(" AM", "").replace(" PM", "").split(":").map(Number);
                                const hour24 = bt.time.includes("PM") && h !== 12 ? h + 12 : h;
                                setScheduledTime(`${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
                              }}
                              className="text-[10px] text-left p-1.5 rounded hover:bg-accent/50 transition-colors"
                            >
                              <span className="font-medium">{bt.time}</span>
                              <span className="block text-muted-foreground">{bt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
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
