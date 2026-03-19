import { useState } from "react";
import { Sparkles, TrendingUp, Loader2, Search, Lightbulb, Flame, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedItem {
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_url: string;
  image_query: string;
  category: "trending" | "industry" | "ready_to_use" | "seasonal";
}

interface Props {
  onUsePost: (data: { content: string; hashtags: string[] }) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Flame; color: string }> = {
  trending: { label: "Trending", icon: Flame, color: "bg-orange-500/10 text-orange-600" },
  industry: { label: "Industry", icon: Target, color: "bg-blue-500/10 text-blue-600" },
  ready_to_use: { label: "Ready to Use", icon: Sparkles, color: "bg-emerald-500/10 text-emerald-600" },
  seasonal: { label: "Seasonal", icon: Lightbulb, color: "bg-purple-500/10 text-purple-600" },
};

export default function ContentFeedTab({ onUsePost }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const loadFeed = async () => {
    setLoading(true);
    setItems([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-feed", {
        body: { search: search.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setItems(data.items ?? []);
      if (!data.items?.length) toast.info("No content found. Try a different search.");
    } catch (err: any) {
      console.error("Content feed error:", err);
      toast.error(err.message || "Failed to load content feed");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeCategory === "all" ? items : items.filter(i => i.category === activeCategory);

  const handleUse = (item: FeedItem) => {
    const hashtagStr = item.hashtags.map(h => `#${h}`).join(" ");
    const fullContent = `${item.caption}\n\n${item.cta}\n\n${hashtagStr}`;
    onUsePost({ content: fullContent, hashtags: item.hashtags });
    toast.success("Post added to Create view!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Content Discovery</h3>
          <p className="text-xs text-muted-foreground">AI-powered content ideas for your trade</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics, e.g. 'summer deals', 'bathroom remodel'..."
            className="pl-9 h-10"
            onKeyDown={(e) => e.key === "Enter" && !loading && loadFeed()}
          />
        </div>
        <Button onClick={loadFeed} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : items.length ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Loading..." : items.length ? "Refresh" : "Discover"}
        </Button>
      </div>

      {items.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all",
              activeCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            All ({items.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const count = items.filter(i => i.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-all",
                  activeCategory === key ? `${cfg.color} border-current font-medium` : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" />
          <span className="text-sm">Discovering content ideas for your trade…</span>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">Your Content Feed</p>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Hit <strong>Discover</strong> to get trending topics, industry ideas, and ready-to-use posts tailored to your profession.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, idx) => {
          const catCfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.ready_to_use;
          const CatIcon = catCfg.icon;
          return (
            <Card key={idx} className="overflow-hidden hover:shadow-md transition-all group border-border/50">
              <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(item.image_query)}/800/600`;
                  }}
                />
                <Badge className={cn("absolute top-2 left-2 text-[10px] border backdrop-blur-sm", catCfg.color)}>
                  <CatIcon className="h-3 w-3 mr-1" />
                  {catCfg.label}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <p className="font-semibold text-sm leading-tight">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {item.caption}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.hashtags.slice(0, 5).map(h => (
                    <span key={h} className="text-[10px] text-primary/70">#{h}</span>
                  ))}
                  {item.hashtags.length > 5 && <span className="text-[10px] text-muted-foreground">+{item.hashtags.length - 5}</span>}
                </div>
                <Button size="sm" className="w-full gap-1.5" onClick={() => handleUse(item)}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Use This Post
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
