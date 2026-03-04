import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useContacts, usePipelineStages, useTags } from "@/hooks/useContacts";
import { useCreateContact } from "@/hooks/useContactActions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type SavedView = "all" | "new_leads" | "needs_followup" | "booked" | "won" | "lost";

const savedViews: { key: SavedView; label: string }[] = [
  { key: "all", label: "All Contacts" },
  { key: "new_leads", label: "New Leads" },
  { key: "needs_followup", label: "Needs Follow-up" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default function ContactsPage() {
  const navigate = useNavigate();
  const { data: contacts = [], isLoading } = useContacts();
  const { data: stages = [] } = usePipelineStages();
  const { data: tags = [] } = useTags();
  const createContact = useCreateContact();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [activeView, setActiveView] = useState<SavedView>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filtered = useMemo(() => {
    return contacts.filter((c: any) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.company ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "all" || c.stage_id === stageFilter;
      const matchSource = sourceFilter === "all" || c.source === sourceFilter;
      const matchTag = tagFilter === "all" || (c.contact_tags ?? []).some((ct: any) => ct.tag_id === tagFilter);

      // Saved view filters
      let matchView = true;
      if (activeView === "new_leads") {
        matchView = c.pipeline_stages?.name?.toLowerCase().includes("new") || (!c.stage_id && c.status === "open");
      } else if (activeView === "needs_followup") {
        const overdue = c.next_activity_at && new Date(c.next_activity_at) < now;
        const stale = !c.last_activity_at || new Date(c.last_activity_at) < sevenDaysAgo;
        matchView = (overdue || stale) && c.status === "open";
      } else if (activeView === "won") {
        matchView = c.status === "won" || c.pipeline_stages?.is_won === true;
      } else if (activeView === "lost") {
        matchView = c.status === "lost" || c.pipeline_stages?.is_lost === true;
      }

      return matchSearch && matchStage && matchSource && matchTag && matchView;
    });
  }, [contacts, search, stageFilter, sourceFilter, tagFilter, activeView]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const lead = await createContact.mutateAsync({
      name: newName,
      email: newEmail || undefined,
      phone: newPhone || undefined,
      company: newCompany || undefined,
      source: "manual",
    });
    toast.success("Contact created");
    setNewOpen(false);
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewCompany("");
    navigate(`/app/contacts/${lead.id}`);
  };

  const getContactTags = (c: any) => {
    return (c.contact_tags ?? []).map((ct: any) => ct.tags).filter(Boolean);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">{contacts.length} total · {filtered.length} shown</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow"><Plus className="h-4 w-4 mr-2" /> Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Full name *" value={newName} onChange={e => setNewName(e.target.value)} />
              <Input placeholder="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <Input placeholder="Phone" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              <Input placeholder="Company (optional)" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
              <Button onClick={handleCreate} disabled={createContact.isPending} className="w-full">Create Contact</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saved Views */}
      <div className="flex gap-2 flex-wrap">
        {savedViews.map(view => (
          <button
            key={view.key}
            onClick={() => setActiveView(view.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeView === view.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, company..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="card_form">Card Form</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="import">Import</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {tags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tag" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {contacts.length === 0 ? 'No contacts yet. Click "Add Contact" to get started.' : "No contacts match your filters."}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Stage</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Source</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Last Activity</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden xl:table-cell">Next Activity</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact: any) => {
                const cTags = getContactTags(contact);
                return (
                  <tr
                    key={contact.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/contacts/${contact.id}`)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                          {contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          {contact.company && <p className="text-xs text-muted-foreground truncate">{contact.company}</p>}
                          {cTags.length > 0 && (
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {cTags.slice(0, 3).map((tag: any) => (
                                <span key={tag.id} className="text-[10px] px-1.5 py-0 rounded-full border" style={{ borderColor: tag.color, color: tag.color }}>
                                  {tag.name}
                                </span>
                              ))}
                              {cTags.length > 3 && <span className="text-[10px] text-muted-foreground">+{cTags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell truncate max-w-[180px]">{contact.email ?? "—"}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{contact.phone ?? "—"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{contact.pipeline_stages?.name ?? "—"}</Badge>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{contact.source}</span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {contact.last_activity_at
                        ? formatDistanceToNow(new Date(contact.last_activity_at), { addSuffix: true })
                        : <span className="text-destructive/70">Never</span>}
                    </td>
                    <td className="p-3 text-xs hidden xl:table-cell">
                      {contact.next_activity_at
                        ? <span className={new Date(contact.next_activity_at) < now ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {formatDistanceToNow(new Date(contact.next_activity_at), { addSuffix: true })}
                          </span>
                        : <span className="text-muted-foreground">None</span>}
                    </td>
                    <td className="p-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
