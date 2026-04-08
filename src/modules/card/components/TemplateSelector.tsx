import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Calendar, FileText, Phone, Image, MessageSquare, Sparkles, Crown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CARD_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getRecommendedTemplates,
  getBestTemplateForProfession,
  type CardTemplate,
  type TemplateCategory,
} from "@/lib/cardTemplates";
import { usePlanLimits } from "@/hooks/usePlanLimits";

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
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [lockedName, setLockedName] = useState("");
  const { hasFeature } = usePlanLimits();
  const hasPremium = hasFeature("premium_templates");

  const bestTemplateId = useMemo(
    () => getBestTemplateForProfession(professionName),
    [professionName]
  );

  const templates = useMemo(() => {
    const sorted = getRecommendedTemplates(professionCategoryKey);
    if (activeCategory === "general") return sorted;
    return sorted.filter(t => t.category === activeCategory);
  }, [professionCategoryKey, activeCategory]);

  const handleSelect = (template: CardTemplate) => {
    if (template.premium && !hasPremium) {
      setLockedName(template.name);
      setShowUpgrade(true);
      return;
    }
    onSelect(template.id);
  };

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
              isLocked={!!template.premium && !hasPremium}
              onSelect={() => handleSelect(template)}
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

      {/* Inline upgrade prompt */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Unlock {lockedName}</h4>
                  <p className="text-[10px] text-muted-foreground">Premium templates convert 2x better</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {["Professionally designed layouts", "Advanced sections & animations", "Higher conversion rates"].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[11px] text-foreground/80">{t}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-[11px] gap-1.5"
                  onClick={() => window.location.href = "/app/pricing"}
                >
                  <Crown className="h-3 w-3" /> Upgrade to Pro
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] text-muted-foreground"
                  onClick={() => setShowUpgrade(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  isRecommended,
  isLocked,
  onSelect,
  index,
  compact,
}: {
  template: CardTemplate;
  isSelected: boolean;
  isRecommended: boolean;
  isLocked: boolean;
  onSelect: () => void;
  index: number;
  compact: boolean;
}) {
  const styleColor = STYLE_COLORS[template.style] || STYLE_COLORS.Modern;

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
          : isLocked
          ? "border-border/30 bg-muted/10 hover:border-border/50"
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
        {isLocked && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 h-4 border-primary/30 text-primary">
            <Crown className="h-2.5 w-2.5" /> PRO
          </Badge>
        )}
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 h-4"
          style={{ borderColor: `${styleColor}40`, color: isLocked ? undefined : styleColor }}
        >
          {template.style}
        </Badge>
      </div>

      {/* Template preview strip */}
      <div className={`flex gap-1 mb-2.5 ${isLocked ? "opacity-50" : ""}`}>
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
      <h4 className={`text-sm font-semibold mb-0.5 ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
        {template.name}
      </h4>
      {!compact && (
        <p className={`text-xs leading-relaxed mb-2.5 ${isLocked ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
          {template.description}
        </p>
      )}

      {/* Feature pills */}
      {!compact && features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {features.map(({ key, Icon, label }) => (
            <span
              key={key}
              className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md ${isLocked ? "bg-muted/30 text-muted-foreground/40" : "bg-muted text-muted-foreground"}`}
            >
              {Icon && <Icon className="h-2.5 w-2.5" />}
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Preview quote */}
      {!compact && template.preview.tagline && (
        <p className={`text-[10px] italic mt-2 border-t border-border/40 pt-2 ${isLocked ? "text-muted-foreground/30" : "text-muted-foreground/70"}`}>
          "{template.preview.tagline}"
        </p>
      )}

      {/* Lock / selection indicator */}
      {isLocked ? (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-muted/60 flex items-center justify-center">
          <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
        </div>
      ) : isSelected ? (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      ) : null}
    </motion.button>
  );
}
