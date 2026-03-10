import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowRight, Star, Crown, MessageSquare, Rocket } from "lucide-react";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-0.5">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}

export default function ListingCard({ listing, boosted }: { listing: MarketplaceListing; boosted?: boolean }) {
  const initials = (listing.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className={`group overflow-hidden border transition-all duration-300 ${
      listing.featured
        ? "border-primary/40 bg-primary/[0.02] shadow-md ring-1 ring-primary/10"
        : boosted
        ? "border-accent/40 bg-accent/[0.02] shadow-md ring-1 ring-accent/10"
        : "border-border/60 hover:border-primary/30 hover:shadow-lg"
    }`}>
      {listing.featured && (
        <div className="bg-primary/10 px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
          <Crown className="h-3 w-3" />
          Featured Business
        </div>
      )}
      {boosted && !listing.featured && (
        <div className="bg-accent/10 px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium text-accent">
          <Rocket className="h-3 w-3" />
          Boosted Business
        </div>
      )}
      <CardContent className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 rounded-xl border-2 border-border">
            <AvatarImage src={listing.avatar_url ?? undefined} alt={listing.name ?? ""} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{listing.name}</h3>
            {listing.company && (
              <p className="text-sm text-muted-foreground truncate">{listing.company}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {listing.profession_name && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {listing.profession_name}
                </Badge>
              )}
              {listing.city && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {listing.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        {listing.avg_rating !== null && listing.review_count > 0 && (
          <StarRating rating={listing.avg_rating} count={listing.review_count} />
        )}

        {/* Bio */}
        {listing.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.bio}
          </p>
        )}

        {/* Service Area */}
        {listing.service_area && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Serves: {listing.service_area}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/${listing.handle}`}>
              View Card <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/book/${listing.handle}`}>
              <Calendar className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/${listing.handle}?quote=1`}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
