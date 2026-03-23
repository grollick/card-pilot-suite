import { useState } from "react";
import {
  Rocket, Plus, Pause, Play, Trash2, Edit2, Sparkles, Calendar,
  ChevronRight, Crown, Settings2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import {
  useAutoCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign,
  CAMPAIGN_TYPES, FREQUENCY_OPTIONS, CONTENT_TYPE_LABELS, getCampaignLimits,
  type AutoCampaign,
} from "@/hooks/useAutoCampaigns";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function CampaignStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    active: { label: "Active", variant: "default" },
    paused: { label: "Paused", variant: "secondary" },
    draft: { label: "Draft", variant: "outline" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
}

export default function AutoCampaignsPage() {
  const { data: campaigns = [], isLoading } = useAutoCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const { planKey } = usePlanLimits();
  const { user } = useAuth();
  const limits = getCampaignLimits(planKey);
  

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState("general");
  const [frequency, setFrequency] = useState("3x_week");
  const [contentTypes, setContentTypes] = useState<string[]>(["project_completed", "promotion", "tip"]);
  const [generating, setGenerating] = useState<string | null>(null);

  const activeCampaigns = campaigns.filter(c => c.status === "active");

  const resetForm = () => {
    setEditId(null);
    setName("");
    setCampaignType("general");
    setFrequency("3x_week");
    setContentTypes(["project_completed", "promotion", "tip"]);
  };

  const openCreate = () => {
    if (limits.maxCampaigns === 0) {
      toast.error("Auto campaigns require a Pro plan or higher");
      return;
    }
    if (!editId && activeCampaigns.length >= limits.maxCampaigns) {
      toast.error(`Your plan allows ${limits.maxCampaigns} active campaign${limits.maxCampaigns > 1 ? "s" : ""}`);
      return;
    }
    resetForm();
    setOpen(true);
  };

  const openEdit = (c: AutoCampaign) => {
    setEditId(c.id);
    setName(c.name);
    setCampaignType(c.campaign_type);
    setFrequency(c.frequency);
    setContentTypes(c.content_types);
    setOpen(true);
  };

  const handleTypeChange = (type: string) => {
    setCampaignType(type);
    const tpl = CAMPAIGN_TYPES.find(t => t.key === type);
    if (tpl) {
      setContentTypes([...tpl.contentTypes]);
      setFrequency(tpl.defaultFrequency);
      if (!name || CAMPAIGN_TYPES.some(t => t.label + " Campaign" === name)) {
        setName(tpl.label + " Campaign");
      }
    }
  };

  const toggleContentType = (ct: string) => {
    setContentTypes(prev =>
      prev.includes(ct) ? prev.filter(x => x !== ct) : [...prev, ct]
    );
  };

  const freqOption = FREQUENCY_OPTIONS.find(f => f.value === frequency);
  const postsPerWeek = freqOption?.postsPerWeek ?? 2;

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (contentTypes.length === 0) { toast.error("Select at least one content type"); return; }
    const cappedPosts = Math.min(postsPerWeek, limits.maxPostsPerWeek || postsPerWeek);
    try {
      if (editId) {
        await updateCampaign.mutateAsync({
          id: editId, name, campaign_type: campaignType,
          frequency, posts_per_week: cappedPosts, content_types: contentTypes,
        });
        toast.success("Campaign updated");
      } else {
        await createCampaign.mutateAsync({
          name, campaign_type: campaignType,
          frequency, posts_per_week: cappedPosts, content_types: contentTypes,
        });
        toast.success("Campaign created and activated!");
      }
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleStatus = async (c: AutoCampaign) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    if (newStatus === "active" && activeCampaigns.length >= limits.maxCampaigns && c.status !== "active") {
      toast.error(`Your plan allows ${limits.maxCampaigns} active campaign${limits.maxCampaigns > 1 ? "s" : ""}`);
      return;
    }
    await updateCampaign.mutateAsync({ id: c.id, status: newStatus });
    toast.success(newStatus === "active" ? "Campaign resumed" : "Campaign paused");
  };

  const handleDelete = async (id: string) => {
    await deleteCampaign.mutateAsync(id);
    toast.success("Campaign deleted");
  };

  const handleGeneratePost = async (campaign: AutoCampaign) => {
    setGenerating(campaign.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-campaign-post", {
        body: {
          campaign_id: campaign.id,
          campaign_type: campaign.campaign_type,
          content_types: campaign.content_types,
          profession: campaign.profession,
        },
      });
      if (error) throw error;
      toast.success("Post generated! Check your Social Posts.");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate post");
    } finally {
      setGenerating(null);
    }
  };

  const typeInfo = CAMPAIGN_TYPES.find(t => t.key === campaignType);
  const availableContentTypes = typeInfo?.contentTypes ?? Object.keys(CONTENT_TYPE_LABELS);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Auto Campaigns</span></h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automate your social media with AI-powered content
          </p>
        </div>
        <Button className="shadow-glow" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Plan gate banner */}
      {limits.maxCampaigns === 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
          <Crown className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Upgrade to unlock Auto Campaigns</p>
            <p className="text-xs text-muted-foreground mt-1">
              Auto campaigns are available on Pro and higher plans. Automate your social media with AI-generated posts tailored to your trade.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : campaigns.length === 0 && limits.maxCampaigns > 0 ? (
        <EmptyState
          icon={Rocket}
          title="No campaigns yet"
          description="Create an auto campaign to start posting consistently on autopilot."
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-xl border bg-card p-5 group transition-all ${
                c.status === "active" ? "border-border" : "border-border/50 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${
                    c.status === "active" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Rocket className={`h-5 w-5 ${c.status === "active" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{c.name}</span>
                      <CampaignStatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{CAMPAIGN_TYPES.find(t => t.key === c.campaign_type)?.label ?? c.campaign_type}</span>
                      <span>·</span>
                      <span>{FREQUENCY_OPTIONS.find(f => f.value === c.frequency)?.label ?? c.frequency}</span>
                      <span>·</span>
                      <span>{c.posts_generated} posts generated</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={generating === c.id || c.status !== "active"}
                    onClick={() => handleGeneratePost(c)}
                  >
                    {generating === c.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleStatus(c)}
                    title={c.status === "active" ? "Pause" : "Resume"}
                  >
                    {c.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openEdit(c)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Content type pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.content_types.map(ct => (
                  <span key={ct} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {CONTENT_TYPE_LABELS[ct] ?? ct}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Campaign" : "New Auto Campaign"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update your campaign settings" : "Set up an automated posting campaign tailored to your trade"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <Label>Campaign Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Project Showcase" className="mt-1" />
            </div>

            {/* Campaign Type */}
            <div>
              <Label>Campaign Type</Label>
              <Select value={campaignType} onValueChange={handleTypeChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map(t => (
                    <SelectItem key={t.key} value={t.key}>
                      <div className="flex flex-col">
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeInfo && (
                <p className="text-[11px] text-muted-foreground mt-1.5">{typeInfo.description}</p>
              )}
            </div>

            {/* Frequency */}
            <div>
              <Label>Posting Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {limits.maxPostsPerWeek > 0 && postsPerWeek > limits.maxPostsPerWeek && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Your plan supports up to {limits.maxPostsPerWeek} posts/week. Posts will be capped.
                </p>
              )}
            </div>

            {/* Content Types */}
            <div>
              <Label>Content Mix</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableContentTypes.map(ct => (
                  <label key={ct} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={contentTypes.includes(ct)}
                      onCheckedChange={() => toggleContentType(ct)}
                    />
                    {CONTENT_TYPE_LABELS[ct] ?? ct}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createCampaign.isPending || updateCampaign.isPending}>
              {editId ? "Update" : "Create & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
