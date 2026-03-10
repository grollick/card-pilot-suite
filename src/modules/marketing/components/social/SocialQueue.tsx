import { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { useQueueSlots, useCreateQueueSlot, useDeleteQueueSlot } from "@/hooks/useSocialQueue";
import { PLATFORMS, getPlatformConfig } from "./constants";
import { format } from "date-fns";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SocialQueue() {
  const { data: posts = [] } = useSocialPosts();
  const { data: slots = [] } = useQueueSlots();
  const createSlot = useCreateQueueSlot();
  const deleteSlot = useDeleteQueueSlot();
  const [queuePaused, setQueuePaused] = useState(false);
  const [newSlotPlatform, setNewSlotPlatform] = useState("Instagram");
  const [newSlotDay, setNewSlotDay] = useState("0");
  const [newSlotTime, setNewSlotTime] = useState("10:00");

  const queuedPosts = posts.filter(p => ["scheduled", "queued"].includes(p.approval_status ?? ""));
  const nextPost = queuedPosts
    .filter(p => p.scheduled_at && new Date(p.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

  const handleAddSlot = async () => {
    try {
      await createSlot.mutateAsync({ platform: newSlotPlatform, day_of_week: parseInt(newSlotDay), time_slot: newSlotTime });
      toast.success("Queue slot added");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteSlot = async (id: string) => {
    try { await deleteSlot.mutateAsync(id); toast.success("Slot removed"); } catch (e: any) { toast.error(e.message); }
  };

  const slotsByDay = DAYS.map((day, i) => ({ day, dayIndex: i, slots: slots.filter(s => s.day_of_week === i) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Clock className="h-4 w-4 text-primary" /></div>
            <div><p className="text-2xl font-bold">{queuedPosts.length}</p><p className="text-xs text-muted-foreground">In Queue</p></div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-sm font-medium">{nextPost?.scheduled_at ? format(new Date(nextPost.scheduled_at), "MMM d, h:mm a") : "—"}</p>
              <p className="text-xs text-muted-foreground">Next Publish</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{slots.length}</p><p className="text-xs text-muted-foreground">Queue Slots</p></div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium">{queuePaused ? "Paused" : "Active"}</p><p className="text-xs text-muted-foreground">Queue Status</p></div>
            <Switch checked={!queuePaused} onCheckedChange={v => setQueuePaused(!v)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-[1fr,320px] gap-6">
        <Card className="dash-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Queue Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {slotsByDay.map(({ day, dayIndex, slots: daySlots }) => (
              <div key={dayIndex}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium w-20">{day}</span>
                  {daySlots.length === 0 && <span className="text-[10px] text-muted-foreground">No slots</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 ml-20">
                  {daySlots.map(slot => {
                    const cfg = getPlatformConfig(slot.platform);
                    return (
                      <div key={slot.id} className="flex items-center gap-1 border border-border rounded-full px-2 py-0.5 group">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cfg?.color}`}>{slot.platform}</span>
                        <span className="text-[10px] font-medium">{slot.time_slot}</span>
                        <button onClick={() => handleDeleteSlot(slot.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {dayIndex < 6 && <Separator className="mt-2" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="dash-card h-fit">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Add Queue Slot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={newSlotPlatform} onValueChange={setNewSlotPlatform}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.id}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Day</Label>
              <Select value={newSlotDay} onValueChange={setNewSlotDay}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)} className="h-8 text-xs mt-1" />
            </div>
            <Button size="sm" className="w-full" onClick={handleAddSlot} disabled={createSlot.isPending}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
