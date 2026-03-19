import { useState } from "react";
import { FileText, Edit, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to CardPilot, {{name}}!",
    body: "Hi {{name}},\n\nWelcome to CardPilot! You're one step closer to growing your business.\n\nHere's what to do next:\n1. Set up your digital business card\n2. Add your services and availability\n3. Share your card link to start getting leads\n\nLet's get started!",
    category: "onboarding",
  },
  {
    id: "activation",
    name: "Activation Nudge",
    subject: "{{name}}, your card is almost ready!",
    body: "Hi {{name}},\n\nYou signed up for CardPilot but haven't published your card yet.\n\nA published card means customers can find you, book you, and send you leads — all automatically.\n\nIt only takes 2 minutes to go live. Ready?",
    category: "engagement",
  },
  {
    id: "engagement",
    name: "Engagement Boost",
    subject: "You just got a new lead, {{name}}!",
    body: "Hi {{name}},\n\nGreat news — someone just submitted an inquiry through your CardPilot card!\n\nResponding quickly can increase your chances of closing by 80%. Head to your dashboard to follow up now.",
    category: "engagement",
  },
  {
    id: "upgrade",
    name: "Upgrade Prompt",
    subject: "Unlock more leads with Pro, {{name}}",
    body: "Hi {{name}},\n\nYou've been getting great results on CardPilot! Here's what you're missing on Pro:\n\n• Unlimited contacts\n• Advanced analytics\n• Priority listing on the marketplace\n• Automated follow-ups\n\nOne new job pays for your entire month. Upgrade now and grow faster.",
    category: "conversion",
  },
  {
    id: "beta-expiry",
    name: "Beta Expiry Notice",
    subject: "Your beta access expires soon, {{name}}",
    body: "Hi {{name}},\n\nYour beta access to CardPilot Pro features expires in 3 days.\n\nTo keep your premium features and all the data you've built, upgrade to Pro before your access ends.\n\nEverything you've created will be preserved — just in a locked state until you upgrade.",
    category: "retention",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  onboarding: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  engagement: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  conversion: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  retention: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setEditSubject(t.subject);
    setEditBody(t.body);
  };

  const saveEdit = () => {
    if (!editing) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editing.id ? { ...t, subject: editSubject, body: editBody } : t
      )
    );
    setEditing(null);
    toast.success("Template updated");
  };

  const copyBody = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Email Templates</h2>
          <p className="text-sm text-muted-foreground">Pre-built templates for common campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                  <Badge variant="secondary" className={CATEGORY_COLORS[t.category] ?? ""}>
                    {t.category}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyBody(t.body)} title="Copy">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)} title="Edit">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground font-medium mb-1">Subject: {t.subject}</p>
              <p className="text-xs text-muted-foreground line-clamp-3">{t.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template — {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea rows={10} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={saveEdit}>
                <Check className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
