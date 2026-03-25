import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, FileText, Eye, Pencil, GripVertical,
  Plus, Save, ArrowLeft, Shield, Loader2, ExternalLink, Trash2,
  ToggleLeft, ToggleRight, Copy, X, Monitor, Smartphone, Tablet,
  ChevronRight, Layout, Type, Star, Megaphone, CreditCard,
  MessageSquare, Image, Settings2, Sparkles, PanelTop, Scale,
  Layers, FlaskConical, ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsAdmin } from "@/hooks/useAdminStats";
import { useLandingPages, useSaveLandingPage, type LandingPageContent, type LandingPageSection } from "@/hooks/useLandingPages";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";

// ─── Constants ───

const MAIN_PAGE_DEFAULTS: { key: string; title: string; description: string; url: string; sections: LandingPageSection[] }[] = [
  {
    key: "main",
    title: "Main Landing Page",
    description: "Primary homepage at /",
    url: "/",
    sections: [
      { id: "header", type: "header", label: "Header / Navigation", enabled: true, content: { logo_text: "guzzl.pro", logo_url: "", nav_links: "Features,Pricing,Contact", cta_text: "Get Started", cta_url: "/auth", sticky: "true", style: "transparent" } },
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
    key: "privacy",
    title: "Privacy Policy",
    description: "Privacy policy at /privacy",
    url: "/privacy",
    sections: [
      { id: "header", type: "header", label: "Header", enabled: true, content: { logo_text: "guzzl.pro", nav_links: "Home", cta_text: "", style: "solid" } },
      { id: "policy_content", type: "legal_content", label: "Privacy Policy", enabled: true, content: { title: "Privacy Policy", body: "" } },
    ],
  },
  {
    key: "terms",
    title: "Terms of Service",
    description: "Terms of service at /terms",
    url: "/terms",
    sections: [
      { id: "header", type: "header", label: "Header", enabled: true, content: { logo_text: "guzzl.pro", nav_links: "Home", cta_text: "", style: "solid" } },
      { id: "terms_content", type: "legal_content", label: "Terms of Service", enabled: true, content: { title: "Terms of Service", body: "" } },
    ],
  },
  {
    key: "for/contractors", title: "Contractors Landing Page", description: "Industry page at /for/contractors", url: "/for/contractors",
    sections: [
      { id: "header", type: "header", label: "Header", enabled: true, content: { logo_text: "guzzl.pro", nav_links: "Features,Pricing", cta_text: "Get Started", cta_url: "/auth", style: "transparent" } },
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: { headline: "Get More Renovation Leads and Book Jobs from One Link", subheadline: "Show your projects, capture quote requests, and let customers book consultations." } },
      { id: "problem", type: "problem_solution", label: "Problem / Solution", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "how_it_works", type: "how_it_works", label: "How It Works", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
      { id: "final_cta", type: "final_cta", label: "Final CTA", enabled: true, content: {} },
    ],
  },
  {
    key: "for/barbers", title: "Barbers Landing Page", description: "Industry page at /for/barbers", url: "/for/barbers",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
  {
    key: "for/realtors", title: "Realtors Landing Page", description: "Industry page at /for/realtors", url: "/for/realtors",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
  {
    key: "for/photographers", title: "Photographers Landing Page", description: "Industry page at /for/photographers", url: "/for/photographers",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
  {
    key: "new-hero",
    title: "Hero Variant A — Modern Split",
    description: "A/B test hero at /new-hero",
    url: "/new-hero",
    sections: [
      { id: "hero_modern", type: "hero_modern", label: "Modern Split Hero", enabled: true, content: {
        headline: "Turn Every Conversation Into a Customer",
        subheadline: "The smart digital business card that captures leads, books jobs, sends estimates, and grows your local service business — all from one simple link.",
        description: "No more lost contacts, endless texting, or slow estimates. Share via QR, NFC, text, or social — and watch your leads and bookings grow automatically.",
        cta_primary: "Create My Free Card →",
        cta_primary_url: "/auth",
        cta_secondary: "See Live Demo Card",
        cta_secondary_url: "/demo/mike-reynolds",
        trust_line: "Free to start • No credit card required • Secure • Trusted by 1,000+ professionals",
        mockup_name: "Mike Reynolds",
        mockup_company: "Reynolds Construction LLC",
        mockup_location: "Toronto, ON",
        mockup_rating: "5.0",
        mockup_reviews: "42",
        ab_test_active: "false",
        ab_variant: "A",
      }},
    ],
  },
  {
    key: "for/landscapers", title: "Landscapers Landing Page", description: "Industry page at /for/landscapers", url: "/for/landscapers",
    sections: [
      { id: "hero", type: "hero", label: "Hero", enabled: true, content: {} },
      { id: "features", type: "features", label: "Features", enabled: true, content: {} },
      { id: "pricing", type: "pricing", label: "Pricing", enabled: true, content: {} },
    ],
  },
];

const SECTION_TYPE_LABELS: Record<string, string> = {
  header: "Header / Navigation",
  hero: "Hero Section",
  hero_modern: "Hero — Modern Split (Variant A)",
  problem_solution: "Problem / Solution",
  features: "Features Grid",
  how_it_works: "How It Works",
  demo_cards: "Demo Cards",
  results: "Results & Social Proof",
  pricing: "Pricing Plans",
  final_cta: "Final Call to Action",
  testimonials: "Testimonials",
  legal_content: "Legal Content",
  custom: "Custom Section",
};

const SECTION_ICONS: Record<string, typeof Globe> = {
  header: PanelTop,
  hero: Type,
  hero_modern: Layers,
  problem_solution: MessageSquare,
  features: Layout,
  how_it_works: ChevronRight,
  demo_cards: CreditCard,
  results: Star,
  pricing: CreditCard,
  final_cta: Megaphone,
  testimonials: Star,
  legal_content: Scale,
  custom: FileText,
};

const NEW_SECTION_TYPES = [
  { type: "header", label: "Header / Nav" },
  { type: "hero", label: "Hero" },
  { type: "problem_solution", label: "Problem / Solution" },
  { type: "features", label: "Features" },
  { type: "how_it_works", label: "How It Works" },
  { type: "demo_cards", label: "Demo Cards" },
  { type: "results", label: "Results" },
  { type: "testimonials", label: "Testimonials" },
  { type: "pricing", label: "Pricing" },
  { type: "final_cta", label: "Final CTA" },
  { type: "legal_content", label: "Legal / Policy" },
  { type: "custom", label: "Custom Section" },
];

// ─── Header Editor ───

function HeaderEditor({
  content, onUpdate,
}: {
  content: Record<string, any>;
  onUpdate: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Logo Text</label>
        <Input value={content.logo_text || ""} onChange={(e) => onUpdate("logo_text", e.target.value)} className="text-sm h-9" placeholder="Your Brand" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Logo Image URL</label>
        <Input value={content.logo_url || ""} onChange={(e) => onUpdate("logo_url", e.target.value)} className="text-sm h-9" placeholder="https://..." />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Navigation Links</label>
        <Input value={content.nav_links || ""} onChange={(e) => onUpdate("nav_links", e.target.value)} className="text-sm h-9" placeholder="Home,Features,Pricing,Contact" />
        <p className="text-2xs text-muted-foreground mt-1">Comma-separated link labels</p>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CTA Button Text</label>
        <Input value={content.cta_text || ""} onChange={(e) => onUpdate("cta_text", e.target.value)} className="text-sm h-9" placeholder="Get Started" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CTA Button URL</label>
        <Input value={content.cta_url || ""} onChange={(e) => onUpdate("cta_url", e.target.value)} className="text-sm h-9" placeholder="/auth" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Header Style</label>
        <Select value={content.style || "transparent"} onValueChange={(v) => onUpdate("style", v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="transparent">Transparent</SelectItem>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="glass">Glass / Blur</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Sticky Header</label>
        <Switch checked={content.sticky === "true"} onCheckedChange={(v) => onUpdate("sticky", v ? "true" : "false")} className="scale-75" />
      </div>
    </div>
  );
}

// ─── AI Legal Content Generator ───

function LegalContentEditor({
  content, onUpdate, pageKey,
}: {
  content: Record<string, any>;
  onUpdate: (field: string, value: string) => void;
  pageKey: string;
}) {
  const [generating, setGenerating] = useState(false);

  async function generatePolicy() {
    setGenerating(true);
    try {
      const policyType = content.title?.toLowerCase().includes("privacy") ? "privacy_policy" : "terms_of_service";
      const { data, error } = await supabase.functions.invoke("generate-legal-content", {
        body: { policy_type: policyType, business_name: "guzzl.pro", business_description: "A digital business card and CRM platform for service professionals" },
      });
      if (error) throw error;
      if (data?.content) {
        onUpdate("body", data.content);
        toast.success(`${content.title || "Policy"} generated successfully`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate policy");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
        <Input value={content.title || ""} onChange={(e) => onUpdate("title", e.target.value)} className="text-sm h-9" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Last Updated</label>
        <Input value={content.last_updated || ""} onChange={(e) => onUpdate("last_updated", e.target.value)} className="text-sm h-9" placeholder="March 2026" />
      </div>
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={generatePolicy} disabled={generating}>
        {generating ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
        {generating ? "Generating with AI..." : "Generate with AI"}
      </Button>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content (Markdown)</label>
        <Textarea
          value={content.body || ""}
          onChange={(e) => onUpdate("body", e.target.value)}
          className="text-sm min-h-[300px] font-mono text-xs"
          placeholder="Policy content will appear here..."
        />
      </div>
    </div>
  );
}

// ─── Sortable Section Item ───

function SortableSectionItem({
  section, isActive, onSelect, onToggle, onDuplicate, onDelete,
}: {
  section: LandingPageSection;
  isActive: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const Icon = SECTION_ICONS[section.type] || FileText;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer transition-all border ${
        isActive
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : section.enabled
            ? "bg-card border-transparent hover:bg-muted/50 hover:border-border/50"
            : "bg-card border-transparent opacity-40 hover:opacity-60"
      }`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none shrink-0"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
        isActive ? "bg-primary/15 text-primary" : section.enabled ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/50"
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isActive ? "text-primary" : ""}`}>
          {section.label}
        </p>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button onClick={onDuplicate} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted" title="Duplicate">
          <Copy className="h-2.5 w-2.5" />
        </button>
        <button onClick={onDelete} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete">
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>

      <Switch
        checked={section.enabled}
        onCheckedChange={onToggle}
        className="scale-[0.55] shrink-0"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Section Property Editor ───

function SectionEditor({
  section, onUpdate, onClose, pageKey,
}: {
  section: LandingPageSection;
  onUpdate: (id: string, patch: Partial<LandingPageSection>) => void;
  onClose: () => void;
  pageKey: string;
}) {
  const updateContent = (field: string, value: string) => {
    onUpdate(section.id, { content: { ...section.content, [field]: value } });
  };

  const isHeader = section.type === "header";
  const isLegal = section.type === "legal_content";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 bg-card z-10 flex flex-col"
    >
      {/* Editor header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{section.label}</p>
          <p className="text-2xs text-muted-foreground">{SECTION_TYPE_LABELS[section.type]}</p>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Section Name</label>
          <Input
            value={section.label}
            onChange={(e) => onUpdate(section.id, { label: e.target.value })}
            className="text-sm h-9"
          />
        </div>

        {/* Specialized editors */}
        {isHeader ? (
          <HeaderEditor content={section.content} onUpdate={updateContent} />
        ) : isLegal ? (
          <LegalContentEditor content={section.content} onUpdate={updateContent} pageKey={pageKey} />
        ) : (
          <>
            {Object.keys(section.content).length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center space-y-3">
                <p className="text-xs text-muted-foreground">No custom content yet. Add fields:</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {["headline", "subheadline", "cta_primary", "cta_secondary", "body_text", "image_url"].map((field) => (
                    <Button key={field} variant="outline" size="sm" className="text-2xs h-7 px-2" onClick={() => updateContent(field, "")}>
                      <Plus className="h-2.5 w-2.5 mr-1" /> {field.replace(/_/g, " ")}
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
                  {String(value).length > 60 ? (
                    <Textarea
                      value={String(value)}
                      onChange={(e) => updateContent(field, e.target.value)}
                      className="text-sm min-h-[70px]"
                    />
                  ) : (
                    <Input
                      value={String(value)}
                      onChange={(e) => updateContent(field, e.target.value)}
                      className="text-sm h-9"
                    />
                  )}
                </div>
              ))
            )}

            <Button
              variant="ghost" size="sm" className="text-xs w-full justify-start"
              onClick={() => {
                const name = prompt("Field name (e.g. body_text, badge_label):");
                if (name) updateContent(name.trim(), "");
              }}
            >
              <Plus className="h-3 w-3 mr-1.5" /> Add custom field
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───

interface LandingPageManagerProps {
  adminOnly?: boolean;
}

export default function LandingPageManager({ adminOnly = true }: LandingPageManagerProps) {
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
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (adminOnly) {
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
  }

  const pages = MAIN_PAGE_DEFAULTS.map((def) => {
    const saved = savedPages?.find((p) => p.page_key === def.key);
    return { ...def, saved, is_published: saved?.is_published ?? true, updated_at: saved?.updated_at };
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
    setActiveSection(null);
    setEditingSection(null);
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
        onSuccess: () => toast.success("Page saved"),
        onError: (err: any) => toast.error(err.message || "Failed to save"),
      }
    );
  }

  function toggleSection(sectionId: string) {
    if (!editData) return;
    setEditData({
      ...editData,
      sections: editData.sections.map((s) => s.id === sectionId ? { ...s, enabled: !s.enabled } : s),
    });
  }

  function deleteSection(sectionId: string) {
    if (!editData) return;
    setEditData({ ...editData, sections: editData.sections.filter((s) => s.id !== sectionId) });
    if (activeSection === sectionId) setActiveSection(null);
    if (editingSection === sectionId) setEditingSection(null);
  }

  function duplicateSection(sectionId: string) {
    if (!editData) return;
    const idx = editData.sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const orig = editData.sections[idx];
    const newSection: LandingPageSection = { ...orig, id: `${orig.type}_${Date.now()}`, label: `${orig.label} (Copy)` };
    const newSections = [...editData.sections];
    newSections.splice(idx + 1, 0, newSection);
    setEditData({ ...editData, sections: newSections });
  }

  function addSection(type: string) {
    if (!editData) return;
    const label = SECTION_TYPE_LABELS[type] || "Custom Section";
    const defaultContent: Record<string, any> = type === "header"
      ? { logo_text: "", logo_url: "", nav_links: "", cta_text: "", cta_url: "", sticky: "true", style: "solid" }
      : type === "legal_content"
        ? { title: "", body: "", last_updated: "" }
        : {};
    const newSection: LandingPageSection = { id: `${type}_${Date.now()}`, type, label, enabled: true, content: defaultContent };
    setEditData({ ...editData, sections: [...editData.sections, newSection] });
    setShowAddSection(false);
    setActiveSection(newSection.id);
    setEditingSection(newSection.id);
  }

  function updateSection(sectionId: string, patch: Partial<LandingPageSection>) {
    if (!editData) return;
    setEditData({
      ...editData,
      sections: editData.sections.map((s) =>
        s.id === sectionId ? { ...s, ...patch } : s
      ),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !editData) return;
    const oldIndex = editData.sections.findIndex((s) => s.id === active.id);
    const newIndex = editData.sections.findIndex((s) => s.id === over.id);
    setEditData({ ...editData, sections: arrayMove(editData.sections, oldIndex, newIndex) });
  }

  const currentDef = MAIN_PAGE_DEFAULTS.find((p) => p.key === editData?.page_key);

  // ─── Page List ───
  if (!editingPage || !editData) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Page Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Create and edit pages with the visual drag-and-drop editor.</p>
        </div>
        <div className="space-y-3">
          {pages.map((page, i) => (
            <motion.div
              key={page.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group cursor-pointer"
              onClick={() => startEditing(page.key)}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {page.key === "privacy" || page.key === "terms" ? (
                  <Scale className="h-5 w-5 text-primary" />
                ) : page.key === "main" ? (
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
                  {(page.key === "privacy" || page.key === "terms") && (
                    <Badge variant="outline" className="text-2xs"><Sparkles className="h-2.5 w-2.5 mr-1" />AI Assisted</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{page.description}</p>
                {page.updated_at && (
                  <p className="text-2xs text-muted-foreground mt-1">Last edited: {new Date(page.updated_at).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={page.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                </a>
                <Button variant="outline" size="sm">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Visual Editor ───
  const previewWidths = { desktop: "100%", tablet: "768px", mobile: "375px" };
  const activeSectionData = editData.sections.find((s) => s.id === editingSection);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ─── Top Bar ─── */}
      <div className="h-12 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPage(null); setEditData(null); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <p className="text-sm font-semibold truncate max-w-[200px]">{editData.page_title}</p>
          <Badge variant={editData.is_published ? "default" : "secondary"} className="text-2xs">
            {editData.is_published ? "Live" : "Draft"}
          </Badge>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {([
            { key: "desktop", icon: Monitor },
            { key: "tablet", icon: Tablet },
            { key: "mobile", icon: Smartphone },
          ] as const).map(({ key, icon: DevIcon }) => (
            <button
              key={key}
              onClick={() => setPreviewDevice(key)}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                previewDevice === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DevIcon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-2xs text-muted-foreground">Published</span>
            <Switch checked={editData.is_published} onCheckedChange={(v) => setEditData({ ...editData, is_published: v })} className="scale-75" />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(!showSettings)} title="Page settings">
            <Settings2 className="h-4 w-4" />
          </Button>
          <a href={currentDef?.url || `/${editData.page_key}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <ExternalLink className="h-3 w-3 mr-1" /> Preview
            </Button>
          </a>
          <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Panel: Sections ─── */}
        <div className="w-[280px] border-r border-border bg-card flex flex-col shrink-0 relative overflow-hidden">
          {/* Section list header */}
          <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sections · {editData.sections.filter((s) => s.enabled).length} active
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddSection(!showAddSection)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Add section dropdown */}
          <AnimatePresence>
            {showAddSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="border-b border-border overflow-hidden shrink-0"
              >
                <div className="p-2 space-y-1">
                  <p className="text-2xs text-muted-foreground px-2 py-1">Add a section:</p>
                  {NEW_SECTION_TYPES.map((st) => {
                    const SIcon = SECTION_ICONS[st.type] || FileText;
                    return (
                      <button
                        key={st.type}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/50 transition-colors text-left"
                        onClick={() => addSection(st.type)}
                      >
                        <SIcon className="h-3 w-3 text-muted-foreground" />
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sortable section list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={editData.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {editData.sections.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    isActive={activeSection === section.id}
                    onSelect={() => {
                      setActiveSection(section.id);
                      setEditingSection(section.id);
                    }}
                    onToggle={() => toggleSection(section.id)}
                    onDuplicate={() => duplicateSection(section.id)}
                    onDelete={() => deleteSection(section.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Section editor overlay */}
          <AnimatePresence>
            {editingSection && activeSectionData && (
              <SectionEditor
                key={editingSection}
                section={activeSectionData}
                onUpdate={updateSection}
                onClose={() => setEditingSection(null)}
                pageKey={editData.page_key}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ─── Center: Live Preview ─── */}
        <div className="flex-1 bg-muted/30 flex items-start justify-center p-6 overflow-auto">
          <div
            className="bg-background rounded-xl border border-border shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: previewWidths[previewDevice],
              maxWidth: "100%",
              height: previewDevice === "desktop" ? "calc(100vh - 120px)" : previewDevice === "tablet" ? "700px" : "667px",
            }}
          >
            <iframe
              src={currentDef?.url || `/${editData.page_key}`}
              className="w-full h-full border-0"
              title="Page preview"
            />
          </div>
        </div>

        {/* ─── Right Panel: Settings (conditional) ─── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-card overflow-hidden shrink-0"
            >
              <div className="w-[300px] h-full overflow-y-auto">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold">Page Settings</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSettings(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Page Title</label>
                    <Input
                      value={editData.page_title}
                      onChange={(e) => setEditData({ ...editData, page_title: e.target.value })}
                      className="text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                    <Textarea
                      value={editData.page_description}
                      onChange={(e) => setEditData({ ...editData, page_description: e.target.value })}
                      className="text-sm min-h-[70px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">SEO Title</label>
                    <Input
                      value={editData.settings.seo_title || ""}
                      onChange={(e) => setEditData({ ...editData, settings: { ...editData.settings, seo_title: e.target.value } })}
                      className="text-sm h-9"
                      placeholder="Override page title for search engines"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">SEO Description</label>
                    <Textarea
                      value={editData.settings.seo_description || ""}
                      onChange={(e) => setEditData({ ...editData, settings: { ...editData.settings, seo_description: e.target.value } })}
                      className="text-sm min-h-[60px]"
                      placeholder="Meta description for search engines"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL Path</label>
                    <Input value={currentDef?.url || `/${editData.page_key}`} disabled className="opacity-60 text-sm h-9" />
                    <p className="text-2xs text-muted-foreground mt-1">URL path cannot be changed</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
