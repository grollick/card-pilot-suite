import { Shield, Edit, LayoutGrid, Settings2, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { professions, professionCategories, getProfessionsByCategory } from "@/data/professions";
import SystemEventsWidget from "@/modules/settings/components/SystemEventsWidget";
import BetaManagementTab from "@/modules/settings/components/BetaManagementTab";
import AdminFeedbackTab from "@/modules/settings/components/AdminFeedbackTab";
import BugPriorityDashboard from "@/modules/settings/components/BugPriorityDashboard";
import RoadmapBoard from "@/modules/settings/components/RoadmapBoard";
import AdminGrowthDashboard from "@/modules/settings/components/AdminGrowthDashboard";
import { useState } from "react";

type Section = "growth" | "content" | "feedback" | "system";

const sections: { id: Section; label: string; icon: typeof Shield }[] = [
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "content", label: "Content & Professions", icon: LayoutGrid },
  { id: "feedback", label: "Feedback & Bugs", icon: MessageSquare },
  { id: "system", label: "System", icon: Settings2 },
];

export default function AdminPage() {
  const [section, setSection] = useState<Section>("growth");
  const byCategory = getProfessionsByCategory();

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      </div>

      {/* Section nav */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <Button
            key={s.id}
            variant={section === s.id ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setSection(s.id)}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </Button>
        ))}
      </div>

      {/* Growth */}
      {section === "growth" && <AdminGrowthDashboard />}

      {/* Content & Professions */}
      {section === "content" && (
        <Tabs defaultValue="professions">
          <TabsList>
            <TabsTrigger value="professions">Professions ({professions.length})</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>

          <TabsContent value="professions" className="mt-4 space-y-6">
            {professionCategories.map(cat => (
              <div key={cat}>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="roadmap" className="mt-4">
            <RoadmapBoard />
          </TabsContent>
        </Tabs>
      )}

      {/* Feedback & Bugs */}
      {section === "feedback" && (
        <Tabs defaultValue="feedback">
          <TabsList>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="bugs">Bug Priority</TabsTrigger>
          </TabsList>
          <TabsContent value="feedback" className="mt-4"><AdminFeedbackTab /></TabsContent>
          <TabsContent value="bugs" className="mt-4"><BugPriorityDashboard /></TabsContent>
        </Tabs>
      )}

      {/* System */}
      {section === "system" && (
        <Tabs defaultValue="beta">
          <TabsList>
            <TabsTrigger value="beta">Beta Access</TabsTrigger>
            <TabsTrigger value="events">System Events</TabsTrigger>
          </TabsList>
          <TabsContent value="beta" className="mt-4"><BetaManagementTab /></TabsContent>
          <TabsContent value="events" className="mt-4"><SystemEventsWidget /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
