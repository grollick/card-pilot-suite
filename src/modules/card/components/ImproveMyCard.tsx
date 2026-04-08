import { useState, useMemo } from "react";
import {
  Sparkles, Loader2, Check, ChevronDown, ChevronUp,
  AlertTriangle, Zap, Image, FileText, Phone, Calendar,
  MessageSquare, TrendingUp, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAICardOptimizer } from "@/hooks/useAICopilot";
import { useQueryClient } from "@tanstack/react-query";
import type { CardSection } from "@/hooks/useCard";

/* ── Types ── */
interface LocalIssue {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  icon: typeof AlertTriangle;
  action?: {
    label: string;
    sectionId?: string;
    enableSection?: boolean;
    contentPatch?: Record<string, any>;
  };
}

interface Props {
  sections: CardSection[];
  profile: any;
  avatarUrl: string | null;
  coverUrl: string | null;
  onToggleSection: (id: string) => void;
  onSectionContentSave: (id: string, content: any) => void;
  onScrollToSection?: (id: string) => void;
}

/* ── Priority styling ── */
const priorityConfig = {
  high: { dot: "bg-destructive", border: "border-destructive/20 bg-destructive/5", badge: "bg-destructive/10 text-destructive" },
  medium: { dot: "bg-warning", border: "border-warning/20 bg-warning/5", badge: "bg-warning/10 text-warning" },
  low: { dot: "bg-primary", border: "border-primary/20 bg-primary/5", badge: "bg-primary/10 text-primary" },
};

/* ── Client-side analysis ── */
function analyzeCard(sections: CardSection[], profile: any, avatarUrl: string | null, coverUrl: string | null): LocalIssue[] {
  const issues: LocalIssue[] = [];

  // Missing avatar
  if (!avatarUrl && !profile?.avatar_url) {
    issues.push({
      id: "no-avatar",
      title: "Add a profile photo",
      description: "Cards with photos get 3x more engagement. Upload a professional headshot.",
      priority: "high",
      icon: Image,
    });
  }

  // Missing cover
  if (!coverUrl) {
    issues.push({
      id: "no-cover",
      title: "Add a cover image",
      description: "A backdrop image makes your card stand out and feel premium.",
      priority: "medium",
      icon: Image,
    });
  }

  // About section
  const about = sections.find(s => s.id === "about");
  if (!about?.enabled) {
    issues.push({
      id: "about-disabled",
      title: "Enable your About section",
      description: "Tell visitors who you are and what you do. This builds instant trust.",
      priority: "high",
      icon: FileText,
      action: { label: "Enable", sectionId: "about", enableSection: true },
    });
  } else if (!about.content?.text || (about.content.text as string).length < 30) {
    issues.push({
      id: "about-weak",
      title: "Strengthen your About text",
      description: "Your description is too short. Aim for 2–3 sentences that highlight your expertise.",
      priority: "high",
      icon: FileText,
      action: { label: "Edit", sectionId: "about" },
    });
  }

  // Services section
  const services = sections.find(s => s.id === "services");
  if (!services?.enabled) {
    issues.push({
      id: "services-disabled",
      title: "Add your services",
      description: "Listing services helps visitors understand what you offer at a glance.",
      priority: "high",
      icon: Zap,
      action: { label: "Enable", sectionId: "services", enableSection: true },
    });
  } else {
    const items = services.content?.items as any[] | undefined;
    if (!items || items.length < 2) {
      issues.push({
        id: "services-few",
        title: "Add more services",
        description: "Cards with 3+ services convert better. Add your key offerings.",
        priority: "medium",
        icon: Zap,
        action: { label: "Edit", sectionId: "services" },
      });
    }
  }

  // Contact section
  const contact = sections.find(s => s.id === "contact");
  if (!contact?.enabled) {
    issues.push({
      id: "contact-disabled",
      title: "Enable contact info",
      description: "Make it easy for people to reach you. Add phone, email, or a contact form.",
      priority: "high",
      icon: Phone,
      action: { label: "Enable", sectionId: "contact", enableSection: true },
    });
  }

  // Booking section
  const booking = sections.find(s => s.id === "booking");
  if (!booking?.enabled) {
    issues.push({
      id: "booking-disabled",
      title: "Enable online booking",
      description: "Let customers book directly from your card. Reduces back-and-forth by 80%.",
      priority: "medium",
      icon: Calendar,
      action: { label: "Enable", sectionId: "booking", enableSection: true },
    });
  }

  // Testimonials
  const testimonials = sections.find(s => s.id === "testimonials");
  if (!testimonials?.enabled) {
    issues.push({
      id: "testimonials-disabled",
      title: "Add testimonials",
      description: "Social proof increases conversions. Even 1–2 reviews make a difference.",
      priority: "low",
      icon: MessageSquare,
      action: { label: "Enable", sectionId: "testimonials", enableSection: true },
    });
  }

  // Hero tagline
  const hero = sections.find(s => s.id === "hero");
  if (hero?.enabled && (!hero.content?.tagline || (hero.content.tagline as string).length < 5)) {
    issues.push({
      id: "hero-tagline",
      title: "Add a strong tagline",
      description: "A compelling tagline instantly tells visitors what makes you different.",
      priority: "medium",
      icon: TrendingUp,
      action: { label: "Edit", sectionId: "hero" },
    });
  }

  return issues;
}

