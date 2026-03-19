import { useState } from "react";
import { RefreshCw, Loader2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  originalContent: string;
  tone: string;
  onSelect: (content: string) => void;
}

interface Variation {
  tone: string;
  caption: string;
  label: string;
}

const TONE_LABELS: Record<string, { label: string; color: string }> = {
  professional: { label: "Professional", color: "bg-blue-500/10 text-blue-600" },
  casual: { label: "Casual", color: "bg-green-500/10 text-green-600" },
  bold: { label: "Bold", color: "bg-red-500/10 text-red-600" },
  humorous: { label: "Fun", color: "bg-amber-500/10 text-amber-600" },
  inspirational: { label: "Inspiring", color: "bg-purple-500/10 text-purple-600" },
};

export default function ContentSpinner({ originalContent, tone, onSelect }: Props) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);

  const spin = async () => {
    if (!originalContent.trim()) {
      toast.error("Write some content first");
      return;
    }
    setLoading(true);
    setVariations([]);

    try {
      const { data, error } = await supabase.functions.invoke("spin-content", {
        body: { content: originalContent, tone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setVariations(data.variations ?? []);
      if (!data.variations?.length) toast.info("No variations generated.");
    } catch (err: any) {
      console.error("Spin error:", err);
      toast.error(err.message || "Failed to generate variations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        className="w-full h-9 text-xs gap-1.5"
        onClick={spin}
        disabled={loading || !originalContent.trim()}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {loading ? "Spinning..." : variations.length ? "Spin Again" : "Generate Variations"}
      </Button>

      {loading && (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-xs">Creating caption variations…</span>
        </div>
      )}

      {variations.map((v, idx) => {
        const toneInfo = TONE_LABELS[v.tone] ?? { label: v.label || v.tone, color: "bg-muted text-muted-foreground" };
        return (
          <Card key={idx} className="border hover:border-primary/30 transition-all cursor-pointer" onClick={() => onSelect(v.caption)}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className={cn("text-[10px]", toneInfo.color)}>
                  {toneInfo.label}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed">{v.caption}</p>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] w-full gap-1" onClick={(e) => { e.stopPropagation(); onSelect(v.caption); }}>
                <Check className="h-3 w-3" /> Use This
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
