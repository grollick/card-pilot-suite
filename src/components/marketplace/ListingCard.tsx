import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

export default function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const initials = (listing.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="group overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5 flex flex-col gap-4">
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

        {/* Bio */}
        {listing.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.bio}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/${listing.handle}`}>
              View Card <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/book/${listing.handle}`}>
              <Calendar className="h-3.5 w-3.5 mr-1" /> Book
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
