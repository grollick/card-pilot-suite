import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useMarketplaceListings, useMarketplaceProfessions } from "@/hooks/useMarketplace";
import ListingCard from "@/components/marketplace/ListingCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, Loader2, Briefcase } from "lucide-react";

const POPULAR_PROFESSIONS = [
  "Barber", "Plumber", "Photographer", "Realtor", "Personal Trainer",
  "Electrician", "Hair Stylist", "Tattoo Artist",
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

  const displayProfession = profession?.replace(/-/g, " ");
  const displayCity = city?.replace(/-/g, " ");

  const title = useMemo(() => {
    if (displayProfession && displayCity)
      return `${capitalize(displayProfession)}s in ${capitalize(displayCity)}`;
    if (displayProfession) return `${capitalize(displayProfession)}s`;
    if (displayCity) return `Businesses in ${capitalize(displayCity)}`;
    return "Discover Local Businesses";
  }, [displayProfession, displayCity]);

  const cities = useMemo(() => {
    if (!listings) return [];
    const set = new Set<string>();
    listings.forEach((l) => l.city && set.add(l.city));
    return Array.from(set).sort().slice(0, 12);
  }, [listings]);

  return (
    <div className="min-h-screen bg-background">
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
            Find and book trusted local professionals. Each listing links directly to their digital business card.
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profession pills (show on main /discover) */}
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

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${listings?.length ?? 0} businesses found`}
            </span>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
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
        )}

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
