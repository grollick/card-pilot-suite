import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search, Crown, Lock, Check, Sparkles, Star, Calendar,
  FileText, Phone, MessageSquare, Image, Eye, ArrowRight,
  LayoutGrid, List, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  CARD_TEMPLATES, TEMPLATE_CATEGORIES, STYLE_PRESETS,
  type CardTemplate, type TemplateCategory,
} from "@/lib/cardTemplates";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useProfileCache } from "@/hooks/useProfileCache";
import { toast } from "sonner";

const STYLE_COLORS: Record<string, string> = {
  Modern: "hsl(var(--primary))",
  Elegant: "#b8860b",
  Bold: "#e63946",
  Minimal: "#6b7280",
};

const FEATURE_ICONS: Record<string, typeof Star> = {
  showBooking: Calendar,
  showQuote: FileText,
  showGallery: Image,
  showTestimonials: Star,
};

const CTA_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  text: MessageSquare,
  book: Calendar,
  quote: FileText,
  email: MessageSquare,
};

export default function TemplateGalleryPage() {
  const navigate = useNavigate();
  const { hasFeature } = usePlanLimits();
  const { profile } = useProfileCache();
  const hasPremium = hasFeature("premium_templates");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<CardTemplate | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return CARD_TEMPLATES.filter(t => {
      if (category !== "all" && t.category !== category) return false;
      if (styleFilter !== "all" && t.style !== styleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.preview.tagline.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [category, styleFilter, search]);

  const freeCount = filtered.filter(t => !t.premium).length;
  const premiumCount = filtered.filter(t => t.premium).length;

  const handleApply = (template: CardTemplate) => {
    if (template.premium && !hasPremium) {
      navigate("/app/pricing");
      return;
    }
    // Navigate to card builder with template param
    navigate(`/app/card?template=${template.id}`);
    toast.success(`"${template.name}" applied to your card`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Template Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Browse professionally designed card templates. Find the perfect layout for your business.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{CARD_TEMPLATES.length} templates</span>
        <span className="text-border">·</span>
        <span className="text-[hsl(var(--success))]">{CARD_TEMPLATES.filter(t => !t.premium).length} free</span>
        <span className="text-border">·</span>
        <span className="text-primary">{CARD_TEMPLATES.filter(t => t.premium).length} premium</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* Category pills */}
          <div className="flex gap-1 flex-wrap">
            <Badge
              variant={category === "all" ? "default" : "outline"}
              className="cursor-pointer text-xs h-7 px-3"
              onClick={() => setCategory("all")}
            >
              All
            </Badge>
            {TEMPLATE_CATEGORIES.filter(c => c.id !== "general").map(c => (
              <Badge
                key={c.id}
                variant={category === c.id ? "default" : "outline"}
                className="cursor-pointer text-xs h-7 px-3"
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </Badge>
            ))}
          </div>

          {/* Style filter */}
          <div className="flex gap-1">
            {["all", "Modern", "Elegant", "Bold", "Minimal"].map(s => (
              <Badge
                key={s}
                variant={styleFilter === s ? "secondary" : "outline"}
                className="cursor-pointer text-[10px] h-6 px-2"
                onClick={() => setStyleFilter(s)}
              >
                {s === "all" ? "Any Style" : s}
              </Badge>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          : "flex flex-col gap-3"
      }>
        <AnimatePresence mode="popLayout">
          {filtered.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={i}
              isLocked={!!template.premium && !hasPremium}
              viewMode={viewMode}
              onPreview={() => setPreviewTemplate(template)}
              onApply={() => handleApply(template)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No templates match your filters.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearch(""); setCategory("all"); setStyleFilter("all"); }}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <TemplatePreviewDialog
          template={previewTemplate}
          isLocked={!!previewTemplate.premium && !hasPremium}
          onClose={() => setPreviewTemplate(null)}
          onApply={() => {
            handleApply(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Template Card ─── */

function TemplateCard({
  template, index, isLocked, viewMode, onPreview, onApply,
}: {
  template: CardTemplate;
  index: number;
  isLocked: boolean;
  viewMode: "grid" | "list";
  onPreview: () => void;
  onApply: () => void;
}) {
  const styleColor = STYLE_COLORS[template.style] || STYLE_COLORS.Modern;

  const features = Object.entries(template.emphasis)
    .filter(([k, v]) => v === true && k !== "heroStyle")
    .map(([k]) => ({
      key: k,
      Icon: FEATURE_ICONS[k],
      label: { showBooking: "Booking", showQuote: "Quotes", showGallery: "Gallery", showTestimonials: "Reviews" }[k] || k,
    }));

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className={`flex items-center gap-4 p-4 ${isLocked ? "opacity-60" : ""}`}>
          {/* Color strip */}
          <div className="w-1.5 h-12 rounded-full shrink-0" style={{ background: styleColor }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{template.name}</h3>
              {template.premium && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-primary/30 text-primary shrink-0">
                  <Crown className="h-2.5 w-2.5" /> PRO
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onPreview} className="h-8 text-xs gap-1">
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <Button size="sm" onClick={onApply} className="h-8 text-xs gap-1" disabled={isLocked}>
              {isLocked ? <><Lock className="h-3 w-3" /> Locked</> : <><ArrowRight className="h-3 w-3" /> Apply</>}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={`overflow-hidden group transition-all hover:shadow-md ${isLocked ? "opacity-70" : ""}`}>
        {/* Visual preview area */}
        <div
          className="relative h-36 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${styleColor}18, ${styleColor}05)` }}
        >
          {/* Mini card mockup */}
          <div className="absolute inset-4 rounded-lg bg-card/80 backdrop-blur border border-border/50 shadow-sm p-3 flex flex-col justify-between">
            <div>
              <div className="h-2.5 w-16 rounded bg-foreground/15 mb-1.5" />
              <div className="h-1.5 w-24 rounded bg-foreground/10 mb-3" />
              <div className="flex gap-1">
                {template.ctaPriority.slice(0, 3).map(cta => {
                  const Icon = CTA_ICONS[cta];
                  return (
                    <div
                      key={cta}
                      className="h-5 px-2 rounded flex items-center gap-1 text-[7px] font-medium"
                      style={{ background: `${styleColor}15`, color: styleColor }}
                    >
                      {Icon && <Icon className="h-2 w-2" />}
                      {cta}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-1">
              {features.map(f => (
                <div key={f.key} className="h-3 px-1.5 rounded-sm bg-muted text-[6px] text-muted-foreground flex items-center gap-0.5">
                  {f.Icon && <f.Icon className="h-1.5 w-1.5" />}
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-2 right-2 flex gap-1">
            {template.premium && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                <Crown className="h-2.5 w-2.5" /> PRO
              </span>
            )}
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium"
              style={{ background: `${styleColor}20`, color: styleColor }}
            >
              {template.style}
            </span>
          </div>

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-center justify-center">
              <Lock className="h-5 w-5 text-muted-foreground/60" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
            <Button size="sm" variant="secondary" onClick={onPreview} className="h-7 text-[10px] gap-1 shadow-sm">
              <Eye className="h-3 w-3" /> Preview
            </Button>
            {!isLocked && (
              <Button size="sm" onClick={onApply} className="h-7 text-[10px] gap-1 shadow-sm">
                <ArrowRight className="h-3 w-3" /> Apply
              </Button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-1.5">
          <h3 className="text-sm font-semibold truncate">{template.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {template.description}
          </p>
          <p className="text-[10px] italic text-muted-foreground/60">
            "{template.preview.tagline}"
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ─── Preview Dialog ─── */

function TemplatePreviewDialog({
  template, isLocked, onClose, onApply,
}: {
  template: CardTemplate;
  isLocked: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  const styleColor = STYLE_COLORS[template.style] || STYLE_COLORS.Modern;

  const features = Object.entries(template.emphasis)
    .filter(([k, v]) => v === true && k !== "heroStyle")
    .map(([k]) => ({
      key: k,
      label: { showBooking: "Booking", showQuote: "Quote Request", showGallery: "Photo Gallery", showTestimonials: "Client Reviews" }[k] || k,
    }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
            {template.premium && (
              <Badge variant="outline" className="text-[10px] gap-0.5 border-primary/30 text-primary">
                <Crown className="h-3 w-3" /> Premium
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visual preview */}
          <div
            className="rounded-xl p-6 space-y-4"
            style={{ background: `linear-gradient(135deg, ${styleColor}12, ${styleColor}04)` }}
          >
            <div className="bg-card rounded-lg border p-4 shadow-sm space-y-3">
              <div className="text-center space-y-1">
                <div className="h-12 w-12 rounded-full bg-muted mx-auto" />
                <h4 className="text-sm font-semibold">Your Name</h4>
                <p className="text-xs text-muted-foreground">{template.preview.tagline}</p>
              </div>
              <div className="flex justify-center gap-2">
                {template.ctaPriority.slice(0, 3).map(cta => {
                  const Icon = CTA_ICONS[cta];
                  return (
                    <div
                      key={cta}
                      className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium"
                      style={{ background: `${styleColor}15`, color: styleColor }}
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      <span className="capitalize">{cta}</span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Services</p>
                {template.preview.sampleServices.map(s => (
                  <div key={s} className="text-xs bg-muted rounded-md px-3 py-1.5">{s}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{template.description}</p>

            <div>
              <p className="text-xs font-semibold mb-1.5">Included sections</p>
              <div className="flex flex-wrap gap-1.5">
                {template.sections.filter(s => s.enabled).map(s => (
                  <Badge key={s.id} variant="secondary" className="text-[10px] capitalize">
                    {s.id.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>

            {features.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5">Key features</p>
                <div className="flex flex-wrap gap-1.5">
                  {features.map(f => (
                    <Badge key={f.key} variant="outline" className="text-[10px]">
                      <Check className="h-2.5 w-2.5 mr-0.5 text-[hsl(var(--success))]" />
                      {f.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {template.preview.sampleReview && (
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs italic text-muted-foreground">
                  ★★★★★ "{template.preview.sampleReview}"
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isLocked ? (
              <Button className="flex-1 gap-1.5" onClick={onApply}>
                <Crown className="h-3.5 w-3.5" /> Upgrade to Unlock
              </Button>
            ) : (
              <Button className="flex-1 gap-1.5" onClick={onApply}>
                <ArrowRight className="h-3.5 w-3.5" /> Apply Template
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
