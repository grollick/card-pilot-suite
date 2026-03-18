import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  MARKETPLACE_BLOCKS, BLOCK_CATEGORIES,
  canAccessBlock, type BlockCategory, type MarketplaceBlock,
} from "@/lib/blockMarketplace";
import {
  Search, Crown, Check, Plus, HelpCircle, BadgePercent, Timer,
  Zap, Play, Columns, LayoutGrid, Quote, Award, TrendingUp,
  Phone, CalendarPlus, DollarSign, Calculator, Wand2, Target,
  Shield, MessageCircle, Briefcase, Instagram,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icon lookup
const ICON_MAP: Record<string, LucideIcon> = {
  HelpCircle, BadgePercent, Timer, Zap, Play, Columns, LayoutGrid,
  Quote, Award, TrendingUp, Phone, CalendarPlus, DollarSign, Calculator,
  Wand2, Target, Shield, MessageCircle, Briefcase, Instagram,
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Target, Play, Shield, MessageCircle, Briefcase,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installedBlockIds: string[];
  onInstallBlock: (block: MarketplaceBlock) => void;
  userPlan: string;
}

export default function BlockMarketplaceDialog({
  open, onOpenChange, installedBlockIds, onInstallBlock, userPlan,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let blocks = activeCategory === "all"
      ? MARKETPLACE_BLOCKS
      : MARKETPLACE_BLOCKS.filter((b) => b.category === activeCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      blocks = blocks.filter(
        (b) => b.name.toLowerCase().includes(q) ||
               b.description.toLowerCase().includes(q) ||
               b.tags.some((t) => t.includes(q))
      );
    }
    return blocks;
  }, [activeCategory, search]);

  const isInstalled = (id: string) => installedBlockIds.includes(id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border space-y-3 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Block Marketplace
          </DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search blocks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {BLOCK_CATEGORIES.map((cat) => {
              const CatIcon = CATEGORY_ICONS[cat.icon] || Briefcase;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CatIcon className="h-3 w-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.length === 0 && (
              <p className="col-span-2 text-center text-sm text-muted-foreground py-8">
                No blocks found matching your search.
              </p>
            )}
            {filtered.map((block) => {
              const Icon = ICON_MAP[block.icon] || HelpCircle;
              const installed = isInstalled(block.id);
              const canAccess = canAccessBlock(block, userPlan);

              return (
                <div
                  key={block.id}
                  className={`group relative rounded-xl border p-4 transition-all ${
                    installed
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
                  }`}
                >
                  {/* Premium badge */}
                  {block.isPremium && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2.5 right-2.5 text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20"
                    >
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      {block.requiredPlan}
                    </Badge>
                  )}

                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      installed ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-tight">{block.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {block.description}
                      </p>
                      {block.preview && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1.5 italic line-clamp-1">
                          {block.preview}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
                    <div className="flex gap-1 flex-wrap">
                      {block.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {installed ? (
                      <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/30">
                        <Check className="h-3 w-3" /> Installed
                      </Badge>
                    ) : canAccess ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1"
                        onClick={() => onInstallBlock(block)}
                      >
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px] gap-1 text-amber-600"
                        onClick={() => window.location.href = "/pricing"}
                      >
                        <Crown className="h-3 w-3" /> Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
