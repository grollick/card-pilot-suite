import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMarketplaceListings, useMarketplaceProfessions, useMarketplaceServices, type MarketplaceListing } from "@/hooks/useMarketplace";
import { useBoostedUserIds, useTrackBoostViews } from "@/hooks/useBoosts";
import ListingCard from "@/modules/marketplace/components/ListingCard";
import MarketplaceQuoteDialog from "@/modules/marketplace/components/MarketplaceQuoteDialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Users, Loader2, Briefcase, Crown, Star,
  TrendingUp, Rocket, Wrench, SlidersHorizontal, X,
  CalendarCheck, MessageSquareText, CheckCircle2, Sparkles, ChevronRight,
  ArrowRight, Navigation, StarIcon,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const POPULAR_PROFESSIONS = [
  "Barber", "Plumber", "Photographer", "Realtor", "Personal Trainer",
  "Electrician", "Hair Stylist", "Tattoo Artist", "Landscaper", "Contractor",
];

// ── Instant Matching Wizard ──
function InstantMatchWizard({
  onMatch,
  professions,
}: {
  onMatch: (matches: MarketplaceListing[]) => void;
  professions: string[];
}) {
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState("");
  const [urgency, setUrgency] = useState<"now" | "week" | "later">("week");
  const [city, setCity] = useState("");

  const { data: listings } = useMarketplaceListings({
    profession: profession ? profession.toLowerCase().replace(/\s+/g, "-") : undefined,
    city: city ? city.toLowerCase().replace(/\s+/g, "-") : undefined,
    intent: urgency === "now" ? "available_now" : undefined,
  });

  const handleFinish = useCallback(() => {
    if (!listings) return;
    const top3 = listings.slice(0, 3);
    onMatch(top3);
  }, [listings, onMatch]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/3 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Instant Match</h3>
            <p className="text-xs text-muted-foreground">Answer 3 questions, get matched instantly</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i <= step ? "w-8 bg-primary" : "w-4 bg-muted-foreground/20"
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <Label className="text-sm font-medium">What type of professional do you need?</Label>
              <Select value={profession} onValueChange={setProfession}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select a profession…" /></SelectTrigger>
                <SelectContent>
                  {professions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={!profession} onClick={() => setStep(1)} className="w-full gap-1 h-10">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <Label className="text-sm font-medium">How soon do you need help?</Label>
              <div className="grid grid-cols-3 gap-2">
                {([["now", "ASAP"], ["week", "This week"], ["later", "Not urgent"]] as const).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={urgency === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUrgency(key)}
                    className="text-xs h-10"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full gap-1 h-10">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <Label className="text-sm font-medium">Your city or area (optional)</Label>
              <Input
                placeholder="e.g. Austin, Dallas…"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleFinish} className="w-full gap-1.5 h-10 shadow-sm">
                <Sparkles className="h-4 w-4" /> Show My Top Matches
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setStep(step - 1)}>
            ← Back
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Top Matches Result ──
function TopMatchesResult({ matches, onClear }: { matches: MarketplaceListing[]; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Top Matches</h2>
            <p className="text-xs text-muted-foreground">Ranked by reviews, response speed & availability</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={onClear}>
          <X className="h-3 w-3" /> Clear
        </Button>
      </div>
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <ListingCard listing={l} variant="hero" />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No matches found. Try broadening your criteria.</p>
      )}
    </motion.div>
  );
}

