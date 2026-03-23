import { useState } from "react";
import { FileText, Plus, Copy, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ContentBlock {
  id: string;
  title: string;
  type: string;
  preview: string;
  usedIn: string[];
}

const defaultBlocks: ContentBlock[] = [
  { id: "1", title: "Professional Bio", type: "Bio", preview: "I help homeowners find their dream property with personalized service…", usedIn: ["Card", "Email"] },
  { id: "2", title: "5-Star Testimonial — Sarah J.", type: "Testimonial", preview: "\"Working with them was the best decision we made…\"", usedIn: ["Card", "Social"] },
  { id: "3", title: "Spring Promo 2026", type: "Offer", preview: "Book before March 15 and get 15% off your first consultation.", usedIn: ["Email", "Social"] },
  { id: "4", title: "Service Overview", type: "Bio", preview: "Full-service real estate including buying, selling, and property management…", usedIn: ["Card"] },
];

const blockTypes = ["Bio", "Testimonial", "Offer", "Service", "FAQ", "Other"];
const channels = ["Card", "Email", "Social"];

export default function ContentPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>(defaultBlocks);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("Bio");
  const [formPreview, setFormPreview] = useState("");
  const [formUsedIn, setFormUsedIn] = useState<string[]>([]);

  const openCreate = () => {
    setFormTitle("");
    setFormType("Bio");
    setFormPreview("");
    setFormUsedIn([]);
    setEditingBlock(null);
    setIsCreating(true);
  };

  const openEdit = (block: ContentBlock) => {
    setFormTitle(block.title);
    setFormType(block.type);
    setFormPreview(block.preview);
    setFormUsedIn([...block.usedIn]);
    setEditingBlock(block);
    setIsCreating(true);
  };

  const toggleChannel = (ch: string) => {
    setFormUsedIn((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formPreview.trim()) {
      toast.error("Title and content are required");
      return;
    }
    const newBlock: ContentBlock = {
      id: editingBlock?.id ?? crypto.randomUUID(),
      title: formTitle.trim(),
      type: formType,
      preview: formPreview.trim(),
      usedIn: formUsedIn,
    };
    if (editingBlock) {
      setBlocks((prev) => prev.map((b) => (b.id === editingBlock.id ? newBlock : b)));
      toast.success("Block updated");
    } else {
      setBlocks((prev) => [newBlock, ...prev]);
      toast.success("Block created");
    }
    setIsCreating(false);
    setEditingBlock(null);
  };

  const handleDelete = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    toast.success("Block deleted");
  };

  const handleCopy = (block: ContentBlock) => {
    navigator.clipboard.writeText(block.preview);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary">guzzl</span> <span className="font-normal">Content</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Reusable content blocks for cards, emails & social</p>
        </div>
        <Button className="shadow-glow" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Block
        </Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {blocks.map((block) => (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <button
                  className="flex items-center gap-2 text-left min-w-0 flex-1"
                  onClick={() => openEdit(block)}
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{block.title}</p>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">{block.type}</Badge>
                  </div>
                </button>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(block)} title="Copy content">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(block)} title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(block.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{block.preview}</p>
              <div className="flex gap-1 mt-3">
                {block.usedIn.map((u) => (
                  <span key={u} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{u}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Create / Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Edit Block" : "New Content Block"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Professional Bio" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {blockTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Content</label>
              <Textarea value={formPreview} onChange={(e) => setFormPreview(e.target.value)} placeholder="Write your content block…" rows={4} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Used in</label>
              <div className="flex gap-2">
                {channels.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      formUsedIn.includes(ch)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-1" /> {editingBlock ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
