import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Filter, ArrowLeft, MapPin, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "../data/mockData";
import { useUserLocation } from "../hooks/useUserLocation";
import { useMarketplaceSearch } from "../hooks/useMarketplaceSearch";
import { SearchResultCard } from "../components/SearchResultCard";
import { ResultListSkeleton } from "../components/ResultCardSkeleton";
import { EmptySearchState } from "../components/EmptySearchState";

export default function CategoryResults() {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { location, setLocation, detectLocation, detecting } = useUserLocation();

  const querySearch = searchParams.get("q") || "";
  const [keyword, setKeyword] = useState(querySearch);
  const [minRating, setMinRating] = useState("0");
  const [geoEnabled, setGeoEnabled] = useState(true);

  const catInfo = CATEGORIES.find((c) => c.key === category);
  const pageTitle = catInfo
    ? `${catInfo.label} in ${location.city}`
    : querySearch
    ? `Results for "${querySearch}"`
    : `Services near ${location.city}`;

  const { data, isLoading } = useMarketplaceSearch({
    city: geoEnabled ? location.city : undefined,
    keyword: keyword.trim() || undefined,
    category: category || undefined,
    minRating: parseFloat(minRating),
  });

  const results = data?.results || [];
  const totalCount = data?.totalCount || 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle} | guzzl.pro Marketplace</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate("/marketplace")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1">{pageTitle}</h1>

        {/* Location indicator */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location.city}, {location.region}</span>
          </div>
          <button
            onClick={detectLocation}
            disabled={detecting}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Crosshair className="h-3 w-3" />
            {detecting ? "Detecting…" : "Update location"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by keyword…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10"
            />
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
        </div>

        {/* Results count */}
        {!isLoading && results.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            {totalCount} provider{totalCount !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Results */}
        {isLoading ? (
          <ResultListSkeleton count={4} />
        ) : results.length === 0 ? (
          <EmptySearchState
            city={geoEnabled ? location.city : undefined}
            onExpandSearch={geoEnabled ? () => setGeoEnabled(false) : undefined}
            onBrowseAll={() => {
              setKeyword("");
              setMinRating("0");
              setGeoEnabled(false);
            }}
          />
        ) : (
          <div className="space-y-4">
            {results.map((b) => (
              <SearchResultCard key={b.business_id} biz={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
