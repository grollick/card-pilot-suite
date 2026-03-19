import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { professions, professionCategories, getProfessionsByCategory } from "@/data/professions";
import { motion } from "framer-motion";
import SystemEventsWidget from "@/modules/settings/components/SystemEventsWidget";
import BetaManagementTab from "@/modules/settings/components/BetaManagementTab";
import AdminFeedbackTab from "@/modules/settings/components/AdminFeedbackTab";
export default function AdminPage() {
  const byCategory = getProfessionsByCategory();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage professions, templates, and defaults</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="professions">
        <TabsList>
          <TabsTrigger value="professions">Professions ({professions.length})</TabsTrigger>
          <TabsTrigger value="templates">Default Templates</TabsTrigger>
          <TabsTrigger value="pipeline">Default Pipeline</TabsTrigger>
          <TabsTrigger value="services">Default Services</TabsTrigger>
           <TabsTrigger value="emails">Default Emails</TabsTrigger>
           <TabsTrigger value="system-events">System Events</TabsTrigger>
           <TabsTrigger value="beta">Beta Access</TabsTrigger>
           <TabsTrigger value="feedback">Feedback</TabsTrigger>
         </TabsList>

        <TabsContent value="professions" className="mt-4 space-y-6">
          {professionCategories.map(cat => (
            <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {byCategory[cat]?.map(p => (
                  <div key={p.name} className="rounded-lg border border-border bg-card p-3 hover:shadow-card transition-shadow flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.cardSections.length} sections · {p.pipelineStages.length} stages · {p.bookingServices.length} services
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <p className="text-sm text-muted-foreground">Manage default card templates per profession. Connect backend to enable editing.</p>
        </TabsContent>
        <TabsContent value="pipeline" className="mt-4">
          <p className="text-sm text-muted-foreground">Manage default pipeline stages per profession. Connect backend to enable editing.</p>
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <p className="text-sm text-muted-foreground">Manage default booking services per profession. Connect backend to enable editing.</p>
        </TabsContent>
        <TabsContent value="emails" className="mt-4">
          <p className="text-sm text-muted-foreground">Manage default email templates per profession. Connect backend to enable editing.</p>
        </TabsContent>
        <TabsContent value="system-events" className="mt-4">
          <SystemEventsWidget />
        </TabsContent>
        <TabsContent value="beta" className="mt-4">
          <BetaManagementTab />
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          <AdminFeedbackTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
