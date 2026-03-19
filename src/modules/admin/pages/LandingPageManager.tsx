import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Globe, FileText, Eye, EyeOff, Pencil, GripVertical, ChevronRight,
  Plus, Save, ArrowLeft, Shield, Loader2, ExternalLink, Trash2,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin } from "@/hooks/useAdminStats";
import { useLandingPages, useSaveLandingPage, type LandingPageContent, type LandingPageSection } from "@/hooks/useLandingPages";
import { toast } from "sonner";

const MAIN_PAGE_DEFAULTS: { key: string; title: string; description: string; url: string; sections: LandingPageSection[] }[] = [
  {
    key: "main",
    title: "Main Landing Page",
    description: "Primary homepage at /",
    url: "/",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: { headline: "Turn your business card into a customer-generating machine", subheadline: "Capture leads, send estimates, get paid, and grow your business — all from one platform.", cta_primary: "Get Started Free", cta_secondary: "View Demo" } },
      { id: "problem", type: "problem_solution", label: "Problem / Solution", enabled: true, content: { headline: "Sound familiar?", subheadline: "Most service professionals lose leads every day because they don't have the right tools." } },
      { id: "features", type: "features", label: "Features", enabled: true, content: { headline: "Everything you need to grow your business", subheadline: "Powerful tools designed for service professionals." } },
      { id: "how_it_works", type: "how_it_works", label: "How It Works", enabled: true, content: { headline: "Four steps to more customers" } },
      { id: "examples", type: "demo_cards", label: "Demo Cards", enabled: true, content: { headline: "Cards for every profession", subheadline: "See how professionals use guzzl.pro to grow their business." } },
      { id: "results", type: "results", label: "Results & Testimonials", enabled: true, content: { headline: "Real outcomes for real businesses", subheadline: "guzzl.pro helps service professionals get more leads, more bookings, and faster payments." } },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: { headline: "Simple, transparent pricing", subheadline: "Start free. Upgrade when you're ready to grow." } },
      { id: "final_cta", type: "final_cta", label: "Final CTA", enabled: true, content: { headline: "Start getting more customers today", subheadline: "Create your smart business card in 2 minutes. Start capturing leads today — free forever." } },
    ],
  },
  {
    key: "for/contractors",
    title: "Contractors Landing Page",
    description: "Industry page at /for/contractors",
    url: "/for/contractors",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: { headline: "Get More Renovation Leads and Book Jobs from One Link", subheadline: "Show your projects, capture quote requests, and let customers book consultations." } },
      { id: "problem", type: "problem_solution", label: "Problem / Solution", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "how_it_works", type: "how_it_works", label: "How It Works", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
      { id: "final_cta", type: "final_cta", label: "Final CTA", enabled: true, content: {} },
    ],
  },
  {
    key: "for/barbers",
    title: "Barbers Landing Page",
    description: "Industry page at /for/barbers",
    url: "/for/barbers",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "problem", type: "problem_solution", label: "Problem / Solution", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
  {
    key: "for/realtors",
    title: "Realtors Landing Page",
    description: "Industry page at /for/realtors",
    url: "/for/realtors",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "problem", type: "problem_solution", label: "Problem / Solution", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
  {
    key: "for/photographers",
    title: "Photographers Landing Page",
    description: "Industry page at /for/photographers",
    url: "/for/photographers",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "problem", type: "problem_solution", label: "Problem / Solution", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
  {
    key: "for/landscapers",
    title: "Landscapers Landing Page",
    description: "Industry page at /for/landscapers",
    url: "/for/landscapers",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "problem", type: "problem_solution", label: "Problem / Solution", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
];

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: "Hero Section",
  problem_solution: "Problem / Solution",
  features: "Features Grid",
  how_it_works: "How It Works",
  demo_cards: "Demo Cards",
  results: "Results & Social Proof",
  pricing: "Pricing Plans",
  final_cta: "Final Call to Action",
  testimonials: "Testimonials",
  custom: "Custom Section",
};

const NEW_SECTION_TYPES = [
  { type: "hero", label: "Hero" },
  { type: "problem_solution", label: "Problem / Solution" },
  { type: "features", label: "Features" },
  { type: "how_it_works", label: "How It Works" },
  { type: "demo_cards", label: "Demo Cards" },
  { type: "results", label: "Results" },
  { type: "testimonials", label: "Testimonials" },
  { type: "pricing", label: "Pricing" },
  { type: "final_cta", label: "Final CTA" },
  { type: "custom", label: "Custom Section" },
];

export default function LandingPageManager() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: savedPages, isLoading } = useLandingPages();
  const saveMutation = useSaveLandingPage();

  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    page_key: string;
    page_title: string;
    page_description: string;
    sections: LandingPageSection[];
    settings: Record<string, any>;
    is_published: boolean;
  } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  if (adminLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Shield className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">Admin privileges required.</p>
      </div>
    );
  }

  // Merge saved pages with defaults
  const pages = MAIN_PAGE_DEFAULTS.map((def) => {
    const saved = savedPages?.find((p) => p.page_key === def.key);
    return {
      ...def,
      saved,
      is_published: saved?.is_published ?? true,
      updated_at: saved?.updated_at,
    };
  });

  function startEditing(pageKey: string) {
    const def = MAIN_PAGE_DEFAULTS.find((p) => p.key === pageKey);
    const saved = savedPages?.find((p) => p.page_key === pageKey);
    if (!def) return;

    setEditData({
      page_key: pageKey,
      page_title: saved?.page_title || def.title,
      page_description: saved?.page_description || def.description,
      sections: (saved?.sections_json as LandingPageSection[]) || def.sections,
      settings: (saved?.settings_json as Record<string, any>) || {},
      is_published: saved?.is_published ?? true,
    });
    setEditingPage(pageKey);
    setExpandedSection(null);
  }

  function handleSave() {
    if (!editData) return;
    saveMutation.mutate(
      {
        page_key: editData.page_key,
        page_title: editData.page_title,
        page_description: editData.page_description,
        sections_json: editData.sections as any,
        settings_json: editData.settings as any,
        is_published: editData.is_published,
      },
      {
        onSuccess: () => toast.success("Page saved successfully"),
        onError: (err: any) => toast.error(err.message || "Failed to save"),
      }
    );
  }

  function toggleSection(sectionId: string) {
    if (!editData) return;
    setEditData({
      ...editData,
      sections: editData.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  }

  function moveSection(sectionId: string, direction: "up" | "down") {
    if (!editData) return;
    const idx = editData.sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= editData.sections.length) return;
    const newSections = [...editData.sections];
    [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];
    setEditData({ ...editData, sections: newSections });
  }

  function deleteSection(sectionId: string) {
    if (!editData) return;
    setEditData({
      ...editData,
      sections: editData.sections.filter((s) => s.id !== sectionId),
    });
  }

  function duplicateSection(sectionId: string) {
    if (!editData) return;
    const idx = editData.sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const orig = editData.sections[idx];
    const newSection: LandingPageSection = {
      ...orig,
      id: `${orig.type}_${Date.now()}`,
      label: `${orig.label} (Copy)`,
    };
    const newSections = [...editData.sections];
    newSections.splice(idx + 1, 0, newSection);
    setEditData({ ...editData, sections: newSections });
  }

  function addSection(type: string) {
    if (!editData) return;
    const label = SECTION_TYPE_LABELS[type] || "Custom Section";
    const newSection: LandingPageSection = {
      id: `${type}_${Date.now()}`,
      type,
      label,
      enabled: true,
      content: {},
    };
    setEditData({ ...editData, sections: [...editData.sections, newSection] });
    setShowAddSection(false);
    setExpandedSection(newSection.id);
  }

  function updateSectionContent(sectionId: string, field: string, value: string) {
    if (!editData) return;
    setEditData({
      ...editData,
      sections: editData.sections.map((s) =>
        s.id === sectionId ? { ...s, content: { ...s.content, [field]: value } } : s
      ),
    });
  }

  // ─── Page list view ───
  if (!editingPage || !editData) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Landing Pages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View, edit, and manage all your landing pages.
          </p>
        </div>

        <div className="space-y-3">
          {pages.map((page, i) => (
            <motion.div
              key={page.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {page.key === "main" ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{page.title}</p>
                  <Badge variant={page.is_published ? "default" : "secondary"} className="text-2xs">
                    {page.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{page.description}</p>
                {page.updated_at && (
                  <p className="text-2xs text-muted-foreground mt-1">
                    Last edited: {new Date(page.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={page.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <Button variant="outline" size="sm" onClick={() => startEditing(page.key)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Page editor view ───
  const currentDef = MAIN_PAGE_DEFAULTS.find((p) => p.key === editData.page_key);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPage(null); setEditData(null); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{editData.page_title}</h1>
            <p className="text-xs text-muted-foreground">{currentDef?.url || `/${editData.page_key}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground text-xs">Published</span>
            <Switch checked={editData.is_published} onCheckedChange={(v) => setEditData({ ...editData, is_published: v })} />
          </div>
          <a href={currentDef?.url || `/${editData.page_key}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          </a>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="settings">Page Settings</TabsTrigger>
        </TabsList>

        {/* ─── Sections Tab ─── */}
        <TabsContent value="sections" className="space-y-3 mt-4">
          {editData.sections.map((section, idx) => (
            <div
              key={section.id}
              className={`rounded-xl border bg-card transition-all ${
                section.enabled ? "border-border" : "border-border/50 opacity-60"
              }`}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{section.label}</p>
                    <Badge variant="secondary" className="text-2xs">{SECTION_TYPE_LABELS[section.type] || section.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, "up")} disabled={idx === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, "down")} disabled={idx === editData.sections.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSection(section.id)}>
                    {section.enabled ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateSection(section.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => deleteSection(section.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded content editor */}
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border px-4 py-4 space-y-4"
                >
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Section Label</label>
                    <Input
                      value={section.label}
                      onChange={(e) => setEditData({
                        ...editData,
                        sections: editData.sections.map((s) =>
                          s.id === section.id ? { ...s, label: e.target.value } : s
                        ),
                      })}
                      className="text-sm"
                    />
                  </div>

                  {/* Dynamic content fields */}
                  {Object.keys(section.content).length === 0 ? (
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        This section uses default content. Add custom fields below.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        {["headline", "subheadline", "cta_primary", "cta_secondary"].map((field) => (
                          <Button
                            key={field}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => updateSectionContent(section.id, field, "")}
                          >
                            <Plus className="h-3 w-3 mr-1" /> {field.replace(/_/g, " ")}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    Object.entries(section.content).map(([field, value]) => (
                      <div key={field}>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block capitalize">
                          {field.replace(/_/g, " ")}
                        </label>
                        {String(value).length > 80 ? (
                          <Textarea
                            value={String(value)}
                            onChange={(e) => updateSectionContent(section.id, field, e.target.value)}
                            className="text-sm min-h-[80px]"
                          />
                        ) : (
                          <Input
                            value={String(value)}
                            onChange={(e) => updateSectionContent(section.id, field, e.target.value)}
                            className="text-sm"
                          />
                        )}
                      </div>
                    ))
                  )}

                  {/* Add custom field */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const fieldName = prompt("Field name (e.g. headline, body_text):");
                      if (fieldName) updateSectionContent(section.id, fieldName.trim(), "");
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add custom field
                  </Button>
                </motion.div>
              )}
            </div>
          ))}

          {/* Add section button */}
          {showAddSection ? (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Choose a section type to add:</p>
              <div className="flex flex-wrap gap-2">
                {NEW_SECTION_TYPES.map((st) => (
                  <Button key={st.type} variant="outline" size="sm" className="text-xs" onClick={() => addSection(st.type)}>
                    <Plus className="h-3 w-3 mr-1" /> {st.label}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-xs mt-2" onClick={() => setShowAddSection(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddSection(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Section
            </Button>
          )}
        </TabsContent>

        {/* ─── Settings Tab ─── */}
        <TabsContent value="settings" className="space-y-6 mt-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Page Title</label>
              <Input
                value={editData.page_title}
                onChange={(e) => setEditData({ ...editData, page_title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Page Description</label>
              <Textarea
                value={editData.page_description}
                onChange={(e) => setEditData({ ...editData, page_description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL Path</label>
              <Input value={currentDef?.url || `/${editData.page_key}`} disabled className="opacity-60" />
              <p className="text-2xs text-muted-foreground mt-1">URL path cannot be changed</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
