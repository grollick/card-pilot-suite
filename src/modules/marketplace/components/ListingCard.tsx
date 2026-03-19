import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, ArrowRight, Star, Crown, MessageSquare,
  Rocket, Phone, DollarSign, Clock, ShieldCheck, CheckCircle2, Zap, Radio,
} from "lucide-react";
import type { MarketplaceListing } from "@/hooks/useMarketplace";
import { motion } from "framer-motion";

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-0.5">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}

function PriceRange({ services }: { services: { name: string; price: number | null }[] }) {
  const prices = services.map((s) => s.price).filter((p): p is number => p !== null && p > 0);
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <DollarSign className="h-3 w-3" />
      {min === max ? `$${min}` : `$${min}–$${max}`}
    </span>
  );
}

function ResponseBadge({ minutes }: { minutes: number }) {
  if (minutes < 30) return (
    <Badge variant="secondary" className="text-[10px] gap-0.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
      <Zap className="h-2.5 w-2.5" /> &lt;30 min
    </Badge>
  );
  if (minutes < 60) return (
    <Badge variant="secondary" className="text-[10px] gap-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/15">
      <Clock className="h-2.5 w-2.5" /> &lt;1 hr
    </Badge>
  );
  if (minutes < 240) return (
    <Badge variant="secondary" className="text-[10px] gap-0.5">
      <Clock className="h-2.5 w-2.5" /> &lt;4 hrs
    </Badge>
  );
  return null;
}

interface ListingCardProps {
  listing: MarketplaceListing;
  boosted?: boolean;
  /** Renders an expanded hero variant for top recommended cards */
  variant?: "default" | "hero";
}

export default function ListingCard({ listing, boosted, variant = "default" }: ListingCardProps) {
  const initials = (listing.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isVerified = listing.profile_completeness >= 70 && listing.review_count >= 1;
  const isHero = variant === "hero";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`group overflow-hidden border transition-all duration-300 ${
        isHero
          ? "border-primary/30 bg-gradient-to-br from-primary/[0.04] to-background shadow-lg ring-1 ring-primary/10 hover:shadow-xl"
          : listing.featured
          ? "border-primary/40 bg-primary/[0.02] shadow-md ring-1 ring-primary/10"
          : boosted
          ? "border-accent/40 bg-accent/[0.02] shadow-md ring-1 ring-accent/10"
          : "border-border/60 hover:border-primary/30 hover:shadow-lg"
      }`}>
        {listing.featured && !isHero && (
          <div className="bg-primary/10 px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Crown className="h-3 w-3" />
            Featured Business
          </div>
        )}
        {boosted && !listing.featured && !isHero && (
          <div className="bg-accent/10 px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium text-accent">
            <Rocket className="h-3 w-3" />
            Boosted Business
          </div>
        )}
        {isHero && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Star className="h-3 w-3 fill-primary" />
            Top Recommended
          </div>
        )}
        <CardContent className={`flex flex-col gap-3 ${isHero ? "p-6" : "p-5"}`}>
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className={`rounded-xl border-2 border-border shrink-0 ${isHero ? "h-16 w-16" : "h-14 w-14"}`}>
                <AvatarImage src={listing.avatar_url ?? undefined} alt={listing.name ?? ""} />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {listing.available_for_work && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card" title="Available for work" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={`font-semibold text-foreground truncate ${isHero ? "text-lg" : ""}`}>{listing.name}</h3>
                {isVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </div>
              {listing.company && (
                <p className="text-sm text-muted-foreground truncate">{listing.company}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {listing.profession_name && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {listing.profession_name}
                  </Badge>
                )}
                {listing.is_on_duty && (
                  <Badge className="text-[10px] font-medium gap-0.5 bg-success/15 text-success border-success/20 animate-pulse">
                    <Radio className="h-2.5 w-2.5" /> On Duty
                  </Badge>
                )}
                {listing.available_for_work && !listing.is_on_duty && (
                  <Badge variant="outline" className="text-[10px] font-normal gap-0.5 bg-success/5 text-success border-success/20">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Available
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Trust signals row */}
          <div className="flex flex-wrap items-center gap-2">
            {listing.avg_rating !== null && listing.review_count > 0 && (
              <StarRating rating={listing.avg_rating} count={listing.review_count} />
            )}
            {listing.avg_response_minutes !== null && (
              <ResponseBadge minutes={listing.avg_response_minutes} />
            )}
            {listing.city && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {listing.city}
              </span>
            )}
            <PriceRange services={listing.services} />
          </div>

          {/* Bio */}
          {listing.bio && (
            <p className={`text-muted-foreground leading-relaxed ${isHero ? "text-sm line-clamp-3" : "text-sm line-clamp-2"}`}>
              {listing.bio}
            </p>
          )}

          {/* Services */}
          {listing.services.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.services.slice(0, isHero ? 5 : 4).map((s) => (
                <Badge key={s.name} variant="outline" className="text-[10px] font-normal text-muted-foreground">
                  {s.name}
                  {s.price !== null && s.price > 0 && (
                    <span className="ml-1 text-foreground font-medium">${s.price}</span>
                  )}
                </Badge>
              ))}
              {listing.services.length > (isHero ? 5 : 4) && (
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                  +{listing.services.length - (isHero ? 5 : 4)} more
                </Badge>
              )}
            </div>
          )}

          {/* Service Area */}
          {listing.service_area && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Serves: {listing.service_area}
            </p>
          )}

          {/* Trust text */}
          {listing.review_count >= 5 && listing.avg_response_minutes !== null && listing.avg_response_minutes < 30 && (
            <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-primary/60" />
              Trusted by local homeowners · Fast response times
            </p>
          )}
          {listing.review_count >= 3 && listing.review_count < 5 && (
            <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-muted-foreground/60" />
              Verified local professional
            </p>
          )}

          {/* Primary CTA — Request Estimate is always dominant */}
          <div className="mt-auto pt-2 space-y-2">
            <Button asChild size="sm" className={`w-full gap-1.5 shadow-sm ${listing.is_on_duty ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}>
              <Link to={`/${listing.handle}?quote=1`}>
                <MessageSquare className="h-3.5 w-3.5" /> Request Estimate
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                <Link to={`/${listing.handle}`}>
                  <ArrowRight className="h-3.5 w-3.5" /> View Profile
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                <Link to={`/book/${listing.handle}`}>
                  <Calendar className="h-3.5 w-3.5" /> Book
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-xs px-2">
                <Link to={`/${listing.handle}?contact=1`}>
                  <Phone className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
