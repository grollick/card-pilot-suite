import { useState, useCallback, useEffect } from "react";
import { Wand2, Sparkles, Hash, Image, Link2, Send, Save, Clock, RefreshCw, Loader2, Megaphone, BookOpen, Camera, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import AIPostGenerator from "./AIPostGenerator";
import ContentSpinner from "./ContentSpinner";

// Trade-specific quick templates
const TRADE_TEMPLATES = [
  { id: "before-after", label: "Before & After", icon: Camera, desc: "Showcase your transformation work" },
  { id: "tip", label: "Pro Tip", icon: BookOpen, desc: "Share industry expertise" },
  { id: "promo", label: "Special Offer", icon: Megaphone, desc: "Promote a deal or discount" },
  { id: "testimonial", label: "Client Review", icon: MessageSquare, desc: "Highlight happy customers" },
];

interface Props {
  editPost?: SocialPost | null;
  onDone?: () => void;
}

export default function SocialCreateView({ editPost, onDone }: Props) {
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const { data: campaigns = [] } = useSocialCampaigns();

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [platformOverrides, setPlatformOverrides] = useState<Record<string, { content?: string; hashtags?: string[] }>>({});
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [campaignId, setCampaignId] = useState<string>("");
  const [contentLabel, setContentLabel] = useState<string>("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("");
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [tone, setTone] = useState("professional");
  const [linkToCard, setLinkToCard] = useState(true);

  const resetForm = useCallback(() => {
    setContent(""); setImageUrl(""); setSelectedPlatforms(["Instagram", "Facebook"]); setPlatformOverrides({});
    setScheduledDate(undefined); setScheduledTime("10:00");
    setCampaignId(""); setContentLabel(""); setHashtags(""); setCta("");
    setShowAiGenerator(false); setShowSpinner(false); setTone("professional");
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

  const getContentForPlatform = (platform: string) => platformOverrides[platform]?.content || content;

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

    // Merge hashtags into platform overrides
    const hashtagArr = hashtags.split(",").map(s => s.trim()).filter(Boolean);
    const finalOverrides = { ...platformOverrides };
    if (hashtagArr.length > 0) {
      selectedPlatforms.forEach(p => {
        finalOverrides[p] = { ...finalOverrides[p], hashtags: hashtagArr };
      });
    }

    // Append CTA to content if present
    const finalContent = cta ? `${content}\n\n${cta}` : content;

    try {
      const payload = {
        content: finalContent,
        platforms_json: selectedPlatforms,
        scheduled_at,
        status: deriveDbStatus(approvalStatus),
        campaign_id: campaignId || null,
        content_label: contentLabel || null,
        platform_overrides: finalOverrides,
        approval_status: approvalStatus,
      };

      if (editPost) {
        await updatePost.mutateAsync({ id: editPost.id, ...payload } as any);
        toast.success("Post updated");
      } else {
        await createPost.mutateAsync(payload);
        toast.success("Post created");
      }
      resetForm();
      onDone?.();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-0 h-[calc(100vh-200px)] min-h-[500px] border border-border rounded-xl overflow-hidden bg-card">
      {/* ── LEFT PANEL: Templates & AI Tools ── */}
      <div className="border-r border-border bg-muted/30 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Templates</h3>
            <div className="space-y-2">
              {TRADE_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all group"
                  onClick={() => {
                    setContent(`[${t.label}] `);
                    setContentLabel(t.id === "promo" ? "promo" : t.id === "tip" ? "educational" : t.id === "testimonial" ? "testimonial" : "portfolio");
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <t.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">AI Tools</h3>
            <div className="space-y-2">
              <Button
                variant={showAiGenerator ? "default" : "outline"}
                size="sm"
                className="w-full justify-start gap-2 h-10"
                onClick={() => { setShowAiGenerator(!showAiGenerator); setShowSpinner(false); }}
              >
                <Wand2 className="h-4 w-4" />
                <span className="text-xs">Generate Post</span>
              </Button>
              <Button
                variant={showSpinner ? "default" : "outline"}
                size="sm"
                className="w-full justify-start gap-2 h-10"
                onClick={() => { setShowSpinner(!showSpinner); setShowAiGenerator(false); }}
                disabled={!content.trim()}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Spin Content</span>
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tone</h3>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
                <SelectItem value="bold">Bold & Direct</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showAiGenerator && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">AI Post Generator</h3>
                <AIPostGenerator
                  platforms={selectedPlatforms.length > 0 ? selectedPlatforms : ["Instagram"]}
                  onSelectPost={({ content: newContent, hashtags: newHashtags }) => {
                    setContent(newContent);
                    if (newHashtags.length > 0) {
                      setHashtags(newHashtags.join(", "));
                    }
                    setShowAiGenerator(false);
                  }}
                />
              </div>
            </>
          )}

          {showSpinner && content.trim() && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Content Spinner</h3>
                <ContentSpinner
                  originalContent={content}
                  tone={tone}
                  onSelect={(newContent) => {
                    setContent(newContent);
                    setShowSpinner(false);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CENTER PANEL: Post Canvas Preview ── */}
      <div className="overflow-y-auto bg-background">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Preview</h3>
            <div className="flex gap-1.5 flex-wrap">
              {selectedPlatforms.map(p => {
                const cfg = getPlatformConfig(p);
                return (
                  <Badge key={p} variant="secondary" className={cn("text-[10px]", cfg?.color)}>
                    {p}
                  </Badge>
                );
              })}
            </div>
          </div>

          {selectedPlatforms.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Image className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select platforms to see preview</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
              {selectedPlatforms.map(platform => (
                <PlatformPreview
                  key={platform}
                  platform={platform}
                  content={getContentForPlatform(platform)}
                  hashtags={hashtags.split(",").map(s => s.trim()).filter(Boolean)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Caption, Hashtags, CTA, Settings ── */}
      <div className="border-l border-border overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Platforms */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platforms</Label>
            <div className="flex gap-1.5 mt-2 flex-wrap">
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

          <Separator />

          {/* Caption */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your post content..."
              rows={5}
              className="mt-2 text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{content.length} characters</p>
          </div>

          {/* Hashtags */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> Hashtags
            </Label>
            <Input
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="mt-2 text-xs h-9"
            />
          </div>

          {/* CTA */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Link2 className="h-3 w-3" /> Call to Action
            </Label>
            <Input
              value={cta}
              onChange={e => setCta(e.target.value)}
              placeholder="e.g. Book now at yoursite.com"
              className="mt-2 text-xs h-9"
            />
          </div>

          <Separator />

          {/* Lead Integration */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Integration</Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={linkToCard} onChange={e => setLinkToCard(e.target.checked)} className="rounded" />
                Link to my card & booking page
              </label>
              <p className="text-[10px] text-muted-foreground">Posts will include your booking link and lead form</p>
            </div>
          </div>

          <Separator />

          {/* Content Label & Campaign */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Label</Label>
              <Select value={contentLabel || "__none__"} onValueChange={v => setContentLabel(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {CONTENT_LABELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Campaign</Label>
              <Select value={campaignId || "__none__"} onValueChange={v => setCampaignId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-8 text-xs mt-1", !scheduledDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    {scheduledDate ? format(scheduledDate, "MMM d") : "Pick"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Time</Label>
              <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="h-8 text-xs mt-1" />
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              onClick={() => handleSave()}
              disabled={createPost.isPending || updatePost.isPending}
            >
              {scheduledDate ? <Clock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {editPost ? "Update Post" : scheduledDate ? "Schedule Post" : "Publish Now"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => handleSave("draft")}>
                <Save className="h-3 w-3 mr-1" /> Draft
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => handleSave("pending_approval")}>
                Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
