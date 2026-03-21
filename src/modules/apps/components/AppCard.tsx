import { MarketplaceApp } from "@/hooks/useMarketplaceApps";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Download, Check } from "lucide-react";

const categoryColors: Record<string, string> = {
  payments: "bg-emerald-500/10 text-emerald-600",
  accounting: "bg-blue-500/10 text-blue-600",
  marketing: "bg-purple-500/10 text-purple-600",
  automation: "bg-amber-500/10 text-amber-600",
  analytics: "bg-cyan-500/10 text-cyan-600",
  industry_tools: "bg-rose-500/10 text-rose-600",
  communication: "bg-indigo-500/10 text-indigo-600",
  productivity: "bg-teal-500/10 text-teal-600",
};

const categoryIcons: Record<string, string> = {
  payments: "💳",
  accounting: "📊",
  marketing: "📣",
  automation: "⚡",
  analytics: "📈",
  industry_tools: "🔧",
  communication: "💬",
  productivity: "🚀",
};

interface Props {
  app: MarketplaceApp;
  isInstalled?: boolean;
  onInstall: () => void;
  onView: () => void;
}

export default function AppCard({ app, isInstalled, onInstall, onView }: Props) {
  const priceLabel =
    app.pricing_type === "free"
      ? "Free"
      : app.pricing_type === "subscription"
      ? `$${app.price_amount}/mo`
      : `$${app.price_amount}`;

  return (
    <Card className="group hover:shadow-md transition-all cursor-pointer border-border/60" onClick={onView}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3.5 mb-3">
          <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0 overflow-hidden">
            {app.icon_url ? (
              <img
                src={app.icon_url}
                alt={app.name}
                className="h-8 w-8 rounded-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.textContent = categoryIcons[app.category] || "📦";
                }}
              />
            ) : (
              categoryIcons[app.category] || "📦"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{app.name}</h3>
            <p className="text-2xs text-muted-foreground">{app.developer_name}</p>
          </div>
          <Badge variant="outline" className={`text-2xs shrink-0 ${categoryColors[app.category] || ""}`}>
            {app.category.replace("_", " ")}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{app.description}</p>

        <div className="flex items-center gap-3 mb-3">
          {app.avg_rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {app.avg_rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3 w-3" />
            {app.install_count.toLocaleString()}
          </span>
          <span className="ml-auto text-xs font-medium text-foreground">{priceLabel}</span>
        </div>

        <Button
          size="sm"
          variant={isInstalled ? "outline" : "default"}
          className="w-full text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            if (!isInstalled) onInstall();
          }}
          disabled={isInstalled}
        >
          {isInstalled ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" /> Installed
            </>
          ) : (
            "Install"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
