import { useState } from "react";
import { Users, Search, Filter, Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const mockLeads = [
  { id: 1, name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 123-4567", source: "Card", stage: "New Lead", tags: ["Hot"], created: "2 hours ago" },
  { id: 2, name: "John Doe", email: "john@example.com", phone: "(555) 234-5678", source: "Booking", stage: "Contacted", tags: ["Referral"], created: "1 day ago" },
  { id: 3, name: "Mike Chen", email: "mike@example.com", phone: "(555) 345-6789", source: "Card", stage: "New Lead", tags: [], created: "3 days ago" },
  { id: 4, name: "Lisa Park", email: "lisa@example.com", phone: "(555) 456-7890", source: "Card", stage: "Follow-Up", tags: ["VIP"], created: "5 days ago" },
];

const stages = ["New Lead", "Contacted", "Follow-Up", "Qualified", "Closed"];

export default function LeadsCRM() {
  const [view, setView] = useState<"table" | "board">("table");
  const [search, setSearch] = useState("");

  const filtered = mockLeads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your contacts and pipeline</p>
        </div>
        <Button className="shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Lead
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button onClick={() => setView("table")}
            className={`px-3 py-1.5 text-xs transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <List className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setView("board")}
            className={`px-3 py-1.5 text-xs transition-colors ${view === "board" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {view === "table" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Source</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Stage</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {lead.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{lead.email}</td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{lead.source}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{lead.stage}</span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{lead.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stages.map(stage => (
            <div key={stage} className="rounded-xl border border-border bg-card/50 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{stage}</h3>
              <div className="space-y-2">
                {mockLeads.filter(l => l.stage === stage).map(lead => (
                  <div key={lead.id} className="p-3 rounded-lg border border-border bg-card hover:shadow-card transition-shadow cursor-pointer">
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lead.email}</p>
                    <div className="flex gap-1 mt-2">
                      {lead.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {mockLeads.filter(l => l.stage === stage).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No leads</p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
