import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight } from "lucide-react";
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
import { useContacts, usePipelineStages } from "@/hooks/useContacts";
import { useCreateContact } from "@/hooks/useContactActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ContactsPage() {
  const navigate = useNavigate();
  const { data: contacts = [], isLoading } = useContacts();
  const { data: stages = [] } = usePipelineStages();
  const createContact = useCreateContact();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const filtered = contacts.filter((c: any) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.stage_id === stageFilter;
    const matchSource = sourceFilter === "all" || c.source === sourceFilter;
    return matchSearch && matchStage && matchSource;
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const lead = await createContact.mutateAsync({
      name: newName,
      email: newEmail || undefined,
      phone: newPhone || undefined,
      source: "manual",
    });
    toast.success("Contact created");
    setNewOpen(false);
    setNewName(""); setNewEmail(""); setNewPhone("");
    navigate(`/app/contacts/${lead.id}`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">{contacts.length} contacts</p>
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
              <Button onClick={handleCreate} disabled={createContact.isPending} className="w-full">Create Contact</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
            <SelectItem value="card_form">Card</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="import">Import</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No contacts yet. Click "Add Contact" to get started.</p>
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
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Updated</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact: any) => (
                <tr
                  key={contact.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/contacts/${contact.id}`)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        {(contact.tags ?? []).length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {contact.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{contact.email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{contact.phone ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{contact.pipeline_stages?.name ?? "—"}</Badge>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{contact.source}</span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {formatDistanceToNow(new Date(contact.updated_at), { addSuffix: true })}
                  </td>
                  <td className="p-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
