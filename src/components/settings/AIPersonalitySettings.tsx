import { useState, useEffect } from "react";
import { Bot, MessageSquare, Lightbulb, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const AI_STYLES = [
  { id: "copilot", label: "Co-Pilot", icon: Bot, desc: "Inline suggestions embedded in your workflow" },
  { id: "chatgpt", label: "Chat Assistant", icon: MessageSquare, desc: "Full conversational AI with detailed responses" },
  { id: "coach", label: "Business Coach", icon: Lightbulb, desc: "Proactive tips, strategies, and daily action plans" },
  { id: "minimal", label: "Minimal", icon: Zap, desc: "Short, direct answers — only when asked" },
];

export default function AIPersonalitySettings({ profile }: { profile: any }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState("copilot");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.ai_personality) setSelected(profile.ai_personality);
  }, [profile]);

  const handleSelect = async (id: string) => {
    setSelected(id);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ai_personality: id } as any)
        .eq("id", profile.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`AI style set to ${AI_STYLES.find(s => s.id === id)?.label}`);
    } catch {
      toast.error("Failed to update AI style");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">AI Personality</h3>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground">Choose how AI communicates with you across the platform.</p>

      <div className="grid grid-cols-2 gap-2">
        {AI_STYLES.map((style) => {
          const Icon = style.icon;
          const active = selected === style.id;
          return (
            <button
              key={style.id}
              onClick={() => handleSelect(style.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                active
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">{style.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{style.desc}</p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
