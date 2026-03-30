import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Star, MapPin, Phone, Mail, Globe, ArrowLeft, Clock, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useBusinessReviews, useTrustBadges } from "../hooks/useBusinessReviews";
import { ReviewList, TrustBadges } from "../components/ReviewDisplay";

export default function BusinessProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Fetch business from DB
  const { data: biz, isLoading } = useQuery({
    queryKey: ["business-profile", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*, business_profiles(*)")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ["business-services", biz?.id],
    enabled: !!biz?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", biz!.id)
        .eq("is_active", true);
      return data || [];
    },
  });

  // Fetch reviews
  const { data: reviewData } = useBusinessReviews(biz?.id);
  const avgRating = reviewData?.avgRating || 0;
  const totalReviews = reviewData?.totalReviews || 0;
  const reviews = reviewData?.reviews || [];

  const trustBadges = useTrustBadges(avgRating, totalReviews, biz?.created_at || null);

  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!biz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Business not found.</p>
          <Button onClick={() => navigate("/marketplace")}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const profile = biz.business_profiles?.[0] || biz.business_profiles;
  const logoFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.business_name.slice(0, 2))}&background=6366f1&color=fff&size=128`;

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("business_leads").insert({
        business_id: biz.id,
        full_name: leadForm.name.trim(),
        email: leadForm.email.trim() || null,
        phone: leadForm.phone.trim() || null,
        message: leadForm.message.trim() || null,
        source: "marketplace",
      });
      if (error) throw error;
      toast.success("Quote request sent! They'll get back to you soon.");
      setLeadForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{biz.business_name} | guzzl.pro</title>
        <meta name="description" content={biz.description || ""} />
      </Helmet>

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-muted">
        {biz.cover_image_url && (
          <img src={biz.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10 pb-16">
        {/* Header */}
        <div className="flex items-end gap-4 mb-4">
          <img src={biz.logo_url || logoFallback} alt={biz.business_name} className="w-20 h-20 rounded-2xl border-4 border-background shadow-md object-cover" />
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold text-foreground">{biz.business_name}</h1>
            {profile?.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({totalReviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {biz.location_city}, {biz.location_region}
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        {trustBadges.length > 0 && (
          <div className="mb-6">
            <TrustBadges badges={trustBadges} />
          </div>
        )}

        {/* Primary Actions */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button size="lg" onClick={() => navigate(`/marketplace/${biz.slug}/book`)}>
            <Calendar className="mr-2 h-4 w-4" /> Book Now
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}>
            <MessageSquare className="mr-2 h-4 w-4" /> Request Quote
          </Button>
          {biz.phone && (
            <Button size="lg" variant="outline" asChild>
              <a href={`tel:${biz.phone}`}><Phone className="mr-2 h-4 w-4" /> Call</a>
            </Button>
          )}
        </div>

        {/* About */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground">{biz.description}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            {biz.email && <a href={`mailto:${biz.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="h-3.5 w-3.5" /> {biz.email}</a>}
            {biz.website && <a href={biz.website} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-foreground"><Globe className="h-3.5 w-3.5" /> Website</a>}
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Services */}
        {services && services.length > 0 && (
          <>
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Services</h2>
              <div className="grid gap-3">
                {services.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="font-medium text-foreground">{s.title}</h4>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        {s.price_type === "fixed" && s.price_amount != null && `$${s.price_amount}`}
                        {s.price_type === "starting_at" && s.price_amount != null && `From $${s.price_amount}`}
                        {(s.price_type === "quote_only" || s.price_amount == null) && "Get Quote"}
                      </span>
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
                    <div className="flex items-center justify-between">
                      {s.duration_minutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> ~{s.duration_minutes} min
                        </span>
                      )}
                      <Button size="sm" onClick={() => navigate(`/marketplace/${biz.slug}/book?service=${s.id}`)}>
                        Book This Service
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <Separator className="mb-8" />
          </>
        )}

        {/* Lead Form */}
        <section id="lead-form" className="mb-8 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground mb-4">Request a Quote</h2>
          <form onSubmit={handleLeadSubmit} className="grid sm:grid-cols-2 gap-3 max-w-lg">
            <Input placeholder="Full name *" required value={leadForm.name} onChange={(e) => setLeadForm((p) => ({ ...p, name: e.target.value }))} />
            <Input type="email" placeholder="Email" value={leadForm.email} onChange={(e) => setLeadForm((p) => ({ ...p, email: e.target.value }))} />
            <Input type="tel" placeholder="Phone" value={leadForm.phone} onChange={(e) => setLeadForm((p) => ({ ...p, phone: e.target.value }))} />
            <div className="sm:col-span-2">
              <Textarea placeholder="Tell us about your project…" rows={3} value={leadForm.message} onChange={(e) => setLeadForm((p) => ({ ...p, message: e.target.value }))} />
            </div>
            <Button type="submit" disabled={submitting} className="sm:col-span-2">
              {submitting ? "Sending…" : "Request Quote"}
            </Button>
          </form>
        </section>

        <Separator className="mb-8" />

        {/* Reviews */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Reviews</h2>
          <ReviewList reviews={reviews} avgRating={avgRating} totalReviews={totalReviews} />
        </section>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <Button variant="link" onClick={() => navigate("/marketplace")}>
            ← Explore other services near you
          </Button>
        </div>
      </div>
    </div>
  );
}
