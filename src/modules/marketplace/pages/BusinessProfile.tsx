import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Star, MapPin, Phone, Mail, Globe, ArrowLeft, Clock, DollarSign, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getBusinessBySlug, type MockService } from "../data/mockData";

function ServiceCard({ svc, onBook }: { svc: MockService; onBook: () => void }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="font-medium text-foreground">{svc.title}</h4>
        <span className="text-sm font-semibold text-primary whitespace-nowrap">
          {svc.price_type === "fixed" && `$${svc.price_amount}`}
          {svc.price_type === "starting_at" && `From $${svc.price_amount}`}
          {svc.price_type === "quote_only" && "Get Quote"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{svc.description}</p>
      <div className="flex items-center justify-between">
        {svc.duration_minutes && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> ~{svc.duration_minutes} min
          </span>
        )}
        <Button size="sm" onClick={onBook}>Book This Service</Button>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function BusinessProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const biz = getBusinessBySlug(slug || "");

  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

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

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Quote request sent! They'll get back to you soon.");
      setLeadForm({ name: "", email: "", phone: "", message: "" });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{biz.business_name} | guzzl.pro</title>
        <meta name="description" content={biz.description} />
      </Helmet>

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-muted">
        <img src={biz.cover_image_url} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10 pb-16">
        {/* Header */}
        <div className="flex items-end gap-4 mb-6">
          <img src={biz.logo_url} alt={biz.business_name} className="w-20 h-20 rounded-2xl border-4 border-background shadow-md object-cover" />
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold text-foreground">{biz.business_name}</h1>
            <p className="text-sm text-muted-foreground">{biz.headline}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{biz.avg_rating}</span>
                <span className="text-muted-foreground">({biz.review_count} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {biz.location_city}, {biz.location_region}
              </div>
            </div>
          </div>
        </div>

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
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Services</h2>
          <div className="grid gap-3">
            {biz.services.map((s) => (
              <ServiceCard key={s.id} svc={s} onBook={() => navigate(`/marketplace/${biz.slug}/book?service=${s.id}`)} />
            ))}
          </div>
        </section>

        <Separator className="mb-8" />

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
          {biz.reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {biz.reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{r.reviewer_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.review_text}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
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