/* ── Component ── */
export default function ImproveMyCard({
  sections, profile, avatarUrl, coverUrl,
  onToggleSection, onSectionContentSave, onScrollToSection,
}: Props) {
  const { data: aiData, isLoading: aiLoading, isFetching } = useAICardOptimizer();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const localIssues = useMemo(
    () => analyzeCard(sections, profile, avatarUrl, coverUrl),
    [sections, profile, avatarUrl, coverUrl],
  );

  // Merge local + AI suggestions, deduplicate
  const allSuggestions = useMemo(() => {
    const items: (LocalIssue & { source: "local" | "ai" })[] = localIssues.map(i => ({ ...i, source: "local" as const }));

    if (aiData?.suggestions) {
      for (const s of aiData.suggestions) {
        // Skip if local already covers it
        const sectionId = s.section?.toLowerCase();
        if (localIssues.some(l => l.action?.sectionId === sectionId)) continue;
        items.push({
          id: `ai-${s.title.slice(0, 20)}`,
          title: s.title,
          description: s.description,
          priority: s.priority as "high" | "medium" | "low",
          icon: TrendingUp,
          source: "ai",
          action: sectionId ? { label: "View", sectionId } : undefined,
        });
      }
    }

    // Sort: high > medium > low, unapplied first
    const order = { high: 0, medium: 1, low: 2 };
    return items
      .filter(i => !appliedIds.has(i.id))
      .sort((a, b) => order[a.priority] - order[b.priority]);
  }, [localIssues, aiData, appliedIds]);

  // Score: 100 - (issues * weight)
  const score = useMemo(() => {
    const weights = { high: 15, medium: 8, low: 4 };
    const penalty = allSuggestions.reduce((sum, s) => sum + weights[s.priority], 0);
    return Math.max(0, Math.min(100, aiData?.overall_score ?? Math.max(20, 100 - penalty)));
  }, [allSuggestions, aiData]);

  const handleApply = (item: LocalIssue & { source: string }) => {
    if (item.action?.enableSection && item.action.sectionId) {
      onToggleSection(item.action.sectionId);
    }
    if (item.action?.contentPatch && item.action.sectionId) {
      onSectionContentSave(item.action.sectionId, item.action.contentPatch);
    }
    if (item.action?.sectionId) {
      onScrollToSection?.(item.action.sectionId);
    }
    setAppliedIds(prev => new Set([...prev, item.id]));
  };

  const highCount = allSuggestions.filter(s => s.priority === "high").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-accent/20 transition-colors"
      >
        <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold">Improve My Card</h3>
            {highCount > 0 && (
              <span className="text-[9px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                {highCount} critical
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {allSuggestions.length === 0 ? "Your card looks great!" : `${allSuggestions.length} improvement${allSuggestions.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          disabled={isFetching}
          onClick={(e) => {
            e.stopPropagation();
            queryClient.invalidateQueries({ queryKey: ["ai-card-optimizer"] });
          }}
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2.5">
              {/* Score bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Card Score</span>
                  <span className={`text-[11px] font-bold ${score >= 80 ? "text-green-600" : score >= 50 ? "text-warning" : "text-destructive"}`}>
                    {score}/100
                  </span>
                </div>
                <Progress
                  value={score}
                  className={`h-1.5 ${score >= 80 ? "[&>div]:bg-green-500" : score >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"}`}
                />
              </div>

              {/* Loading state */}
              {aiLoading && (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-[10px] text-muted-foreground">Analyzing your card…</span>
                </div>
              )}

              {/* Suggestion list */}
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-thin">
                {allSuggestions.map((item, i) => {
                  const Icon = item.icon;
                  const cfg = priorityConfig[item.priority];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-lg border p-2 ${cfg.border}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${cfg.badge}`}>
                          <Icon className="h-2.5 w-2.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium leading-tight">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                          {item.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-[10px] px-2 gap-1 mt-1 text-primary hover:text-primary hover:bg-primary/10 rounded-md"
                              onClick={() => handleApply(item)}
                            >
                              {item.action.enableSection ? (
                                <>
                                  <Check className="h-2.5 w-2.5" /> {item.action.label}
                                </>
                              ) : (
                                <>
                                  <Zap className="h-2.5 w-2.5" /> {item.action.label}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        {item.source === "ai" && (
                          <span className="text-[8px] font-medium text-primary/50 bg-primary/5 px-1 py-0.5 rounded shrink-0">AI</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {allSuggestions.length === 0 && !aiLoading && (
                <div className="text-center py-3">
                  <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-[11px] font-medium text-green-600">Your card is optimized!</p>
                  <p className="text-[10px] text-muted-foreground">Great job — keep it updated.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
