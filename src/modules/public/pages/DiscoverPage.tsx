import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMarketplaceListings, useMarketplaceProfessions } from "@/hooks/useMarketplace";
import { useBoostedUserIds } from "@/hooks/useBoosts";
import ListingCard from "@/modules/marketplace/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, Loader2, Briefcase, Crown, Star, TrendingUp, Rocket } from "lucide-react";

const POPULAR_PROFESSIONS = [
  "Barber", "Plumber", "Photographer", "Realtor", "Personal Trainer",
  "Electrician", "Hair Stylist", "Tattoo Artist", "Landscaper", "Contractor",
];

export default function DiscoverPage() {
  const { profession, city } = useParams<{ profession?: string; city?: string }>();
  const [search, setSearch] = useState("");

  const { data: listings, isLoading } = useMarketplaceListings({
    profession,
    city,
    search: search.length > 1 ? search : undefined,
  });

  const { data: profData } = useMarketplaceProfessions();
  const { data: boostedUsers } = useBoostedUserIds();

  const boostedIds = useMemo(() => new Set(boostedUsers?.map(b => b.user_id) ?? []), [boostedUsers]);
  const displayProfession = profession?.replace(/-/g, " ");
  const displayCity = city?.replace(/-/g, " ");

  const title = useMemo(() => {
    if (displayProfession && displayCity)
      return `${capitalize(displayProfession)}s in ${capitalize(displayCity)}`;
    if (displayProfession) return `${capitalize(displayProfession)}s`;
    if (displayCity) return `Businesses in ${capitalize(displayCity)}`;
    return "Discover Local Businesses";
  }, [displayProfession, displayCity]);

  const metaDescription = useMemo(() => {
    if (displayProfession && displayCity)
      return `Find trusted ${displayProfession}s in ${capitalize(displayCity)}. Book appointments, request quotes, and connect with local professionals.`;
    if (displayProfession) return `Browse top ${displayProfession}s on CardPilot. View profiles, read reviews, and book services instantly.`;
    return "Discover and book trusted local businesses on CardPilot. Search by profession, location, and services.";
  }, [displayProfession, displayCity]);

  const cities = useMemo(() => {
    if (!listings) return [];
    const set = new Set<string>();
    listings.forEach((l) => l.city && set.add(l.city));
    return Array.from(set).sort().slice(0, 12);
  }, [listings]);

  const featuredListings = useMemo(() => listings?.filter((l) => l.featured) ?? [], [listings]);
  const regularListings = useMemo(() => listings?.filter((l) => !l.featured) ?? [], [listings]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} | CardPilot</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/8 via-background to-primary/4 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              CardPilot
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-sm text-foreground font-medium">Discover</span>
            {displayProfession && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-sm text-foreground font-medium capitalize">{displayProfession}</span>
              </>
            )}
            {displayCity && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-sm text-foreground font-medium capitalize">{displayCity}</span>
              </>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-8">
            Find and book trusted local professionals. View ratings, request quotes, and connect directly.
          </p>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, profession, or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base bg-card border-border/60"
            />
          </div>

          {/* Stats bar */}
          {!isLoading && listings && (
            <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {listings.length} businesses
              </span>
              {featuredListings.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-primary" /> {featuredListings.length} featured
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4" /> {listings.filter(l => l.review_count > 0).length} with reviews
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profession pills */}
        {!profession && !city && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Popular Professions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_PROFESSIONS.map((p) => (
                <Link key={p} to={`/discover/${p.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors">
                    {p}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* City pills */}
        {cities.length > 0 && !city && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Cities</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <Link
                  key={c}
                  to={
                    profession
                      ? `/discover/${profession}/${c.toLowerCase().replace(/\s+/g, "-")}`
                      : `/discover`
                  }
                >
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors">
                    {c}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured section */}
        {featuredListings.length > 0 && !search && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Featured Businesses</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${regularListings.length} businesses`}
            </span>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : regularListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {regularListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No businesses found</h3>
            <p className="text-muted-foreground mb-6">
              {search ? "Try a different search term." : "No listings match this filter yet."}
            </p>
            <Button asChild variant="outline">
              <Link to="/discover">Browse all</Link>
            </Button>
          </div>
        ) : null}

        {/* SEO footer */}
        <div className="mt-16 pt-8 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            Powered by <Link to="/" className="text-primary hover:underline">CardPilot</Link> — the smart business card platform that helps local businesses get more customers.
          </p>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
