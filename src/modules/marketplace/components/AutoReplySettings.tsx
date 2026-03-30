import { useState, useEffect } from "react";
import { Settings, Bot, Clock, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAutoReplySettings, useSaveAutoReplySettings, type AutoReplySettings as SettingsType } from "../hooks/useAutoReply";

export default function AutoReplySettings() {
  const { data: saved, isLoading } = useAutoReplySettings();
  const saveMutation = useSaveAutoReplySettings();

  const [settings, setSettings] = useState<Partial<SettingsType>>({
    auto_reply_enabled: false,
    auto_follow_up_enabled: false,
    review_before_send: true,
    reply_tone: "professional",
    business_hours_only: true,
    high_intent_only: false,
  });

  useEffect(() => {
    if (saved) setSettings(saved);
  }, [saved]);

  const update = (key: keyof SettingsType, value: any) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(settings, {
      onSuccess: () => toast.success("Settings saved"),
      onError: () => toast.error("Could not save settings"),
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Settings className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-foreground">Copilot Auto-Reply Settings</h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Master toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <Label className="text-sm font-medium">Auto-reply to new leads</Label>
              <p className="text-xs text-muted-foreground">AI will draft and optionally send replies</p>
            </div>
          </div>
          <Switch checked={settings.auto_reply_enabled} onCheckedChange={(v) => update("auto_reply_enabled", v)} />
        </div>

        {/* Auto follow-up */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/10">
              <Zap className="h-4 w-4 text-warning" />
            </div>
            <div>
              <Label className="text-sm font-medium">Auto follow-up</Label>
              <p className="text-xs text-muted-foreground">Send follow-up if no response after 48h</p>
            </div>
          </div>
          <Switch checked={settings.auto_follow_up_enabled} onCheckedChange={(v) => update("auto_follow_up_enabled", v)} />
        </div>

        {/* Review before send */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10">
              <Shield className="h-4 w-4 text-success" />
            </div>
            <div>
              <Label className="text-sm font-medium">Review before sending</Label>
              <p className="text-xs text-muted-foreground">Always show draft for approval first</p>
            </div>
          </div>
          <Switch checked={settings.review_before_send} onCheckedChange={(v) => update("review_before_send", v)} />
        </div>

        {/* Business hours */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <Label className="text-sm font-medium">Only during business hours</Label>
              <p className="text-xs text-muted-foreground">Auto-replies sent during working hours only</p>
            </div>
          </div>
          <Switch checked={settings.business_hours_only} onCheckedChange={(v) => update("business_hours_only", v)} />
        </div>

        {/* High intent only */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/10">
              <Zap className="h-4 w-4 text-warning" />
            </div>
            <div>
              <Label className="text-sm font-medium">High intent leads only</Label>
              <p className="text-xs text-muted-foreground">Only auto-reply to leads scored 80+</p>
            </div>
          </div>
          <Switch checked={settings.high_intent_only} onCheckedChange={(v) => update("high_intent_only", v)} />
        </div>

        {/* Reply tone */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Reply tone</Label>
          <Select value={settings.reply_tone} onValueChange={(v) => update("reply_tone", v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Safety note */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Safety rules</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5 ml-5 list-disc">
            <li>Never promises pricing unless configured</li>
            <li>Never confirms exact availability</li>
            <li>Falls back to draft if confidence is low</li>
            <li>Skips auto-send when required info is missing</li>
          </ul>
        </div>

        <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full sm:w-auto">
          {saveMutation.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
