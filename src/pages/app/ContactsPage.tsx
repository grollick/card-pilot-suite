import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Filter, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const mockContacts = [
  { id: "1", name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 123-4567", source: "Card", stage: "New Lead", tags: ["Hot"], lastActivity: "2 hours ago" },
  { id: "2", name: "John Doe", email: "john@example.com", phone: "(555) 234-5678", source: "Booking", stage: "Contacted", tags: ["Referral"], lastActivity: "1 day ago" },
  { id: "3", name: "Mike Chen", email: "mike@example.com", phone: "(555) 345-6789", source: "Card", stage: "New Lead", tags: [], lastActivity: "3 days ago" },
  { id: "4", name: "Lisa Park", email: "lisa@example.com", phone: "(555) 456-7890", source: "Card", stage: "Follow-Up", tags: ["VIP"], lastActivity: "5 days ago" },
  { id: "5", name: "Tom Rivera", email: "tom@example.com", phone: "(555) 567-8901", source: "Manual", stage: "Qualified", tags: [], lastActivity: "1 week ago" },
];

export default function ContactsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = mockContacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.stage === stageFilter;
    const matchSource = sourceFilter === "all" || c.source === sourceFilter;
    return matchSearch && matchStage && matchSource;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockContacts.length} contacts</p>
        </div>
        <Button className="shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Contact
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="New Lead">New Lead</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Follow-Up">Follow-Up</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="Booking">Booking</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
            <SelectItem value="Import">Import</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Stage</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Source</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Last Activity</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => (
              <tr
                key={contact.id}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/app/contacts/${contact.id}`)}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {contact.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      {contact.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {contact.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{contact.email}</td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">{contact.phone}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs">{contact.stage}</Badge>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{contact.source}</span>
                </td>
                <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{contact.lastActivity}</td>
                <td className="p-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
