import { useState } from "react";
import { Trophy, Plus, Edit, Trash2, Copy, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAllSuccessStories, useUpsertSuccessStory, useDeleteSuccessStory, SuccessStory } from "@/hooks/useSuccessStories";
import { toast } from "sonner";

const LOCATIONS = ["landing", "dashboard", "onboarding"];

const emptyStory = {
  user_name: "",
  business_type: "",
  result_text: "",
  timeframe: "",
  quote: "",
  metric_value: "",
  metric_label: "",
  is_featured: false,
  is_active: true,
  display_locations: ["landing", "dashboard", "onboarding"],
};

export default function SuccessStoriesManager() {
  const { data: stories = [], isLoading } = useAllSuccessStories();
  const upsert = useUpsertSuccessStory();
  const remove = useDeleteSuccessStory();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyStory & { id?: string }>(emptyStory);

  const handleSave = () => {
    if (!form.user_name || !form.business_type || !form.result_text) {
      toast.error("Name, business type, and result are required");
      return;
    }
    upsert.mutate(form as any, {
      onSuccess: () => {
        toast.success(form.id ? "Story updated" : "Story added");
        setOpen(false);
        setForm(emptyStory);
      },
    });
  };

  const handleEdit = (s: SuccessStory) => {
    setForm({ ...s });
    setOpen(true);
  };

  const handleCopy = (s: SuccessStory) => {
    const text = `${s.user_name} (${s.business_type}): ${s.result_text} in ${s.timeframe}. "${s.quote}"`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard for outreach");
  };

  const toggleLocation = (loc: string) => {
    setForm((f) => ({
      ...f,
      display_locations: f.display_locations.includes(loc)
        ? f.display_locations.filter((l) => l !== loc)
        : [...f.display_locations, loc],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-bold">Success Stories</h2>
          <Badge variant="secondary">{stories.length}</Badge>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyStory); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Story</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} Success Story</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="User name" value={form.user_name} onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))} />
                <Input placeholder="Business type" value={form.business_type} onChange={(e) => setForm((f) => ({ ...f, business_type: e.target.value }))} />
              </div>
              <Input placeholder="Result (e.g., 40% more leads)" value={form.result_text} onChange={(e) => setForm((f) => ({ ...f, result_text: e.target.value }))} />
              <Input placeholder="Timeframe (e.g., first month)" value={form.timeframe} onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))} />
              <Textarea placeholder="Quote from user" value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Metric value (e.g., 47)" value={form.metric_value} onChange={(e) => setForm((f) => ({ ...f, metric_value: e.target.value }))} />
                <Input placeholder="Metric label (e.g., new leads)" value={form.metric_label} onChange={(e) => setForm((f) => ({ ...f, metric_label: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show on:</span>
                {LOCATIONS.map((loc) => (
                  <Badge
                    key={loc}
                    variant={form.display_locations.includes(loc) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleLocation(loc)}
                  >
                    {loc}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
                  Featured
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                  Active
                </label>
              </div>
              <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
                {form.id ? "Update" : "Add"} Story
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : stories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No success stories yet. Add your first one!</p>
      ) : (
        <div className="grid gap-3">
          {stories.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{s.user_name}</span>
                  <Badge variant="outline" className="text-2xs">{s.business_type}</Badge>
                  {s.is_featured && <Star className="h-3.5 w-3.5 text-warning fill-warning" />}
                  {!s.is_active && <Badge variant="destructive" className="text-2xs">Inactive</Badge>}
                </div>
                <p className="text-sm text-foreground">{s.result_text}{s.timeframe && ` — ${s.timeframe}`}</p>
                {s.quote && <p className="text-xs text-muted-foreground italic mt-1">"{s.quote}"</p>}
                {s.metric_value && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg font-bold text-primary">{s.metric_value}</span>
                    <span className="text-xs text-muted-foreground">{s.metric_label}</span>
                  </div>
                )}
                <div className="flex gap-1 mt-2">
                  {s.display_locations?.map((loc) => (
                    <Badge key={loc} variant="secondary" className="text-2xs capitalize">{loc}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(s)} title="Copy for outreach">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(s)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(s.id, { onSuccess: () => toast.success("Deleted") })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
