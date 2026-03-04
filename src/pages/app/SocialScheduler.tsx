import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, Trash2, Edit2, Send, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { useSocialPosts, useCreatePost, useUpdatePost, useDeletePost, useSocialAccounts, useToggleAccount } from "@/hooks/useSocial";

const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "Twitter"] as const;

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-600",
  Facebook: "bg-blue-500/10 text-blue-600",
  LinkedIn: "bg-sky-600/10 text-sky-700",
  Twitter: "bg-gray-500/10 text-gray-600",
};

const statusStyles: Record<string, string> = {
  published: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  scheduled: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

export default function SocialScheduler() {
  const { data: posts = [], isLoading } = useSocialPosts();
  const { data: accounts = [] } = useSocialAccounts();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const toggleAccount = useToggleAccount();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tab, setTab] = useState("posts");

  const resetForm = () => {
    setContent("");
    setSelectedPlatforms([]);
    setScheduledDate(undefined);
    setScheduledTime("10:00");
    setEditId(null);
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (post: typeof posts[0]) => {
    setEditId(post.id);
    setContent(post.content);
    setSelectedPlatforms((post.platforms_json as any) || []);
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at);
      setScheduledDate(d);
      setScheduledTime(format(d, "HH:mm"));
    } else {
      setScheduledDate(undefined);
      setScheduledTime("10:00");
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!content.trim()) { toast.error("Post content is required"); return; }
    if (selectedPlatforms.length === 0) { toast.error("Select at least one platform"); return; }

    let scheduled_at: string | null = null;
    if (scheduledDate) {
      const [h, m] = scheduledTime.split(":").map(Number);
      const d = new Date(scheduledDate);
      d.setHours(h, m, 0, 0);
      scheduled_at = d.toISOString();
    }

    const status = scheduled_at ? "scheduled" : "draft";

    try {
      if (editId) {
        await updatePost.mutateAsync({ id: editId, content, platforms_json: selectedPlatforms as any, scheduled_at, status });
        toast.success("Post updated");
      } else {
        await createPost.mutateAsync({ content, platforms_json: selectedPlatforms, scheduled_at, status });
        toast.success("Post created");
      }
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
      toast.success("Post deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const filteredPosts = statusFilter === "all" ? posts : posts.filter(p => p.status === statusFilter);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and manage your social media posts</p>
        </div>
        <Button className="shadow-glow" onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="posts">All Posts</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        {/* ── Posts Tab ── */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          {/* Filter bar */}
          <div className="flex gap-2 flex-wrap">
            {["all", "draft", "scheduled", "published", "failed"].map(s => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize text-xs">
                {s}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState icon={Send} title="No posts yet" description="Create your first social media post to get started." />
          ) : (
            filteredPosts.map(post => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {((post.platforms_json as any) || []).map((p: string) => (
                        <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${platformColors[p] || "bg-muted"}`}>{p}</span>
                      ))}
                      {post.scheduled_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(post.scheduled_at), "MMM d, yyyy h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[post.status] || statusStyles.draft}`}>
                      {post.status}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(post)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* ── Accounts Tab ── */}
        <TabsContent value="accounts" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLATFORMS.map(provider => {
              const acct = accounts.find(a => a.provider === provider);
              const connected = acct?.connected ?? false;
              return (
                <div key={provider} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platformColors[provider]}`}>{provider}</span>
                    {connected && acct?.account_name && (
                      <span className="text-xs text-muted-foreground">@{acct.account_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{connected ? "Connected" : "Disconnected"}</span>
                    <Switch checked={connected} onCheckedChange={(val) => toggleAccount.mutate({ provider, connected: val })} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Toggle accounts to enable/disable posting. Actual API integration can be configured in settings.</p>
        </TabsContent>
      </Tabs>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What would you like to share?" rows={4} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">{content.length} / 280 characters</p>
            </div>

            <div>
              <Label>Platforms</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      selectedPlatforms.includes(p)
                        ? `${platformColors[p]} border-current font-medium`
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Schedule Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !scheduledDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduledDate ? format(scheduledDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createPost.isPending || updatePost.isPending}>
              {editId ? "Update" : scheduledDate ? "Schedule" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
