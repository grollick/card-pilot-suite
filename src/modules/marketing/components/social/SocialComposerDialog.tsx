import { useState, useEffect, useCallback } from "react";
import { Sparkles, Hash, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { useCreatePost, useUpdatePost } from "@/hooks/useSocialPosts";
import { useSocialCampaigns } from "@/hooks/useSocialCampaigns";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { PLATFORMS, CONTENT_LABELS, getPlatformConfig, deriveDbStatus } from "./constants";
import type { PostStatus } from "./constants";
import PlatformPreview from "./PlatformPreview";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editPost: SocialPost | null;
  onClose: () => void;
}

export default function SocialComposerDialog({ open, onOpenChange, editPost, onClose }: Props) {
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const { data: campaigns = [] } = useSocialCampaigns();

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformOverrides, setPlatformOverrides] = useState<Record<string, { content?: string; hashtags?: string[] }>>({});
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [campaignId, setCampaignId] = useState<string>("");
  const [contentLabel, setContentLabel] = useState<string>("");
  const [activePlatformTab, setActivePlatformTab] = useState("base");

  const resetForm = useCallback(() => {
    setContent(""); setSelectedPlatforms([]); setPlatformOverrides({});
    setScheduledDate(undefined); setScheduledTime("10:00");
    setCampaignId(""); setContentLabel(""); setActivePlatformTab("base");
  }, []);

  useEffect(() => {
    if (editPost) {
      setContent(editPost.content);
      setSelectedPlatforms((editPost.platforms_json as any) || []);
      setPlatformOverrides(editPost.platform_overrides || {});
      setCampaignId(editPost.campaign_id || "");
      setContentLabel(editPost.content_label || "");
      if (editPost.scheduled_at) {
        const d = new Date(editPost.scheduled_at);
        setScheduledDate(d);
        setScheduledTime(format(d, "HH:mm"));
      }
    } else { resetForm(); }
  }, [editPost, resetForm]);

  const togglePlatform = (p: string) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const updateOverride = (platform: string, field: "content" | "hashtags", value: any) => {
    setPlatformOverrides(prev => ({ ...prev, [platform]: { ...prev[platform], [field]: value } }));
  };

  const getContentForPlatform = (platform: string) => platformOverrides[platform]?.content || content;

  const getCharCount = (platform: string) => {
    const text = getContentForPlatform(platform);
    const cfg = getPlatformConfig(platform);
    return { current: text.length, limit: cfg?.charLimit ?? 2200 };
  };

  const handleSave = async (targetStatus?: PostStatus) => {
    if (!content.trim()) { toast.error("Post content is required"); return; }
    if (selectedPlatforms.length === 0) { toast.error("Select at least one platform"); return; }

    let scheduled_at: string | null = null;
    if (scheduledDate) {
      const [h, m] = scheduledTime.split(":").map(Number);
      const d = new Date(scheduledDate);
      d.setHours(h, m, 0, 0);
      scheduled_at = d.toISOString();
    }

    const approvalStatus: PostStatus = targetStatus ?? (scheduled_at ? "scheduled" : "draft");

    try {
      const payload = {
        content,
        platforms_json: selectedPlatforms,
        scheduled_at,
        status: deriveDbStatus(approvalStatus),
        campaign_id: campaignId || null,
        content_label: contentLabel || null,
        platform_overrides: platformOverrides,
        approval_status: approvalStatus,
      };

      if (editPost) {
        await updatePost.mutateAsync({ id: editPost.id, ...payload } as any);
        toast.success("Post updated");
      } else {
        await createPost.mutateAsync(payload);
        toast.success("Post created");
      }
      onClose();
      resetForm();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { onClose(); resetForm(); } }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editPost ? "Edit Post" : "New Post"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="grid md:grid-cols-[1fr,280px] gap-4">
            <div className="space-y-4">
              {/* Platform Selection */}
              <div>
                <Label className="text-xs">Platforms</Label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
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
              </div>

              {/* Platform Tabs */}
              {selectedPlatforms.length > 0 ? (
                <Tabs value={activePlatformTab} onValueChange={setActivePlatformTab}>
                  <TabsList className="h-8">
                    <TabsTrigger value="base" className="text-xs h-7">Base Post</TabsTrigger>
                    {selectedPlatforms.map(p => (
                      <TabsTrigger key={p} value={p} className="text-xs h-7">{p}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="base" className="mt-2">
                    <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your base post content..." rows={5} />
                    <p className="text-xs text-muted-foreground mt-1">{content.length} characters (base)</p>
                  </TabsContent>
                  {selectedPlatforms.map(platform => {
                    const chars = getCharCount(platform);
                    const overrideContent = platformOverrides[platform]?.content ?? "";
                    const overrideHashtags = platformOverrides[platform]?.hashtags?.join(", ") ?? "";
                    return (
                      <TabsContent key={platform} value={platform} className="mt-2 space-y-3">
                        <div>
                          <Label className="text-xs">Customized for {platform}</Label>
                          <Textarea value={overrideContent} onChange={e => updateOverride(platform, "content", e.target.value)} placeholder={`Leave empty to use base post...`} rows={4} />
                          <div className="flex items-center justify-between mt-1">
                            <p className={cn("text-xs", chars.current > chars.limit ? "text-destructive" : "text-muted-foreground")}>
                              {chars.current} / {chars.limit}
                            </p>
                            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"><Sparkles className="h-3 w-3" /> AI Rewrite</Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> Hashtags</Label>
                          <Input value={overrideHashtags} onChange={e => updateOverride(platform, "hashtags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="tag1, tag2, tag3" className="text-xs h-8" />
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <div>
                  <Label className="text-xs">Content</Label>
                  <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your post content..." rows={5} />
                  <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Campaign</Label>
                  <Select value={campaignId} onValueChange={setCampaignId}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Content Label</Label>
                  <Select value={contentLabel} onValueChange={setContentLabel}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {CONTENT_LABELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Schedule Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-8 text-xs mt-1", !scheduledDate && "text-muted-foreground")}>
                        <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                        {scheduledDate ? format(scheduledDate, "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs">Time</Label>
                  <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="h-8 text-xs mt-1" />
                </div>
              </div>

              {/* AI Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1"><Sparkles className="h-3 w-3" /> Generate Post</Button>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1"><RefreshCw className="h-3 w-3" /> Caption Variations</Button>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1"><Hash className="h-3 w-3" /> Generate Hashtags</Button>
              </div>
            </div>

            {/* Preview */}
            <div className="hidden md:block">
              <Label className="text-xs mb-2 block">Preview</Label>
              <div className="space-y-3">
                {(selectedPlatforms.length > 0 ? selectedPlatforms : ["Instagram"]).map(platform => (
                  <PlatformPreview key={platform} platform={platform} content={getContentForPlatform(platform)} hashtags={platformOverrides[platform]?.hashtags} />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-2 border-t border-border gap-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave("draft")}>Save Draft</Button>
          <Button variant="outline" onClick={() => handleSave("pending_approval")}>Submit for Approval</Button>
          <Button onClick={() => handleSave()} disabled={createPost.isPending || updatePost.isPending}>
            {editPost ? "Update" : scheduledDate ? "Schedule" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
