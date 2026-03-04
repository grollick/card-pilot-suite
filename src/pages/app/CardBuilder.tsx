import { CreditCard, Eye, EyeOff, Paintbrush, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { motion } from "framer-motion";

const mockSections = [
  { id: "bio", label: "Bio", enabled: true },
  { id: "services", label: "Services", enabled: true },
  { id: "gallery", label: "Gallery", enabled: true },
  { id: "testimonials", label: "Testimonials", enabled: true },
  { id: "social_links", label: "Social Links", enabled: true },
  { id: "contact_form", label: "Contact Form", enabled: true },
  { id: "files", label: "Files", enabled: false },
  { id: "map", label: "Service Area", enabled: false },
];

export default function CardBuilder() {
  const [published, setPublished] = useState(false);
  const [sections, setSections] = useState(mockSections);

  const toggleSection = (id: string) => {
    setSections(s => s.map(sec => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Card Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Design and publish your digital business card</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{published ? "Published" : "Unpublished"}</span>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>
          <Button className="shadow-glow">
            <Smartphone className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections panel */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Sections</h2>
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <div key={section.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-grab">
                <span className="text-sm font-medium">{section.label}</span>
                <Switch checked={section.enabled} onCheckedChange={() => toggleSection(section.id)} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-muted/30 p-6 min-h-[600px] flex items-start justify-center">
          <div className="w-full max-w-sm mx-auto">
            {/* Mini card preview */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
              <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5" />
              <div className="px-5 pb-5 -mt-10">
                <div className="h-20 w-20 rounded-2xl bg-muted border-4 border-card flex items-center justify-center mb-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">Your Name</h3>
                <p className="text-sm text-muted-foreground">Your Profession</p>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 text-xs">Call</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">Text</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">Email</Button>
                </div>

                {sections.filter(s => s.enabled).map(section => (
                  <div key={section.id} className="mt-4 p-3 rounded-lg border border-dashed border-border/60 bg-muted/20">
                    <p className="text-xs text-muted-foreground text-center">{section.label} Section</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
