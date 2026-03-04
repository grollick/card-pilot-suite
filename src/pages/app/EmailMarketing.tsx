import { Mail, Plus, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const mockTemplates = [
  { id: 1, name: "Welcome Email", subject: "Welcome aboard!", preview: "Hi {{name}}, excited to work together..." },
  { id: 2, name: "Follow-Up", subject: "Great speaking with you", preview: "Hi {{name}}, thanks for your time today..." },
  { id: 3, name: "Referral Request", subject: "Know someone?", preview: "Hi {{name}}, if you know anyone who..." },
];

const mockCampaigns = [
  { id: 1, name: "Welcome Series", status: "active", sent: 24, opened: 18, clicked: 6 },
  { id: 2, name: "Monthly Newsletter", status: "draft", sent: 0, opened: 0, clicked: 0 },
];

export default function EmailMarketing() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground text-sm mt-1">Send emails and manage campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><FileText className="h-4 w-4 mr-2" /> New Template</Button>
          <Button className="shadow-glow"><Send className="h-4 w-4 mr-2" /> Send Email</Button>
        </div>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4 space-y-4">
          {mockCampaigns.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Sent: {c.sent}</span>
                  <span>Opened: {c.opened}</span>
                  <span>Clicked: {c.clicked}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                c.status === "active" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"
              }`}>{c.status}</span>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTemplates.map(t => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-card transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">{t.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{t.subject}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.preview}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
