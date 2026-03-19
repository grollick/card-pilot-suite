import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useMarketplaceListings, useMarketplaceProfessions } from "@/hooks/useMarketplace";
import { useBoostedUserIds } from "@/hooks/useBoosts";
import ListingCard from "@/modules/marketplace/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Users, Star, Shield, MapPin, ArrowRight, Calendar,
  CheckCircle, Crown, Briefcase,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function plural(s: string): string {
  if (s.endsWith("s")) return s;
  if (s.endsWith("y") && !["ay", "ey", "oy", "uy"].some((e) => s.endsWith(e)))
    return s.slice(0, -1) + "ies";
  return s + "s";
}

export default function SeoLandingPage() {
  const { handle: slug } = useParams<{ handle: string }>();

  const parsed = useMemo(() => {
    if (!slug) return null;
    const match = slug.match(/^(.+?)-in-(.+)$/);
    if (!match) return null;
    return {
      profession: match[1].replace(/-/g, " "),
      city: match[2].replace(/-/g, " "),
    };
  }, [slug]);

  const profDisplay = parsed ? capitalize(parsed.profession) : "";
  const cityDisplay = parsed ? capitalize(parsed.city) : "";
  const profPlural = parsed ? capitalize(plural(parsed.profession)) : "";

  const { data: listings, isLoading } = useMarketplaceListings({
    profession: parsed?.profession,
    city: parsed?.city,
  });

  const { data: profData } = useMarketplaceProfessions();
  const { data: boostedUsers } = useBoostedUserIds();
  const boostedIds = useMemo(() => new Set(boostedUsers?.map((b) => b.user_id) ?? []), [boostedUsers]);

  const ratedCount = useMemo(() => listings?.filter((l) => l.review_count > 0).length ?? 0, [listings]);
  const avgRating = useMemo(() => {
    if (!listings) return 0;
    const rated = listings.filter((l) => l.avg_rating !== null);
    if (rated.length === 0) return 0;
    return Math.round((rated.reduce((a, l) => a + (l.avg_rating ?? 0), 0) / rated.length) * 10) / 10;
  }, [listings]);

  // Related cities from listings
  const relatedCities = useMemo(() => {
    if (!listings) return [];
    const set = new Set<string>();
    listings.forEach((l) => l.city && l.city.toLowerCase() !== parsed?.city && set.add(l.city));
    return Array.from(set).sort().slice(0, 8);
  }, [listings, parsed]);

  // Related professions
  const relatedProfessions = useMemo(() => {
    if (!profData) return [];
    const currentCategory = profData.professions.find(
      (p) => p.name.toLowerCase() === parsed?.profession
    )?.category;
    if (!currentCategory) return profData.professions.slice(0, 6).map((p) => p.name);
    return profData.professions
      .filter((p) => p.category === currentCategory && p.name.toLowerCase() !== parsed?.profession)
      .slice(0, 6)
      .map((p) => p.name);
  }, [profData, parsed]);

  const pageTitle = `Best ${profPlural} in ${cityDisplay} — Book Online | guzzl.pro`;
  const metaDesc = `Find top-rated ${profPlural.toLowerCase()} in ${cityDisplay}. View profiles, compare services & pricing, read reviews, and book appointments online. Trusted local professionals on guzzl.pro.`;
  const canonicalUrl = `https://guzzl-pro.app/${slug}`;

  // FAQ data
  const faqs = useMemo(() => [
    {
      q: `How do I find the best ${profDisplay.toLowerCase()} in ${cityDisplay}?`,
      a: `Browse the listings above to compare ${profPlural.toLowerCase()} in ${cityDisplay}. Each profile shows ratings, services offered, pricing, and reviews from previous customers. Use these to find the right fit for your needs.`,
    },
    {
      q: `How do I book a ${profDisplay.toLowerCase()} in ${cityDisplay}?`,
      a: `Click on any listing to view their full profile, then use the "Book" button to schedule an appointment at a time that works for you. You can also request a quote or contact them directly.`,
    },
    {
      q: `Is it free to browse and book ${profPlural.toLowerCase()}?`,
      a: `Yes, browsing profiles and booking through guzzl.pro is completely free for customers. No account or credit card required.`,
    },
    {
      q: `Are ${profPlural.toLowerCase()} on guzzl.pro verified?`,
      a: `All professionals create and manage their own profiles, services, and availability. We encourage users to review profiles, check ratings, and read reviews before booking.`,
    },
    {
      q: `What services do ${profPlural.toLowerCase()} in ${cityDisplay} offer?`,
      a: `Services vary by provider. Each listing shows the specific services offered along with pricing. Click "View Card" on any listing to see their full service menu and descriptions.`,
    },
    {
      q: `I'm a ${profDisplay.toLowerCase()} — how do I get listed in ${cityDisplay}?`,
      a: `Sign up for a free guzzl.pro account, set your profession and city, create your digital business card, and enable marketplace visibility. You'll automatically appear in local search results.`,
    },
  ], [profDisplay, profPlural, cityDisplay]);

  // JSON-LD: ItemList
  const itemListJsonLd = useMemo(() => {
    const items = (listings ?? []).slice(0, 10).map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: l.name,
        description: l.bio || `${l.profession_name ?? profDisplay} in ${cityDisplay}`,
        url: `https://guzzl-pro.app/${l.handle}`,
        ...(l.city ? { address: { "@type": "PostalAddress", addressLocality: l.city } } : {}),
        ...(l.avatar_url ? { image: l.avatar_url } : {}),
        ...(l.avg_rating !== null
          ? { aggregateRating: { "@type": "AggregateRating", ratingValue: l.avg_rating, reviewCount: l.review_count } }
          : {}),
      },
    }));

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Best ${profPlural} in ${cityDisplay}`,
      description: metaDesc,
      numberOfItems: items.length,
      itemListElement: items,
    };
  }, [listings, profPlural, cityDisplay, metaDesc, profDisplay]);

  // JSON-LD: FAQPage
  const faqJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }), [faqs]);

  if (!parsed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid page.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <header className="bg-gradient-to-br from-primary/8 via-background to-primary/4 border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 mb-5 text-sm" aria-label="Breadcrumb">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors"><span className="font-extrabold text-primary">guzzl</span>.pro</Link>
              <span className="text-muted-foreground/50">/</span>
              <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">Discover</Link>
              <span className="text-muted-foreground/50">/</span>
              <Link
                to={`/discover/${parsed.profession.replace(/\s+/g, "-")}`}
                className="text-muted-foreground hover:text-foreground transition-colors capitalize"
              >
                {profDisplay}
              </Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-foreground font-medium capitalize">{cityDisplay}</span>
            </nav>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
              Best {profPlural} in {cityDisplay}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Browse verified {profPlural.toLowerCase()} in {cityDisplay}. Compare services, read reviews, and book appointments directly — no phone calls needed.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Shield className="h-3.5 w-3.5" /> Verified Professionals
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Calendar className="h-3.5 w-3.5" /> Instant Booking
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <MapPin className="h-3.5 w-3.5" /> {cityDisplay}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <CheckCircle className="h-3.5 w-3.5" /> Free to Use
              </Badge>
            </div>

            {/* Stats */}
            {!isLoading && listings && listings.length > 0 && (
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {listings.length} {profPlural.toLowerCase()}
                </span>
                {ratedCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {avgRating} avg rating
                  </span>
                )}
                {listings.filter((l) => l.featured).length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-primary" /> {listings.filter((l) => l.featured).length} featured
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-10">
          {/* Intro */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Find a {profDisplay} in {cityDisplay}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              Looking for a trusted {profDisplay.toLowerCase()} in {cityDisplay}? guzzl.pro connects you with local
              {" "}{profPlural.toLowerCase()} who are ready to help. Browse their profiles below to view services,
              pricing, and customer reviews. Book your appointment online in seconds — it's free and no account is required.
            </p>
          </section>

          {/* Listings */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                {isLoading ? "Loading…" : `${listings?.length ?? 0} ${profPlural} in ${cityDisplay}`}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} boosted={boostedIds.has(l.id)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-xl border border-border/60">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No {profPlural.toLowerCase()} listed in {cityDisplay} yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Are you a {profDisplay.toLowerCase()} in {cityDisplay}? Create your free guzzl.pro profile and start getting leads from local customers.
                </p>
                <Button asChild>
                  <Link to="/auth">
                    Create Your Profile <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* Related professions */}
          {relatedProfessions.length > 0 && (
            <section className="mt-14">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  Related Professions in {cityDisplay}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedProfessions.map((p) => (
                  <Link key={p} to={`/${p.toLowerCase().replace(/\s+/g, "-")}-in-${parsed.city.replace(/\s+/g, "-")}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors">
                      {p}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related cities */}
          {relatedCities.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  {profPlural} in Other Cities
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedCities.map((c) => (
                  <Link
                    key={c}
                    to={`/${parsed.profession.replace(/\s+/g, "-")}-in-${c.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors">
                      {c}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="mt-16 pt-10 border-t border-border/40">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              {faqs.map((f, i) => (
                <div key={i}>
                  <h3 className="font-medium text-foreground mb-1.5">{f.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA for providers */}
          <section className="mt-14 p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Are you a {profDisplay} in {cityDisplay}?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Create your free guzzl.pro profile and start getting leads from customers searching for {profPlural.toLowerCase()} in {cityDisplay}.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">
                Get Listed Free <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </section>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <Link to="/" className="text-primary hover:underline"><span className="font-extrabold text-primary">guzzl</span>.pro</Link> — the smart business card platform that helps local businesses get more customers.
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
