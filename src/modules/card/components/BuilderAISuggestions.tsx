import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, X, ChevronRight, Star, Image, CalendarCheck,
  MessageSquare, Palette, Type, Eye, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BuilderAISuggestionsProps {
  sections: Array<{ id: string; enabled: boolean; content?: any }>;
  cardStatus?: string;
  sectionCount?: number;
}

interface Suggestion {
  id: string;
  icon: typeof Star;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  applicable: boolean;
}

export default function BuilderAISuggestions({ sections, cardStatus, sectionCount }: BuilderAISuggestionsProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const hasSection = (id: string) => sections.some((s) => s.id === id && s.enabled);

  const suggestions: Suggestion[] = [
    {
      id: "testimonials",
      icon: Star,
      title: "Add testimonials",
      description: "Cards with reviews convert 3× more visitors into leads.",
      priority: "high",
      applicable: !hasSection("testimonials"),
    },
    {
      id: "gallery",
      icon: Image,
      title: "Add work photos",
      description: "Visual proof of your work increases trust by 40%.",
      priority: "high",
      applicable: !hasSection("gallery"),
    },
    {
      id: "booking",
      icon: CalendarCheck,
      title: "Enable online booking",
      description: "Let visitors schedule directly — reduces drop-off.",
      priority: "high",
      applicable: !hasSection("booking"),
    },
    {
      id: "lead_form",
      icon: MessageSquare,
      title: "Add a contact form",
      description: "Capture visitor info even when you're unavailable.",
      priority: "medium",
      applicable: !hasSection("lead_form"),
    },
    {
      id: "theme",
      icon: Palette,
      title: "Customize your colors",
      description: "Brand-matched cards look more professional.",
      priority: "low",
      applicable: true,
    },
    {
      id: "bio",
      icon: Type,
      title: "Write a compelling bio",
      description: "A strong bio helps visitors trust you instantly.",
      priority: "medium",
      applicable: !hasSection("bio") && (sectionCount ?? 0) < 4,
    },
    {
      id: "publish",
      icon: Eye,
      title: "Publish your card",
      description: "Your card is still in draft — go live to start getting leads.",
      priority: "high",
      applicable: cardStatus === "draft",
    },
  ];

  const activeSuggestions = suggestions
    .filter((s) => s.applicable && !dismissed.has(s.id))
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 4);

  if (activeSuggestions.length === 0) return null;

  const priorityStyles = {
    high: "border-l-warning/70 bg-warning/5",
    medium: "border-l-primary/50 bg-primary/5",
    low: "border-l-muted-foreground/30 bg-muted/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        <span className="text-xs font-semibold flex-1 text-left">AI Suggestions</span>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {activeSuggestions.length}
        </span>
        <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${collapsed ? "" : "rotate-90"}`} />
      </button>

      {/* Suggestions List */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5">
              {activeSuggestions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border-l-[3px] transition-colors group ${priorityStyles[s.priority]}`}
                >
                  <s.icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                    s.priority === "high" ? "text-warning" :
                    s.priority === "medium" ? "text-primary" :
                    "text-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{s.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => setDismissed((prev) => new Set(prev).add(s.id))}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </motion.div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                onClick={() => navigate("/app/assistant")}
              >
                <Zap className="h-3 w-3" />
                Get personalized tips from AI Coach
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
