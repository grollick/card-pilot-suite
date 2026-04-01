import { useState } from "react";
import { Sparkles, Loader2, Check, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostIdea {
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_query: string;
  image_description: string;
  image_url: string;
  style: "showcase" | "educational" | "promotional" | "personal";
}

interface Props {
  platforms: string[];
  onSelectPost: (data: { content: string; hashtags: string[]; imageUrl: string }) => void;
}

const STYLE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  showcase: { label: "Showcase", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: "📸" },
  educational: { label: "Tips & How-to", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: "💡" },
  promotional: { label: "Promo", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: "🎯" },
  personal: { label: "Behind the Scenes", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: "🎬" },
};

export default function AIPostGenerator({ platforms, onSelectPost }: Props) {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  const generate = async () => {
    setLoading(true);
    setIdeas([]);
    setSelectedIdx(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-ideas", {
        body: { platforms, topic: topic.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setIdeas(data.posts ?? []);
      if (!data.posts?.length) toast.info("No ideas generated. Try a different topic.");
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Failed to generate post ideas");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePost = (idx: number) => {
    const idea = ideas[idx];
    const hashtagStr = idea.hashtags.map(h => `#${h}`).join(" ");
    const fullContent = `${idea.caption}\n\n${idea.cta}\n\n${hashtagStr}`;
    onSelectPost({
      content: fullContent,
      hashtags: idea.hashtags,
      imageUrl: idea.image_url,
    });
    toast.success("Post added! You can edit it before saving.");
  };

  const shuffleImage = async (idx: number) => {
    const idea = ideas[idx];
    if (!idea) return;
    setRegeneratingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-post-image", {
        body: {
          image_description: idea.image_description || idea.image_query || idea.title,
          image_query: idea.image_query,
          post_style: idea.style,
          post_title: idea.title,
        },
      });
      if (error || !data?.image_url) throw new Error(data?.error || "No image returned");
      setIdeas(prev => prev.map((currentIdea, i) =>
        i === idx ? { ...currentIdea, image_url: data.image_url } : currentIdea
      ));
      toast.success("New AI image generated!");
    } catch (err: any) {
      toast.error(err.message || "Couldn't generate a new image");
    } finally {
      setRegeneratingIdx(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (optional) e.g. 'spring specials', 'new project'"
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
          />
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 shadow-glow"
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : ideas.length > 0 ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {loading ? "Generating..." : ideas.length > 0 ? "Regenerate" : "Generate Ideas"}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">AI is crafting trade-specific posts for you…</span>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ideas.map((idea, idx) => {
            const style = STYLE_CONFIG[idea.style] ?? STYLE_CONFIG.showcase;
            const isSelected = selectedIdx === idx;
            return (
              <Card
                key={idx}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-primary/30"
                )}
                onClick={() => setSelectedIdx(idx)}
              >
                <CardContent className="p-3 space-y-2">
                  {/* Image preview */}
                  <div className="relative rounded-md overflow-hidden bg-muted aspect-video group/img">
                    <img
                      src={idea.image_url}
                      alt={idea.image_description}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial,sans-serif' font-size='36'%3EImage unavailable%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <Badge className={cn("absolute top-1.5 left-1.5 text-[10px] border", style.color)}>
                      {style.icon} {style.label}
                    </Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); shuffleImage(idx); }}
                      disabled={regeneratingIdx === idx}
                      className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold shadow-[0_0_8px_hsl(var(--primary)/0.5),0_0_20px_hsl(var(--primary)/0.3)] transition-all hover:shadow-[0_0_12px_hsl(var(--primary)/0.7),0_0_30px_hsl(var(--primary)/0.4)] hover:scale-105 active:scale-95 disabled:opacity-80 animate-in fade-in animate-pulse"
                      title="Generate a new AI image for this post"
                    >
                      {regeneratingIdx === idx ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5" /> AI Image</>
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="font-semibold text-xs leading-tight">{idea.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {idea.caption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1">
                    {idea.hashtags.map((h) => (
                      <span key={h} className="text-[9px] text-primary/80">
                        #{h}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <p className="text-[10px] text-muted-foreground italic">CTA: {idea.cta}</p>

                  {/* Use button */}
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs gap-1"
                    variant={isSelected ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUsePost(idx);
                    }}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    Use This Post
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && ideas.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">
            Hit <strong>Generate Ideas</strong> to get AI-crafted posts tailored to your trade
          </p>
          <p className="text-[10px] mt-1 opacity-70">
            Add an optional topic for more targeted results
          </p>
        </div>
      )}
    </div>
  );
}
