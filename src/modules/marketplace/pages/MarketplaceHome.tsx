import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, MapPin, Star, ArrowRight, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES, getFeaturedBusinesses, getTopRatedBusinesses, getRecentBusinesses } from "../data/mockData";
import type { MockBusiness } from "../data/mockData";

function ProviderCard({ biz, onView }: { biz: MockBusiness; onView: () => void }) {
  return (
    <div className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <img src={biz.logo_url} alt={biz.business_name} className="w-12 h-12 rounded-xl object-cover" />
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
          <span className="text-sm font-medium">{biz.avg_rating}</span>
          <span className="text-xs text-muted-foreground">({biz.review_count} reviews)</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{biz.description}</p>
        <Button size="sm" className="w-full" onClick={onView}>View Profile</Button>
      </div>
    </div>
  );
}

function ProviderRow({ title, businesses }: { title: string; businesses: MockBusiness[] }) {
  const navigate = useNavigate();
  if (businesses.length === 0) return null;
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-foreground mb-4 px-1">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {businesses.map((b) => (
          <ProviderCard key={b.id} biz={b} onView={() => navigate(`/marketplace/${b.slug}`)} />
        ))}
      </div>
    </section>
  );
}

export default function MarketplaceHome() {
  const [search, setSearch] = useState("");
  const [location] = useState("Thunder Bay, ON");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/marketplace/search?q=${encodeURIComponent(search)}&loc=${encodeURIComponent(location)}`);
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
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Browse professionals, request quotes, and book services in minutes.
          </p>

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
                value={location}
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
        <ProviderRow title="Featured Providers" businesses={getFeaturedBusinesses()} />

        {/* ── Top Rated ── */}
        <ProviderRow title="Top Rated" businesses={getTopRatedBusinesses()} />

        {/* ── Recently Added ── */}
        <ProviderRow title="Recently Added" businesses={getRecentBusinesses()} />

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
