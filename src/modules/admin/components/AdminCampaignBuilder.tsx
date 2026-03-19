import { useState } from "react";
import { Send, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AdminStats } from "@/hooks/useAdminStats";

type Audience = "all" | "starter" | "pro" | "pro_plus" | "beta";

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "starter", label: "Free / Starter" },
  { value: "pro", label: "Pro" },
  { value: "pro_plus", label: "Pro Plus" },
  { value: "beta", label: "Beta Users" },
];

const PERSONALIZATION_VARS = [
  { key: "{{name}}", desc: "User's name" },
  { key: "{{business}}", desc: "Business name" },
  { key: "{{plan}}", desc: "Current plan" },
];

interface Props {
  stats?: AdminStats | null;
}

export default function AdminCampaignBuilder({ stats }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const audienceCount = (() => {
    if (!stats) return 0;
    if (audience === "all") return stats.totalUsers;
    return stats.planCounts[audience] ?? 0;
  })();

  const previewHtml = message
    .replace(/{{name}}/g, "John Smith")
    .replace(/{{business}}/g, "Smith Contracting")
    .replace(/{{plan}}/g, "Pro");

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSending(true);
    try {
      // Placeholder: In production, this would invoke an edge function
      await new Promise((r) => setTimeout(r, 1500));
      toast.success(`Campaign queued for ${audienceCount} users`);
      setSubject("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Campaign</CardTitle>
          <CardDescription>Send targeted emails to your user base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="e.g. Your first lead is waiting!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">~{audienceCount} recipients</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              rows={8}
              placeholder="Write your email content here. Use personalization variables like {{name}}."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
            />
            <div className="flex flex-wrap gap-2">
              {PERSONALIZATION_VARS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors"
                  onClick={() => setMessage((m) => m + v.key)}
                  title={v.desc}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!message.trim()}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                </DialogHeader>
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold">{subject || "(no subject)"}</p>
                  <hr />
                  <div className="text-sm whitespace-pre-wrap">{previewHtml}</div>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()}>
              {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Send to {audienceCount} users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
