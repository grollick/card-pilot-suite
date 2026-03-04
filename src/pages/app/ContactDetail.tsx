import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, MessageSquare,
  Plus, Clock, CheckCircle2, Eye, MousePointer, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const mockContact = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah@example.com",
  phone: "(555) 123-4567",
  source: "Card",
  stage: "New Lead",
  tags: ["Hot"],
  notes: "Interested in premium package. Prefers morning calls.",
  created: "Mar 1, 2026",
};

const timeline = [
  { icon: Eye, text: "Viewed your card", time: "2 hours ago", color: "text-muted-foreground" },
  { icon: MousePointer, text: "Clicked Call button", time: "2 hours ago", color: "text-primary" },
  { icon: Users, text: "Lead form submitted", time: "2 hours ago", color: "text-primary" },
  { icon: Calendar, text: "Booking created: Consultation", time: "1 day ago", color: "text-[hsl(var(--success))]" },
  { icon: Mail, text: "Welcome email sent", time: "1 day ago", color: "text-muted-foreground" },
  { icon: MessageSquare, text: "Note added: Prefers morning calls", time: "1 day ago", color: "text-muted-foreground" },
];

const tasks = [
  { text: "Follow up on consultation", due: "Today", done: false },
  { text: "Send proposal", due: "Tomorrow", done: false },
  { text: "Initial outreach", due: "Mar 1", done: true },
];

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/contacts")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-5"
        >
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                {mockContact.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h1 className="text-xl font-bold">{mockContact.name}</h1>
                <Badge variant="outline" className="mt-1">{mockContact.stage}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {mockContact.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {mockContact.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> Added {mockContact.created}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
              <div className="flex gap-1 flex-wrap">
                {mockContact.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{mockContact.notes}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs">
                <Phone className="h-3.5 w-3.5" /> Log Call
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Add Note
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs">
                <FileText className="h-3.5 w-3.5" /> Create Task
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs">
                <Mail className="h-3.5 w-3.5" /> Send Email
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs col-span-2">
                <Calendar className="h-3.5 w-3.5" /> Book Appointment
              </Button>
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</p>
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm ${task.done ? "line-through text-muted-foreground" : ""}`}>
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${task.done ? "text-[hsl(var(--success))]" : "text-muted-foreground/40"}`} />
                  <span className="flex-1">{task.text}</span>
                  <span className="text-xs text-muted-foreground">{task.due}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right — Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-4">Activity Timeline</h2>
            <div className="space-y-0">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pt-1 pb-3">
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
