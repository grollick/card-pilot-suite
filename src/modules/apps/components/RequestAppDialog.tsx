import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestAppDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [appName, setAppName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!appName.trim()) {
      toast.error("Please enter an app name.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("beta_feedback").insert({
        user_id: user!.id,
        feedback_type: "feature_request" as any,
        feature_tag: "marketplace",
        message: `App Request: ${appName.trim()}${reason.trim() ? ` — ${reason.trim()}` : ""}`,
        page_url: "/app/marketplace",
      });
      if (error) throw error;
      toast.success("Request submitted! We'll review it shortly.");
      setAppName("");
      setReason("");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Request an App</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Don't see an app you need? Let us know and we'll look into adding it.
        </p>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="app-name" className="text-xs font-medium">App Name *</Label>
            <Input
              id="app-name"
              placeholder="e.g. ServiceM8, Buildertrend..."
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-reason" className="text-xs font-medium">Why do you need it? (optional)</Label>
            <Textarea
              id="app-reason"
              placeholder="Tell us how you'd use this app..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
