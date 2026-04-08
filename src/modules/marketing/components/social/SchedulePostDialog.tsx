import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillContent?: string;
  prefillImageUrl?: string;
}

export default function SchedulePostDialog({ open, onOpenChange, prefillContent, prefillImageUrl }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState(prefillContent || "");
  const [imageUrl, setImageUrl] = useState(prefillImageUrl || "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");

  // Reset on open
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setContent(prefillContent || "");
      setImageUrl(prefillImageUrl || "");
      setScheduledDate(format(new Date(Date.now() + 86400000), "yyyy-MM-dd"));
      setScheduledTime("09:00");
    }
    onOpenChange(o);
  };

  const schedule = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!content.trim()) throw new Error("Content is required");
      if (!scheduledDate) throw new Error("Date is required");

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

      const { error } = await (supabase as any).from("scheduled_posts").insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl || null,
        scheduled_at: scheduledAt,
        platforms: ["clipboard"],
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post scheduled!");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to post?"
              rows={4}
              className="resize-none"
            />
          </div>

          {imageUrl && (
            <div className="rounded-lg overflow-hidden border">
              <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            You'll get a reminder to copy & post at the scheduled time.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => schedule.mutate()} disabled={schedule.isPending || !content.trim()}>
            {schedule.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
