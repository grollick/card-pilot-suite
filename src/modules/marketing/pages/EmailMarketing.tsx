import { useState } from "react";
import {
  Mail, Plus, Send, FileText, Loader2, Trash2, Edit, Eye,
  Users, Tag, MoreHorizontal, Copy, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  useEmailTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
  useCampaigns, useCreateCampaign, useUpdateCampaign,
  useAddCampaignRecipients, useSendCampaign, TEMPLATE_VARIABLES,
} from "@/hooks/useEmail";
import { useContacts, usePipelineStages, useTags } from "@/hooks/useContacts";
import GuzzlLogo from "@/components/brand/GuzzlLogo";

const campaignStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sending: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  sent: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  paused: "bg-muted text-muted-foreground",
};

export default function EmailMarketing() {
  const { data: templates = [], isLoading: tLoading } = useEmailTemplates();
  const { data: campaigns = [], isLoading: cLoading } = useCampaigns();
  const { data: contacts = [] } = useContacts();
  const { data: stages = [] } = usePipelineStages();
  const { data: tags = [] } = useTags();

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const addRecipients = useAddCampaignRecipients();
  const sendCampaign = useSendCampaign();

  // Template dialog state
  const [tOpen, setTOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [tName, setTName] = useState("");
  const [tSubject, setTSubject] = useState("");
  const [tBody, setTBody] = useState("");

  // Campaign dialog state
  const [cOpen, setCOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cTemplateId, setCTemplateId] = useState("none");

  // Add recipients dialog
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipientCampaignId, setRecipientCampaignId] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState<"all" | "tag" | "stage">("all");
  const [recipientFilterId, setRecipientFilterId] = useState("all");

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTName(""); setTSubject(""); setTBody("");
    setTOpen(true);
  };

  const openEditTemplate = (t: any) => {
    setEditingTemplate(t);
    setTName(t.name); setTSubject(t.subject); setTBody(t.body);
    setTOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!tName.trim() || !tSubject.trim()) return;
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, name: tName, subject: tSubject, body: tBody });
      toast.success("Template updated");
    } else {
      await createTemplate.mutateAsync({ name: tName, subject: tSubject, body: tBody });
      toast.success("Template created");
    }
    setTOpen(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await deleteTemplate.mutateAsync(id);
    toast.success("Template deleted");
  };

  const handleCreateCampaign = async () => {
    if (!cName.trim()) return;
    const campaign = await createCampaign.mutateAsync({
      name: cName,
      template_id: cTemplateId === "none" ? null : cTemplateId,
    });
    toast.success("Campaign created");
    setCOpen(false);
    setCName(""); setCTemplateId("none");
    // Open add recipients
    setRecipientCampaignId(campaign.id);
    setRecipientOpen(true);
  };

  const handleAddRecipients = async () => {
    if (!recipientCampaignId) return;
    let filteredContacts = contacts;

    if (recipientFilter === "tag" && recipientFilterId !== "all") {
      filteredContacts = contacts.filter((c: any) =>
        (c.contact_tags ?? []).some((ct: any) => ct.tag_id === recipientFilterId)
      );
    } else if (recipientFilter === "stage" && recipientFilterId !== "all") {
      filteredContacts = contacts.filter((c: any) => c.stage_id === recipientFilterId);
    }

    // Only contacts with email
    const withEmail = filteredContacts.filter((c: any) => c.email);
    if (withEmail.length === 0) {
      toast.error("No contacts with email in this segment");
      return;
    }

    await addRecipients.mutateAsync({
      campaignId: recipientCampaignId,
      leadIds: withEmail.map((c: any) => c.id),
    });
    toast.success(`${withEmail.length} recipients added`);
    setRecipientOpen(false);
  };

  const insertVariable = (variable: string) => {
    setTBody((b) => b + variable);
  };

  const isLoading = tLoading || cLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight"><GuzzlLogo to={null} size="lg" suffix="Email" /></h1>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><GuzzlLogo to={null} size="lg" suffix="Email" /></h1>
          <p className="text-muted-foreground text-sm mt-1">
            {templates.length} templates · {campaigns.length} campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewTemplate}>
            <FileText className="h-4 w-4 mr-2" /> New Template
          </Button>
          <Dialog open={cOpen} onOpenChange={setCOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-glow"><Send className="h-4 w-4 mr-2" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Campaign name *" value={cName} onChange={(e) => setCName(e.target.value)} />
                <div>
                  <label className="text-xs text-muted-foreground">Template</label>
                  <Select value={cTemplateId} onValueChange={setCTemplateId}>
                    <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      {templates.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending} className="w-full">
                  Create & Add Recipients
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-4 space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No campaigns yet. Create your first campaign to start reaching contacts.
            </div>
          ) : (
            campaigns.map((c: any) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    <Badge variant="outline" className={`text-[10px] ${campaignStatusColors[c.status] ?? ""}`}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {c.email_templates?.name && (
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {c.email_templates.name}</span>
                    )}
                    <span>Updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setRecipientCampaignId(c.id); setRecipientOpen(true); }}
                  >
                    <Users className="h-3.5 w-3.5 mr-1" /> Recipients
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      {c.status === "draft" && (
                        <DropdownMenuItem
                          disabled={sendCampaign.isPending}
                          onClick={() => {
                            if (!confirm(`Send this campaign to all pending recipients?`)) return;
                            sendCampaign.mutate(c.id);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" /> {sendCampaign.isPending ? "Sending…" : "Send Now"}
                        </DropdownMenuItem>
                      )}
                      {c.status === "sending" && (
                        <DropdownMenuItem onClick={() => updateCampaign.mutate({ id: c.id, status: "paused" })}>
                          Pause
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No templates yet. Create one to use in campaigns.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t: any) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-card transition-shadow group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2 min-w-0">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => openEditTemplate(t)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setPreviewTemplate(t); setPreviewOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTemplate(t.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                    {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={tOpen} onOpenChange={setTOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Template name *" value={tName} onChange={(e) => setTName(e.target.value)} />
            <Input placeholder="Subject line *" value={tSubject} onChange={(e) => setTSubject(e.target.value)} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Body</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                      <Plus className="h-3 w-3" /> Variable <ChevronDown className="h-3 w-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <DropdownMenuItem key={v.key} onClick={() => insertVariable(v.key)}>
                        <div>
                          <p className="text-sm font-medium">{v.label}</p>
                          <p className="text-[10px] text-muted-foreground">{v.key}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                placeholder="Write your email body here... Use {{first_name}}, {{company}}, {{booking_link}} for personalization."
                value={tBody}
                onChange={(e) => setTBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">{previewTemplate.subject}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border min-h-[200px]">
                <p className="text-sm whitespace-pre-wrap">{previewTemplate.body}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Variables like {"{{first_name}}"} will be replaced with contact data when sent.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Recipients Dialog */}
      <Dialog open={recipientOpen} onOpenChange={setRecipientOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Recipients</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["all", "tag", "stage"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setRecipientFilter(f); setRecipientFilterId("all"); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    recipientFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {f === "all" ? "All Contacts" : f === "tag" ? "By Tag" : "By Stage"}
                </button>
              ))}
            </div>

            {recipientFilter === "tag" && (
              <Select value={recipientFilterId} onValueChange={setRecipientFilterId}>
                <SelectTrigger><SelectValue placeholder="Select tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {tags.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {recipientFilter === "stage" && (
              <Select value={recipientFilterId} onValueChange={setRecipientFilterId}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
              <p className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {(() => {
                    let filtered = contacts;
                    if (recipientFilter === "tag" && recipientFilterId !== "all") {
                      filtered = contacts.filter((c: any) =>
                        (c.contact_tags ?? []).some((ct: any) => ct.tag_id === recipientFilterId)
                      );
                    } else if (recipientFilter === "stage" && recipientFilterId !== "all") {
                      filtered = contacts.filter((c: any) => c.stage_id === recipientFilterId);
                    }
                    const withEmail = filtered.filter((c: any) => c.email);
                    return `${withEmail.length} contacts with email`;
                  })()}
                </span>
              </p>
            </div>

            <Button onClick={handleAddRecipients} disabled={addRecipients.isPending} className="w-full">
              Add Recipients
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
