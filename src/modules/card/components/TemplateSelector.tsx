import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Calendar, FileText, Phone, Image, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CARD_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getRecommendedTemplates,
  getBestTemplateForProfession,
  type CardTemplate,
  type TemplateCategory,
} from "@/lib/cardTemplates";

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
  professionName?: string;
  professionCategoryKey?: string;
  compact?: boolean;
}

const EMPHASIS_ICONS: Record<string, typeof Star> = {
  showBooking: Calendar,
  showQuote: FileText,
  showGallery: Image,
  showTestimonials: Star,
};

const STYLE_COLORS: Record<string, string> = {
  Modern: "hsl(var(--primary))",
  Elegant: "#b8860b",
  Bold: "#e63946",
  Minimal: "#6b7280",
};

export default function TemplateSelector({
  selectedTemplateId,
  onSelect,
  professionName,
  professionCategoryKey,
  compact = false,
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("general");
  const bestTemplateId = useMemo(
    () => getBestTemplateForProfession(professionName),
    [professionName]
  );

  const templates = useMemo(() => {
    const sorted = getRecommendedTemplates(professionCategoryKey);
    if (activeCategory === "general") return sorted;
    return sorted.filter(t => t.category === activeCategory);
  }, [professionCategoryKey, activeCategory]);

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        <AnimatePresence mode="popLayout">
          {templates.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              isRecommended={template.id === bestTemplateId}
              onSelect={() => onSelect(template.id)}
              index={i}
              compact={compact}
            />
          ))}
        </AnimatePresence>
      </div>

      {templates.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No templates in this category yet.
        </p>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  isRecommended,
  onSelect,
  index,
  compact,
}: {
  template: CardTemplate;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  index: number;
  compact: boolean;
}) {
  const styleColor = STYLE_COLORS[template.style] || STYLE_COLORS.Modern;

  // Build feature pills from emphasis
  const features = Object.entries(template.emphasis)
    .filter(([key, val]) => val === true && key !== "heroStyle")
    .map(([key]) => {
      const Icon = EMPHASIS_ICONS[key];
      const labels: Record<string, string> = {
        showBooking: "Booking",
        showQuote: "Quotes",
        showGallery: "Gallery",
        showTestimonials: "Reviews",
      };
      return { key, Icon, label: labels[key] || key };
    });

  // CTA preview
  const ctaIcons: Record<string, typeof Phone> = {
    call: Phone,
    text: MessageSquare,
    book: Calendar,
    quote: FileText,
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      onClick={onSelect}
      className={`relative text-left rounded-xl border p-4 transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
          : "border-border hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      {/* Badges */}
      <div className="flex items-center gap-1.5 mb-2">
        {isRecommended && (
          <Badge variant="default" className="text-[9px] px-1.5 py-0 gap-0.5 h-4">
            <Sparkles className="h-2.5 w-2.5" /> Best fit
          </Badge>
        )}
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 h-4"
          style={{ borderColor: `${styleColor}40`, color: styleColor }}
        >
          {template.style}
        </Badge>
      </div>

      {/* Template preview strip */}
      <div className="flex gap-1 mb-2.5">
        <div
          className="h-8 flex-1 rounded-md"
          style={{
            background: `linear-gradient(135deg, ${styleColor}20, ${styleColor}08)`,
            border: `1px solid ${styleColor}15`,
          }}
        />
        <div className="flex flex-col gap-0.5 w-8">
          {template.ctaPriority.slice(0, 3).map(cta => {
            const Icon = ctaIcons[cta];
            return (
              <div
                key={cta}
                className="h-2.5 rounded-sm flex items-center justify-center"
                style={{ background: `${styleColor}15` }}
              >
                {Icon && <Icon className="h-1.5 w-1.5" style={{ color: styleColor }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <h4 className="text-sm font-semibold text-foreground mb-0.5">{template.name}</h4>
      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
          {template.description}
        </p>
      )}

      {/* Feature pills */}
      {!compact && features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {features.map(({ key, Icon, label }) => (
            <span
              key={key}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
            >
              {Icon && <Icon className="h-2.5 w-2.5" />}
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Preview quote */}
      {!compact && template.preview.tagline && (
        <p className="text-[10px] italic text-muted-foreground/70 mt-2 border-t border-border/40 pt-2">
          "{template.preview.tagline}"
        </p>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </motion.button>
  );
}
