import { useState, useMemo } from "react";
import { Plus, Loader2, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  useSalesCrmContacts, useCreateSalesCrmContact, useUpdateSalesCrmContact,
  useDeleteSalesCrmContact, SALES_CRM_STAGES, type SalesCrmStage, type SalesCrmContact,
} from "@/hooks/useSalesCrm";
import { toast } from "sonner";

const STAGE_COLORS: Record<SalesCrmStage, string> = {
  new_lead: "bg-primary/10 border-primary/30",
  contacted: "bg-blue-500/10 border-blue-500/30",
  interested: "bg-amber-500/10 border-amber-500/30",
  card_built: "bg-violet-500/10 border-violet-500/30",
  got_first_lead: "bg-emerald-500/10 border-emerald-500/30",
  paid: "bg-green-600/10 border-green-600/30",
  upsell: "bg-pink-500/10 border-pink-500/30",
};

function ContactCard({
  contact, onDragStart, isDragging, onClick,
}: {
  contact: SalesCrmContact;
  onDragStart: (e: React.DragEvent) => void;
  isDragging: boolean;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? "opacity-40 scale-95" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{contact.name}</p>
          {contact.business_name && (
            <p className="text-xs text-muted-foreground truncate">{contact.business_name}</p>
          )}
          {contact.email && (
            <p className="text-[11px] text-muted-foreground truncate mt-1">{contact.email}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactFormDialog({
  open, onOpenChange, contact, onSave, onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contact?: SalesCrmContact;
  onSave: (data: any) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [businessName, setBusinessName] = useState(contact?.business_name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      business_name: businessName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "New Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" required />
          </div>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Plumbing" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@acme.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0100" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal notes..." />
          </div>
          <div className="flex justify-between">
            {contact && onDelete ? (
              <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            ) : <div />}
            <Button type="submit">{contact ? "Save" : "Add Contact"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SalesCrmPage() {
  const { data: contacts = [], isLoading } = useSalesCrmContacts();
  const createContact = useCreateSalesCrmContact();
  const updateContact = useUpdateSalesCrmContact();
  const deleteContact = useDeleteSalesCrmContact();

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SalesCrmContact | undefined>();

  const byStage = useMemo(() => {
    const map: Record<SalesCrmStage, SalesCrmContact[]> = {
      new_lead: [], contacted: [], interested: [], card_built: [],
      got_first_lead: [], paid: [], upsell: [],
    };
    contacts.forEach((c) => {
      if (map[c.stage]) map[c.stage].push(c);
    });
    return map;
  }, [contacts]);

  const handleDrop = async (e: React.DragEvent, toStage: SalesCrmStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedId) return;
    const contact = contacts.find((c) => c.id === draggedId);
    if (!contact || contact.stage === toStage) { setDraggedId(null); return; }
    try {
      await updateContact.mutateAsync({ id: draggedId, stage: toStage });
      toast.success(`Moved to ${SALES_CRM_STAGES.find((s) => s.id === toStage)?.label}`);
    } catch {
      toast.error("Failed to update stage");
    }
    setDraggedId(null);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, ...data });
        toast.success("Contact updated");
      } else {
        await createContact.mutateAsync(data);
        toast.success("Contact added");
      }
      setDialogOpen(false);
      setEditingContact(undefined);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async () => {
    if (!editingContact) return;
    try {
      await deleteContact.mutateAsync(editingContact.id);
      toast.success("Contact deleted");
      setDialogOpen(false);
      setEditingContact(undefined);
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Sales Pipeline</span></h1>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Sales Pipeline</span></h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track outreach, conversions, and upsells
          </p>
        </div>
        <Button onClick={() => { setEditingContact(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Contact
        </Button>
      </div>

      {/* Metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {SALES_CRM_STAGES.map((stage) => (
          <div key={stage.id} className="rounded-lg border bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{stage.label}</p>
            <p className="text-xl font-bold tabular-nums mt-1">{byStage[stage.id].length}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-4 min-h-[55vh]"
      >
        {SALES_CRM_STAGES.map((stage, i) => {
          const items = byStage[stage.id];
          const isDragOver = dragOverStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className={`min-w-[220px] w-[220px] shrink-0 rounded-xl border p-3 flex flex-col transition-all duration-200 ${
                isDragOver
                  ? "border-primary/50 scale-[1.01] bg-primary/5"
                  : `border-border bg-muted/30`
              }`}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverStage(stage.id); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stage.label}
                </h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 tabular-nums">
                  {items.length}
                </Badge>
              </div>

              <div className="space-y-2 flex-1">
                {items.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isDragging={draggedId === contact.id}
                    onDragStart={(e) => {
                      setDraggedId(contact.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => { setEditingContact(contact); setDialogOpen(true); }}
                  />
                ))}

                {items.length === 0 && (
                  <div className={`flex items-center justify-center h-16 text-xs border border-dashed rounded-xl transition-all duration-200 ${
                    isDragOver ? "border-primary/50 text-primary bg-primary/5" : "border-border text-muted-foreground"
                  }`}>
                    Drop here
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingContact(undefined); }}
        contact={editingContact}
        onSave={handleSave}
        onDelete={editingContact ? handleDelete : undefined}
      />
    </div>
  );
}
