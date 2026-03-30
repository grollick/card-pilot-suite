import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, MapPin, Star, Filter, ArrowLeft, BadgeCheck, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, MOCK_BUSINESSES, type MockBusiness } from "../data/mockData";

function ResultCard({ biz }: { biz: MockBusiness }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
      <img src={biz.logo_url} alt={biz.business_name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">{biz.business_name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-sm font-medium">{biz.avg_rating}</span>
            <span className="text-xs text-muted-foreground">({biz.review_count})</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3" />
          {biz.location_city}, {biz.location_region}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{biz.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {biz.is_available_today && (
            <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/5">
              <Clock className="h-3 w-3 mr-1" /> Available today
            </Badge>
          )}
          {biz.is_top_rated && (
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

export default function CategoryResults() {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySearch = searchParams.get("q") || "";
  const [keyword, setKeyword] = useState(querySearch);
  const [minRating, setMinRating] = useState("0");
  const [sortBy, setSortBy] = useState<"top_rated" | "newest">("top_rated");

  const catInfo = CATEGORIES.find((c) => c.key === category);
  const pageTitle = catInfo ? `${catInfo.label} in Thunder Bay` : querySearch ? `Results for "${querySearch}"` : "All Services";

  const results = useMemo(() => {
    let list: MockBusiness[] = category
      ? MOCK_BUSINESSES.filter((b) => b.categories.includes(category))
      : [...MOCK_BUSINESSES];

    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      list = list.filter(
        (b) =>
          b.business_name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.services.some((s) => s.title.toLowerCase().includes(q))
      );
    }

    const rating = parseFloat(minRating);
    if (rating > 0) list = list.filter((b) => b.avg_rating >= rating);

    list.sort((a, b) =>
      sortBy === "newest"
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : b.avg_rating * b.review_count - a.avg_rating * a.review_count
    );

    return list;
  }, [category, keyword, minRating, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle} | guzzl.pro Marketplace</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back + Title */}
        <button onClick={() => navigate("/marketplace")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-5">{pageTitle}</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by keyword…" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-10" />
          </div>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Min rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All ratings</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="4.5">4.5+ stars</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top_rated">Top rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No providers found matching your criteria.</p>
            <Button variant="outline" onClick={() => { setKeyword(""); setMinRating("0"); }}>Clear filters</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((b) => <ResultCard key={b.id} biz={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
