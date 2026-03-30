import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, MapPin, Star, ArrowRight, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "../data/mockData";
import { FeaturedBadge, PremiumBadge, BoostedBadge } from "../components/MarketplaceBadges";
import { useUserLocation } from "../hooks/useUserLocation";
import { useMarketplaceSearch, type MarketplaceResult } from "../hooks/useMarketplaceSearch";

function ProviderCard({ biz, onView }: { biz: MarketplaceResult; onView: () => void }) {
  const logoFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.business_name.slice(0, 2))}&background=6366f1&color=fff&size=128`;
  return (
    <div className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow relative">
      {(biz.is_featured || biz.has_premium_badge || biz.is_boosted) && (
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
          {biz.is_featured && <FeaturedBadge />}
          {biz.has_premium_badge && <PremiumBadge />}
          {biz.is_boosted && !biz.is_featured && <BoostedBadge />}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <img src={biz.logo_url || logoFallback} alt={biz.business_name} className="w-12 h-12 rounded-xl object-cover" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{biz.business_name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {biz.location_city}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-sm font-medium">{Number(biz.avg_rating).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({biz.review_count} reviews)</span>
        </div>
        {biz.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{biz.description}</p>
        )}
        <Button size="sm" className="w-full" onClick={onView}>View Profile</Button>
      </div>
    </div>
  );
}

function ProviderCardSkeleton() {
  return (
    <div className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4 mb-4" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

function ProviderRow({ title, results, isLoading }: { title: string; results: MarketplaceResult[]; isLoading: boolean }) {
  const navigate = useNavigate();
  if (!isLoading && results.length === 0) return null;
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-foreground mb-4 px-1">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProviderCardSkeleton key={i} />)
          : results.map((b) => (
              <ProviderCard key={b.business_id} biz={b} onView={() => navigate(`/marketplace/${b.slug}`)} />
            ))}
      </div>
    </section>
  );
}

export default function MarketplaceHome() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { location, detectLocation, detecting } = useUserLocation();

  // Fetch featured (high score) and all providers for the user's city
  const { data: featuredData, isLoading: featuredLoading } = useMarketplaceSearch({
    city: location.city,
    lat: location.lat,
    lon: location.lon,
    limit: 8,
  });

  const { data: allData, isLoading: allLoading } = useMarketplaceSearch({
    lat: location.lat,
    lon: location.lon,
    limit: 8,
  });

  const featured = (featuredData?.results || []).filter((b) => b.is_featured);
  const topRated = (featuredData?.results || []).filter((b) => b.avg_rating >= 4.0).slice(0, 6);
  const recent = (allData?.results || []).slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/marketplace/search?q=${encodeURIComponent(search)}&loc=${encodeURIComponent(location.city)}`);
    }
  };

  const handleCategory = (key: string) => {
    navigate(`/marketplace/category/${key}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Find Trusted Local Services | guzzl.pro</title>
        <meta name="description" content="Browse professionals, request quotes, and book services in minutes." />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
            Find Trusted Local Services
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-2 max-w-xl mx-auto">
            Browse professionals, request quotes, and book services in minutes.
          </p>

          {/* Location indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Services near {location.city}, {location.region}</span>
            </div>
            <button
              onClick={detectLocation}
              disabled={detecting}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Crosshair className="h-3 w-3" />
              {detecting ? "Detecting…" : "Update"}
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="What service do you need?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base bg-card border-border"
              />
            </div>
            <div className="relative sm:w-52">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={`${location.city}, ${location.region}`}
                readOnly
                className="pl-10 h-12 text-base bg-card border-border text-muted-foreground"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {/* ── Categories ── */}
        <section className="py-10">
          <h2 className="text-xl font-bold text-foreground mb-5">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategory(cat.key)}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Featured ── */}
        <ProviderRow title="⭐ Featured Providers" results={featured} isLoading={featuredLoading} />

        {/* ── Top Rated ── */}
        <ProviderRow title="Top Rated" results={topRated} isLoading={featuredLoading} />

        {/* ── Recently Added ── */}
        <ProviderRow title="Recently Added" results={recent} isLoading={allLoading} />

        {/* ── CTA Banner ── */}
        <section className="py-12">
          <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-8 sm:p-12 text-center text-primary-foreground">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Are you a service provider?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Get discovered by local customers and grow your business with guzzl.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="font-semibold"
              onClick={() => navigate("/auth")}
            >
              Create Your Free guzzl Card <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} guzzl.pro — All rights reserved.
      </footer>
    </div>
  );
}
