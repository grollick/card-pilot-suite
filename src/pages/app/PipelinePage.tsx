import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const stages = ["New Lead", "Contacted", "Follow-Up", "Qualified", "Closed"];

const mockContacts = [
  { id: "1", name: "Sarah Johnson", email: "sarah@example.com", stage: "New Lead", tags: ["Hot"], value: "$2,500" },
  { id: "2", name: "John Doe", email: "john@example.com", stage: "Contacted", tags: ["Referral"], value: "$1,200" },
  { id: "3", name: "Mike Chen", email: "mike@example.com", stage: "New Lead", tags: [], value: "" },
  { id: "4", name: "Lisa Park", email: "lisa@example.com", stage: "Follow-Up", tags: ["VIP"], value: "$5,000" },
  { id: "5", name: "Tom Rivera", email: "tom@example.com", stage: "Qualified", tags: [], value: "$3,000" },
];

export default function PipelinePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Drag contacts between stages</p>
        </div>
        <Button className="shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Contact
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]"
      >
        {stages.map(stage => {
          const contacts = mockContacts.filter(c => c.stage === stage);
          return (
            <div key={stage} className="min-w-[260px] w-[260px] shrink-0 rounded-xl border border-border bg-muted/30 p-3 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage}</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5">{contacts.length}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2 flex-1">
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => navigate(`/app/contacts/${contact.id}`)}
                    className="p-3 rounded-lg border border-border bg-card hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{contact.name}</p>
                      <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{contact.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {contact.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                      {contact.value && (
                        <span className="text-[10px] font-medium text-primary ml-auto">{contact.value}</span>
                      )}
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