// ── Recommended section (always visible, auto top 3) ──
function RecommendedSection({ listings }: { listings: MarketplaceListing[] }) {
  const top3 = useMemo(() => listings.slice(0, 3), [listings]);
  if (top3.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-12"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Top Recommended</h2>
          <p className="text-xs text-muted-foreground">Highest rated, fastest responses</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {top3.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
          >
            <ListingCard listing={l} variant="hero" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Sticky CTA ──
function StickyCTA({ onQuoteClick }: { onQuoteClick: () => void }) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:bottom-8"
    >
      <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-full shadow-xl px-2 py-2 flex items-center gap-2">
        <span className="text-sm font-medium text-foreground pl-4 hidden sm:inline">Need help finding the right pro?</span>
        <Button size="sm" className="rounded-full gap-1.5 shadow-sm px-5" onClick={onQuoteClick}>
          <MessageSquareText className="h-4 w-4" /> Request a Quote <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const { profession, city } = useParams<{ profession?: string; city?: string }>();
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [intentFilter, setIntentFilter] = useState<"" | "quote" | "book" | "available_now" | "on_duty">("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"" | "3" | "4" | "5">("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMatcher, setShowMatcher] = useState(false);
  const [topMatches, setTopMatches] = useState<MarketplaceListing[] | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Auto-detect user location on mount
  useEffect(() => {
    if (!city && !locationFilter && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`);
            const data = await res.json();
            const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
            if (cityName) setDetectedCity(cityName);
          } catch { /* silent fail */ }
        },
        () => { /* permission denied or error — silent */ },
        { timeout: 5000 }
      );
    }
  }, []);

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`);
          const data = await res.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
          if (cityName) {
            setDetectedCity(cityName);
            setLocationFilter(cityName);
          }
        } catch { /* silent */ }
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { timeout: 8000 }
    );
  }, []);

  // Use location filter or detected city as effective city
  const effectiveCity = city || (locationFilter ? locationFilter.toLowerCase().replace(/\s+/g, "-") : undefined);

  const { data: listings, isLoading } = useMarketplaceListings({
    profession: professionFilter ? professionFilter.toLowerCase().replace(/\s+/g, "-") : profession,
    city: effectiveCity,
    search: search.length > 1 ? search : undefined,
    service: serviceFilter || undefined,
    intent: (intentFilter || undefined) as any,
  });

  const { data: profData } = useMarketplaceProfessions();
  const { data: topServices } = useMarketplaceServices();
  const { data: boostedUsers } = useBoostedUserIds();

  const boostedIds = useMemo(() => new Set(boostedUsers?.map(b => b.user_id) ?? []), [boostedUsers]);
  const displayProfession = professionFilter || profession?.replace(/-/g, " ");
  const displayCity = locationFilter || city?.replace(/-/g, " ");

  // Apply rating filter client-side
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    if (!ratingFilter) return listings;
    const minRating = parseInt(ratingFilter);
    return listings.filter((l) => l.avg_rating !== null && l.avg_rating >= minRating);
  }, [listings, ratingFilter]);

  const title = useMemo(() => {
    if (displayProfession && displayCity)
      return `${capitalize(displayProfession)}s in ${capitalize(displayCity)}`;
    if (displayProfession) return `${capitalize(displayProfession)}s Near You`;
    if (displayCity) return `Professionals in ${capitalize(displayCity)}`;
    return "Find Professionals Near You";
  }, [displayProfession, displayCity]);

  const metaDescription = useMemo(() => {
    if (displayProfession && displayCity)
      return `Find trusted ${displayProfession}s in ${capitalize(displayCity)}. Book appointments, request quotes, and connect with local professionals.`;
    if (displayProfession) return `Browse top ${displayProfession}s on guzzl.pro. View profiles, read reviews, and book services instantly.`;
    return "Discover and book trusted local professionals. Search by service, location, and ratings — completely free.";
  }, [displayProfession, displayCity]);

  const cities = useMemo(() => {
    if (!filteredListings) return [];
    const set = new Set<string>();
    filteredListings.forEach((l) => l.city && set.add(l.city));
    return Array.from(set).sort().slice(0, 12);
  }, [filteredListings]);

  const featuredListings = useMemo(() => filteredListings?.filter((l) => l.featured) ?? [], [filteredListings]);
  const boostedListings = useMemo(() => filteredListings?.filter((l) => !l.featured && boostedIds.has(l.id)) ?? [], [filteredListings, boostedIds]);
  const onDutyListings = useMemo(() => filteredListings?.filter((l) => l.is_on_duty && !l.featured && !boostedIds.has(l.id)) ?? [], [filteredListings, boostedIds]);
  const allNonFeatured = useMemo(() => filteredListings?.filter((l) => !l.featured && !boostedIds.has(l.id)) ?? [], [filteredListings, boostedIds]);
  const regularListings = useMemo(() => allNonFeatured.slice(3), [allNonFeatured]);

  const boostedUserIdsArray = useMemo(() => boostedListings.map(l => l.id), [boostedListings]);
  useTrackBoostViews(boostedUserIdsArray);

  const hasActiveFilters = !!serviceFilter || !!search || !!intentFilter || !!professionFilter || !!locationFilter || !!ratingFilter;
  const professionNames = useMemo(() => profData?.professions.map(p => p.name) ?? POPULAR_PROFESSIONS, [profData]);

  const clearAll = () => { setSearch(""); setServiceFilter(""); setIntentFilter(""); setProfessionFilter(""); setLocationFilter(""); setRatingFilter(""); };

  // Show sticky CTA only when listings are loaded
  const showSticky = !isLoading && (listings?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>{title} | guzzl.pro</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary/8 via-background to-primary/4 border-b border-border/40 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors"><span className="font-extrabold text-primary">guzzl</span>.pro</Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm text-foreground font-medium">Discover</span>
            {displayProfession && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm text-foreground font-medium capitalize">{displayProfession}</span>
              </>
            )}
            {displayCity && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm text-foreground font-medium capitalize">{displayCity}</span>
              </>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-3">{title}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mb-4">
              Search by service, profession, or location. Compare reviews, response times, and connect instantly — completely free.
            </p>
            {detectedCity && !locationFilter && !city && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-6"
              >
                <Badge variant="outline" className="gap-1.5 text-sm py-1 px-3 bg-card/50 backdrop-blur-sm">
                  <Navigation className="h-3 w-3 text-primary" />
                  Near {detectedCity}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setLocationFilter(detectedCity)}
                >
                  Use this location
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Glassmorphism search panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl"
          >
            <div className="bg-card/70 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-lg space-y-4">
              {/* Search input */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                    placeholder="What service do you need?"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 text-base bg-background/50 border-border/40 rounded-xl"
                  />
                </div>
                <Link to="/request-service">
                  <Button size="lg" className="gap-2 h-12 shrink-0 rounded-xl">
                    <Send className="h-4 w-4" />
                    Get Quotes
                  </Button>
                </Link>
                <Button
                  variant={showFilters ? "secondary" : "outline"}
                  size="lg"
                  className="gap-2 h-12 shrink-0 rounded-xl"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                      {(serviceFilter ? 1 : 0) + (search ? 1 : 0) + (intentFilter ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </div>

              {/* Intent filter buttons */}
              <div className="flex flex-wrap gap-2">
                {([
                  { key: "quote" as const, label: "Get a quote", icon: MessageSquareText },
                  { key: "book" as const, label: "Book today", icon: CalendarCheck },
                  { key: "available_now" as const, label: "Available this week", icon: CheckCircle2 },
                  { key: "on_duty" as const, label: "On Duty Now", icon: Sparkles },
                ]).map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={intentFilter === key ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 text-xs rounded-lg"
                    onClick={() => setIntentFilter(intentFilter === key ? "" : key)}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </Button>
                ))}
                <Button
                  variant={showMatcher ? "secondary" : "outline"}
                  size="sm"
                  className="gap-1.5 text-xs rounded-lg"
                  onClick={() => { setShowMatcher(!showMatcher); setTopMatches(null); }}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Instant Match
                </Button>
              </div>
            </div>

            {/* Expanded service filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm space-y-4">
                    {/* Profession, Location, Rating filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> Profession
                        </label>
                        <Select value={professionFilter} onValueChange={(v) => setProfessionFilter(v === "all" ? "" : v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="All professions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All professions</SelectItem>
                            {professionNames.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Location
                        </label>
                        <div className="flex gap-1.5">
                          <Input
                            placeholder={detectedCity || "City or area…"}
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="h-9 text-xs flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={handleDetectLocation}
                            disabled={detectingLocation}
                            title="Detect my location"
                          >
                            {detectingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                          <Star className="h-3 w-3" /> Minimum Rating
                        </label>
                        <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v === "any" ? "" : v as any)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Any rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any rating</SelectItem>
                            <SelectItem value="3">3+ stars</SelectItem>
                            <SelectItem value="4">4+ stars</SelectItem>
                            <SelectItem value="5">5 stars only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Service tags */}
                    {topServices && topServices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filter by Service</span>
                          {serviceFilter && (
                            <button onClick={() => setServiceFilter("")} className="ml-auto text-xs text-primary hover:underline flex items-center gap-0.5">
                              <X className="h-3 w-3" /> Clear
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {topServices.map((s) => (
                            <Badge
                              key={s.name}
                              variant={serviceFilter === s.name ? "default" : "outline"}
                              className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
                              onClick={() => setServiceFilter(serviceFilter === s.name ? "" : s.name)}
                            >
                              {s.name}
                              <span className="ml-1 opacity-60">({s.count})</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={clearAll}>
                        <X className="h-3 w-3" /> Clear all filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Stats bar */}
          {!isLoading && listings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 mt-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {filteredListings.length} professionals
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4" /> {filteredListings.filter(l => l.review_count > 0).length} reviewed
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {filteredListings.filter(l => l.available_for_work).length} available
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <MapPin className="h-4 w-4" /> {cities.length} cities
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Instant Matching Wizard */}
        <AnimatePresence>
          {showMatcher && !topMatches && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 max-w-md overflow-hidden"
            >
              <InstantMatchWizard
                onMatch={(m) => setTopMatches(m)}
                professions={professionNames}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Matches from wizard */}
        {topMatches && (
          <TopMatchesResult matches={topMatches} onClear={() => { setTopMatches(null); setShowMatcher(false); }} />
        )}

        {/* Auto top 3 recommended (when no wizard results and no active filters) */}
        {!topMatches && !hasActiveFilters && allNonFeatured.length > 0 && (
          <RecommendedSection listings={allNonFeatured} />
        )}

        {/* Profession pills */}
        {!profession && !city && !search && !serviceFilter && !intentFilter && (
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

        {/* On Duty for Estimates Now */}
        {onDutyListings.length > 0 && !search && !serviceFilter && intentFilter !== "on_duty" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Available for Estimates Now</h2>
                <p className="text-xs text-muted-foreground">These businesses are on duty and ready to respond fast</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {onDutyListings.slice(0, 3).map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <ListingCard listing={l} variant="hero" />
                </motion.div>
              ))}
            </div>
            {onDutyListings.length > 3 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setIntentFilter("on_duty")}
                >
                  View all {onDutyListings.length} on-duty providers <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Active businesses section (replaces old Featured/Boosted paid sections) */}
        {featuredListings.length > 0 && !search && !serviceFilter && !intentFilter && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Active Professionals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}

        {/* All results */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${hasActiveFilters ? allNonFeatured.length : regularListings.length} more businesses`}
            </span>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {professionFilter && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Briefcase className="h-3 w-3" /> {professionFilter}
                  <button onClick={() => setProfessionFilter("")}><X className="h-3 w-3 ml-0.5" /></button>
                </Badge>
              )}
              {locationFilter && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <MapPin className="h-3 w-3" /> {locationFilter}
                  <button onClick={() => setLocationFilter("")}><X className="h-3 w-3 ml-0.5" /></button>
                </Badge>
              )}
              {ratingFilter && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Star className="h-3 w-3" /> {ratingFilter}+ stars
                  <button onClick={() => setRatingFilter("")}><X className="h-3 w-3 ml-0.5" /></button>
                </Badge>
              )}
              {intentFilter && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {intentFilter === "quote" ? "Quotes" : intentFilter === "book" ? "Bookable" : intentFilter === "on_duty" ? "On Duty" : "Available"}
                  <button onClick={() => setIntentFilter("")}><X className="h-3 w-3 ml-0.5" /></button>
                </Badge>
              )}
              {serviceFilter && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Wrench className="h-3 w-3" /> {serviceFilter}
                  <button onClick={() => setServiceFilter("")}><X className="h-3 w-3 ml-0.5" /></button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (hasActiveFilters ? allNonFeatured : regularListings).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(hasActiveFilters ? allNonFeatured : regularListings).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : featuredListings.length === 0 && (topMatches === null || topMatches.length === 0) ? (
          <div className="text-center py-20">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <MapPin className="h-12 w-12 mx-auto text-primary/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {hasActiveFilters ? "No professionals found" : "Be the first in your area"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try different search terms or filters."
                  : "No professionals are listed in this area yet. Join the marketplace and start getting discovered by local customers — it's free."}
              </p>
              <div className="flex gap-2 justify-center">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearAll}>Clear filters</Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/discover">Browse all</Link>
                </Button>
                {!hasActiveFilters && (
                  <Button asChild>
                    <Link to="/auth">Get Listed Free <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}

        {/* SEO footer */}
        <div className="mt-16 pt-8 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            Powered by <Link to="/" className="text-primary hover:underline"><span className="font-extrabold text-primary">guzzl</span>.pro</Link> — the smart business card platform that helps local businesses get more customers.
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      {showSticky && <StickyCTA onQuoteClick={() => setQuoteDialogOpen(true)} />}

      {/* Quote Dialog */}
      <MarketplaceQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        profession={displayProfession}
        location={displayCity}
      />
    </div>
  );
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
