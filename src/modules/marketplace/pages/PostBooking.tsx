import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Star, ArrowRight, ThumbsUp } from "lucide-react";
import { CustomerViralLoop } from "../components/ViralLoopCards";
import { ReviewForm } from "../components/ReviewForm";
import { useMarketplaceSearch } from "../hooks/useMarketplaceSearch";

export default function PostBooking() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Fetch the business by slug to get business_id
  const { data } = useMarketplaceSearch({ keyword: slug, limit: 1 });
  const biz = data?.results?.[0];

  // Fetch related providers
  const { data: relatedData } = useMarketplaceSearch({ limit: 4 });
  const relatedProviders = (relatedData?.results || []).filter((b) => b.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Thanks for booking! | guzzl.pro</title></Helmet>
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Review Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">How was your experience?</h2>
          </div>

          {biz ? (
            <ReviewForm businessId={biz.business_id} />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          )}
        </section>

        {/* Related Providers */}
        {relatedProviders.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Need another service?</h2>
            <div className="space-y-3">
              {relatedProviders.map((b) => {
                const logoFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(b.business_name.slice(0, 2))}&background=6366f1&color=fff&size=128`;
                return (
                  <button
                    key={b.business_id}
                    onClick={() => navigate(`/marketplace/${b.slug}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow text-left"
                  >
                    <img src={b.logo_url || logoFallback} alt={b.business_name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.business_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-warning text-warning" /> {Number(b.avg_rating).toFixed(1)} · {b.location_city}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Viral Loop */}
        <CustomerViralLoop />
      </div>
    </div>
  );
}
