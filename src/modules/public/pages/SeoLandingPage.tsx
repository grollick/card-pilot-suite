import { useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useMarketplaceListings } from "@/hooks/useMarketplace";
import ListingCard from "@/components/marketplace/ListingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Star, Shield, MapPin, ArrowRight } from "lucide-react";
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

  const pageTitle = `Best ${profPlural} in ${cityDisplay} — Book Online | CardPilot`;
  const metaDesc = `Find top-rated ${profPlural.toLowerCase()} in ${cityDisplay}. View profiles, compare services, and book appointments online. Trusted local professionals on CardPilot.`;
  const canonicalUrl = `https://cardpilot.app/${slug}`;

  // JSON-LD structured data
  const jsonLd = useMemo(() => {
    const items = (listings ?? []).slice(0, 10).map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: l.name,
        description: l.bio || `${l.profession_name ?? profDisplay} in ${cityDisplay}`,
        url: `https://cardpilot.app/${l.handle}`,
        ...(l.city ? { address: { "@type": "PostalAddress", addressLocality: l.city } } : {}),
        ...(l.avatar_url ? { image: l.avatar_url } : {}),
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
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <header className="bg-gradient-to-br from-primary/8 via-background to-primary/4 border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 mb-5 text-sm" aria-label="Breadcrumb">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">CardPilot</Link>
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
              Browse verified {profPlural.toLowerCase()} in {cityDisplay}. View their services, read about their work, and book appointments directly.
            </p>

            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Shield className="h-3.5 w-3.5" /> Verified Professionals
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Star className="h-3.5 w-3.5" /> Instant Booking
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <MapPin className="h-3.5 w-3.5" /> {cityDisplay}
              </Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 py-10">
          {/* About section for SEO */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Find a {profDisplay} in {cityDisplay}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              Looking for a trusted {profDisplay.toLowerCase()} in {cityDisplay}? CardPilot connects you with local
              {" "}{profPlural.toLowerCase()} who are ready to help. Browse their profiles, view services and pricing,
              and book your appointment online — no phone calls needed.
            </p>
          </section>

          {/* Results */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${listings?.length ?? 0} ${profPlural.toLowerCase()} found`}
              </span>
            </div>

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
              <div className="text-center py-20 bg-card rounded-xl border border-border/60">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No {profPlural.toLowerCase()} listed in {cityDisplay} yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Are you a {profDisplay.toLowerCase()} in {cityDisplay}? Create your free CardPilot profile and start getting leads.
                </p>
                <Button asChild>
                  <Link to="/auth">
                    Create Your Profile <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* FAQ for SEO */}
          <section className="mt-16 pt-10 border-t border-border/40">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <h3 className="font-medium text-foreground mb-1.5">
                  How do I book a {profDisplay.toLowerCase()} in {cityDisplay}?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click on any listing above to view their full profile, then use the "Book" button to schedule an appointment at a time that works for you.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1.5">
                  Is it free to browse {profPlural.toLowerCase()}?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Yes, browsing and booking through CardPilot is completely free for customers. No account required.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1.5">
                  Are {profPlural.toLowerCase()} on CardPilot verified?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All professionals create their own profiles and manage their availability. We encourage users to review profiles and services before booking.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1.5">
                  I'm a {profDisplay.toLowerCase()} — how do I get listed?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign up for a free CardPilot account, set up your digital business card, and you'll automatically appear in the marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <Link to="/" className="text-primary hover:underline">CardPilot</Link> — the smart business card platform that helps local businesses get more customers.
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
