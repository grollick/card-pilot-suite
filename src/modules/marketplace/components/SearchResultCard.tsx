import { useNavigate } from "react-router-dom";
import { MapPin, Star, BadgeCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeaturedBadge, PremiumBadge, BoostedBadge } from "./MarketplaceBadges";
import type { MarketplaceResult } from "../hooks/useMarketplaceSearch";

export function SearchResultCard({ biz }: { biz: MarketplaceResult }) {
  const navigate = useNavigate();
  const logoFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.business_name.slice(0, 2))}&background=6366f1&color=fff&size=128`;

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-shadow relative ${
        biz.is_featured || biz.is_boosted ? "border-primary/20 bg-primary/[0.02]" : "border-border"
      }`}
    >
      {(biz.is_featured || biz.has_premium_badge || biz.is_boosted) && (
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          {biz.is_featured && <FeaturedBadge />}
          {biz.has_premium_badge && <PremiumBadge />}
          {biz.is_boosted && !biz.is_featured && <BoostedBadge />}
        </div>
      )}

      <img
        src={biz.logo_url || logoFallback}
        alt={biz.business_name}
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">{biz.business_name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-sm font-medium">{Number(biz.avg_rating).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({biz.review_count})</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3" />
          {biz.location_city}{biz.location_region ? `, ${biz.location_region}` : ""}
          {biz.distance_km != null && (
            <span className="ml-1 text-muted-foreground">· {biz.distance_km} km away</span>
          )}
        </div>
        {biz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{biz.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {biz.avg_rating >= 4.5 && biz.review_count >= 5 && (
            <Badge variant="outline" className="text-xs border-warning/30 text-warning bg-warning/5">
              <BadgeCheck className="h-3 w-3 mr-1" /> Top rated
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/marketplace/${biz.slug}`)}>
            View Profile
          </Button>
          <Button size="sm" onClick={() => navigate(`/marketplace/${biz.slug}/book`)}>
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
