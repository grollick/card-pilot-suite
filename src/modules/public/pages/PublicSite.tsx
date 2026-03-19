import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useSiteData } from "@/hooks/useSiteData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Phone, Mail, Calendar, MapPin, Clock, Star, Menu, X,
  ArrowRight, CheckCircle, Users, Loader2, DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "home", label: "Home", hash: "" },
  { id: "services", label: "Services", hash: "#services" },
  { id: "about", label: "About", hash: "#about" },
  { id: "testimonials", label: "Reviews", hash: "#reviews" },
  { id: "contact", label: "Contact", hash: "#contact" },
  { id: "booking", label: "Book Now", hash: "#booking", cta: true },
];

function initials(name: string | null) {
  return (name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function PublicSite() {
  const { handle } = useParams<{ handle: string }>();
  const { data, isLoading, error } = useSiteData(handle);
  const [mobileNav, setMobileNav] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Site not found</h1>
          <p className="text-muted-foreground mb-4">This business doesn't have a website yet.</p>
          <Button asChild variant="outline"><Link to="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  const { profile, services, aiContent } = data;
  const testimonials: any[] = Array.isArray(aiContent?.testimonials) ? aiContent.testimonials : [];
  const sections = Array.isArray(data.card?.sections_json) ? data.card.sections_json : [];
  const gallerySection = sections.find((s: any) => s.id === "gallery" && s.enabled);
  const galleryImages: string[] = gallerySection?.content?.images ?? [];

  const pageTitle = `${profile.name}${profile.company ? ` — ${profile.company}` : ""} | ${profile.profession_name ?? "Professional"}`;
  const metaDesc = profile.bio
    ? profile.bio.slice(0, 155)
    : `${profile.name} is a ${profile.profession_name?.toLowerCase() ?? "professional"}${profile.city ? ` in ${profile.city}` : ""}. View services and book online.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* ─── Sticky Navigation ─── */}
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
            <Link to={`/site/${handle}`} className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(profile.name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm truncate max-w-[140px]">{profile.company || profile.name}</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) =>
                item.cta ? (
                  <Button key={item.id} size="sm" asChild className="ml-2">
                    <a href={`/book/${handle}`}>{item.label}</a>
                  </Button>
                ) : (
                  <a
                    key={item.id}
                    href={`/site/${handle}${item.hash}`}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)}>
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile nav dropdown */}
          {mobileNav && (
            <div className="md:hidden border-t border-border/40 bg-background px-4 pb-4 pt-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={item.cta ? `/book/${handle}` : `/site/${handle}${item.hash}`}
                  className={`block px-3 py-2.5 rounded-md text-sm ${item.cta ? "bg-primary text-primary-foreground font-medium text-center" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                  onClick={() => setMobileNav(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </nav>

        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-primary/3" />
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <motion.div
                className="flex-1 text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {profile.profession_name && (
                  <Badge variant="secondary" className="mb-4 gap-1.5">
                    {profile.profession_name}
                    {profile.city && <><span className="text-muted-foreground/50">·</span> {profile.city}</>}
                  </Badge>
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                  {profile.company || profile.name}
                </h1>
                {profile.bio && (
                  <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button size="lg" asChild>
                    <a href={`/book/${handle}`}>
                      <Calendar className="h-4 w-4 mr-2" /> Book Appointment
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#contact">
                      <Mail className="h-4 w-4 mr-2" /> Get in Touch
                    </a>
                  </Button>
                </div>
              </motion.div>

              {profile.avatar_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <img
                    src={profile.avatar_url}
                    alt={profile.name ?? ""}
                    className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-2xl shadow-2xl border-4 border-background"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Services Section ─── */}
        {services.length > 0 && (
          <section id="services" className="py-16 md:py-24 bg-muted/30">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-3">Our Services</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Professional services tailored to your needs. Book online or request a quote.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((svc, i) => (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="h-full border-border/60 hover:border-primary/30 hover:shadow-lg transition-all">
                      <CardContent className="p-6 flex flex-col h-full">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{svc.name}</h3>
                        {svc.description && (
                          <p className="text-sm text-muted-foreground mb-4 flex-1">{svc.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {svc.price != null && (
                              <span className="flex items-center gap-1 font-semibold text-foreground">
                                <DollarSign className="h-3.5 w-3.5" />{svc.price}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />{svc.duration_min} min
                            </span>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/book/${handle}`}>Book</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── About Section ─── */}
        <section id="about" className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  About {profile.company || profile.name}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {aiContent?.about?.text || profile.bio || `${profile.name} is a dedicated ${profile.profession_name?.toLowerCase() ?? "professional"} committed to delivering excellent service.`}
                </p>
                <div className="space-y-3">
                  {profile.city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> {profile.city}
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" /> {profile.phone}
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary" /> {profile.email}
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { label: "Services", value: services.length.toString(), icon: CheckCircle },
                  { label: "Reviews", value: testimonials.length.toString(), icon: Star },
                  { label: "Experience", value: "Professional", icon: Users },
                  { label: "Booking", value: "Online", icon: Calendar },
                ].map((stat, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-5 text-center">
                      <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Gallery Section ─── */}
        {galleryImages.length > 0 && (
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-foreground text-center mb-10">Our Work</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryImages.slice(0, 6).map((url: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <img
                      src={url}
                      alt={`Work sample ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border border-border/60"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Testimonials Section ─── */}
        {testimonials.length > 0 && (
          <section id="reviews" className={`py-16 md:py-24 ${galleryImages.length > 0 ? "" : "bg-muted/30"}`}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-3">What Customers Say</h2>
                <p className="text-muted-foreground">Real feedback from real customers.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="h-full border-border/60">
                      <CardContent className="p-6">
                        <div className="flex gap-0.5 mb-4">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="h-4 w-4 fill-warning text-warning" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">
                          "{t.text}"
                        </p>
                        <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {(t.name ?? "A")[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t.name}</p>
                            {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Contact Section ─── */}
        <section id="contact" className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Get in Touch</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Have a question or ready to get started? Reach out and we'll get back to you promptly.
                </p>
                <div className="space-y-4">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      {profile.phone}
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      {profile.email}
                    </a>
                  )}
                  {profile.city && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      {profile.city}
                    </div>
                  )}
                </div>
              </div>

              <Card className="border-border/60">
                <CardContent className="p-6">
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Your name" />
                      <Input placeholder="Your email" type="email" />
                    </div>
                    <Input placeholder="Subject" />
                    <Textarea placeholder="Your message…" rows={4} />
                    <Button className="w-full">
                      Send Message <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── Booking CTA Banner ─── */}
        <section id="booking" className="bg-primary text-primary-foreground py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Book?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
              Schedule your appointment online in seconds. Pick a time that works for you.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <a href={`/book/${handle}`}>
                <Calendar className="h-4 w-4 mr-2" /> Book Now
              </a>
            </Button>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-border/40 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials(profile.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{profile.company || profile.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by <Link to="/" className="text-primary hover:underline"><span className="font-extrabold text-primary">guzzl</span>.pro</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
