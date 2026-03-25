/**
 * ModernCardLayout — full-width, demo-style card layout
 * Matches the clean DemoCardPreview look while using real profile data.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone, MessageSquare, Mail, Calendar, Star, MapPin,
  Download, FileText, CheckCircle2, Clock, Globe,
  Instagram, Facebook, Linkedin, Twitter, Youtube,
  Send, X, Play, Image as ImageIcon, Share2, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AvailableNowBadge, ResponseSpeedBadge, RecentViewsBadge } from "@/components/activity/LiveActivityIndicators";
import VerificationBadge from "@/components/trust/VerificationBadge";
import QRShareDialog from "@/modules/card/components/QRShareDialog";
import NFCShareDialog from "@/modules/card/components/NFCShareDialog";
import WalletPassDialog from "@/modules/card/components/WalletPassDialog";
import QuoteRequestForm from "@/modules/card/components/QuoteRequestForm";
import ProjectShowcase from "@/modules/card/components/ProjectShowcase";
import QuoteCalculator from "@/modules/card/components/QuoteCalculator";
import GalleryLightbox from "@/modules/card/components/GalleryLightbox";
import ScanToSaveWidget from "@/modules/card/components/ScanToSaveWidget";
import ReviewForm from "@/modules/public/components/ReviewForm";
import type { ResolvedCardTheme } from "@/lib/cardTokens";
import type { CardSection } from "@/hooks/useCard";
import { getHeroBackgroundForProfession, getHeroBackgroundById } from "@/lib/heroBackgrounds";
import { showsBranding } from "@/lib/plans";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── Booking Modal ── */
function BookingModal({ name, handle, open, onClose }: { name: string; handle: string; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 text-center"
          >
            <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-2">Book with {name}</h3>
            <p className="text-sm text-muted-foreground mb-4">Choose a time that works for you.</p>
            <Link to={`/book/${handle}`}>
              <Button className="w-full gap-2">
                <Calendar className="h-4 w-4" /> Open Booking Page
              </Button>
            </Link>
            <button onClick={onClose} className="mt-3 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Types ── */
export interface ModernCardLayoutProps {
  profile: any;
  card: any;
  theme: ResolvedCardTheme;
  themeJson: Record<string, any>;
  sections: CardSection[];
  enabledSections: Set<string>;
  sectionContent: (id: string) => Record<string, any> | undefined;
  services: any[];
  publicReviews: any[];
  dbProjects: any[];
  recentViewCount: number;
  professionName: string;
  handle: string;
  cardUrl: string;
  isOwner: boolean;
  contactRevealed: boolean;
  setContactRevealed: (v: boolean) => void;
  showReviewForm: boolean;
  setShowReviewForm: (v: boolean) => void;
  formSent: boolean;
  formData: { name: string; phone: string; email: string; message: string };
  setFormData: (f: any) => void;
  honeypot: string;
  setHoneypot: (v: string) => void;
  submitting: boolean;
  handleFormSubmit: () => void;
  handleCtaClick: (cta: string) => void;
  onDownloadVCard: () => void;
  onTrackEvent: (eventType: string, meta?: any) => void;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  website: <Globe className="h-5 w-5" />,
};

export default function ModernCardLayout({
  profile,
  card,
  theme,
  themeJson,
  sections,
  enabledSections,
  sectionContent,
  services,
  publicReviews,
  dbProjects,
  recentViewCount,
  professionName,
  handle,
  cardUrl,
  isOwner,
  contactRevealed,
  setContactRevealed,
  showReviewForm,
  setShowReviewForm,
  formSent,
  formData,
  setFormData,
  honeypot,
  setHoneypot,
  submitting,
  handleFormSubmit,
  handleCtaClick,
  onDownloadVCard,
  onTrackEvent,
}: ModernCardLayoutProps) {
  const [showBooking, setShowBooking] = useState(false);
  const { palette } = theme;
  const coverUrl = themeJson.cover_url as string | undefined;
  const displayJobTitle = (themeJson.job_title as string) || professionName;

  // Resolve hero background for profession-based cover
  const resolvedHero = (() => {
    const savedId = themeJson.heroBackgroundId as string | undefined;
    if (savedId) return getHeroBackgroundById(savedId) ?? null;
    if (!coverUrl) return getHeroBackgroundForProfession(professionName);
    return null;
  })();

  const coverStyle: React.CSSProperties = coverUrl
    ? {}
    : resolvedHero
      ? { background: resolvedHero.gradient }
      : { background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent || palette.primary}cc)` };

  // Card services from section content or DB
  const cardServices = sectionContent("services")?.items as { name: string; description?: string; price?: string }[] | undefined;
  const displayServices = (cardServices && cardServices.length > 0)
    ? cardServices.filter(s => s.name)
    : services.map(s => ({ name: s.name, price: s.price != null ? `$${Number(s.price).toFixed(0)}` : undefined, description: s.description }));

  // Social links
  const socialLinks = sectionContent("social")?.links as { platform: string; url: string }[] | undefined;

  // Testimonials
  const testimonials = sectionContent("testimonials")?.testimonials as { name: string; text: string; role?: string }[] | undefined;

  // Gallery
  const galleryImages = sectionContent("gallery")?.images as { url: string; caption?: string }[] | undefined;

  // Projects
  const projectItems = sectionContent("projects")?.items as { title: string; beforeImage: string; afterImage: string; description?: string }[] | undefined;

  // Video
  const videoContent = sectionContent("video_intro");
  const videoUrl = videoContent?.videoUrl;

  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
    return url;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Draft banner */}
      {isOwner && card?.status !== "published" && (
        <div className="bg-primary text-primary-foreground text-center py-2.5 text-sm font-medium">
          Draft Preview — only you can see this
        </div>
      )}

      <div className="max-w-lg mx-auto pb-20">
        {/* Hero with cover image */}
        <motion.div initial="hidden" animate="visible" variants={fade} className="rounded-b-2xl overflow-visible shadow-xl">
          {/* Cover photo */}
          <div className="relative h-44 overflow-hidden" style={coverStyle}>
            {coverUrl && (
              <>
                <img src={coverUrl} alt={profile.company || ""} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </>
            )}
            {!coverUrl && resolvedHero && (
              <div className="absolute inset-0" style={{ background: resolvedHero.overlay }} />
            )}

            {/* Trust badges in cover — frosted glass overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2 z-10">
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
              {profile.is_on_duty && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  Available Now
                </span>
              )}
            </div>
          </div>

          {/* Profile overlay */}
          <div className="relative bg-card px-5 pb-5 overflow-visible">
            {/* Avatar */}
            <div className="absolute -top-8 left-5">
              <div className="h-16 w-16 rounded-full overflow-hidden ring-4 ring-card shadow-lg">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xl font-bold text-primary-foreground" style={{ background: palette.primary }}>
                    {(profile.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-10">
              <h1 className="text-xl font-extrabold text-foreground">{profile.name || "Your Name"}</h1>
              <p className="text-sm text-muted-foreground font-medium">{profile.company}</p>
              <p className="text-sm mt-1 font-medium" style={{ color: palette.primary }}>
                {displayJobTitle}
              </p>
              {profile.city && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1.5">
                  <MapPin className="h-3 w-3" /> {profile.city}
                </div>
              )}
            </div>
          </div>
        </motion.div>


        {/* CTA buttons — 5-column grid */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-5 gap-2 mx-4 mt-4">
          {[
            { icon: Phone, label: "Call", color: "hsl(var(--success))", onClick: () => handleCtaClick("call") },
            { icon: MessageSquare, label: "Text", color: "hsl(var(--primary))", onClick: () => handleCtaClick("text") },
            { icon: Calendar, label: "Book", color: palette.primary, onClick: () => {
              if (enabledSections.has("booking")) {
                const el = document.getElementById("booking-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                else setShowBooking(true);
              } else setShowBooking(true);
            }},
            { icon: FileText, label: "Estimate", color: "hsl(25, 95%, 53%)", onClick: () => {
              const el = document.getElementById("quote-request-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else handleCtaClick("quote");
            }},
            { icon: Download, label: "Save", color: "hsl(262, 83%, 58%)", onClick: onDownloadVCard },
          ].map((cta) => (
            <motion.button
              key={cta.label}
              variants={fade}
              onClick={cta.onClick}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.95] shadow-sm"
              whileTap={{ scale: 0.93 }}
            >
              <cta.icon className="h-5 w-5" style={{ color: cta.color }} />
              <span className="text-2xs font-medium text-foreground">{cta.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Sharing tools */}
        <div className="flex items-center justify-center gap-2 mx-4 mt-4">
          <QRShareDialog url={cardUrl} name={profile.name || "Contact"} />
          <NFCShareDialog url={cardUrl} name={profile.name || "Contact"} />
          <WalletPassDialog handle={handle} name={profile.name || "Contact"} />
        </div>

        {/* About */}
        {enabledSections.has("about") && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-2">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sectionContent("about")?.text || "Passionate professional dedicated to delivering exceptional results."}
            </p>
          </motion.section>
        )}

        {/* Video Introduction */}
        {enabledSections.has("video_intro") && videoUrl && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">{videoContent?.videoHeading || "Watch"}</h2>
            <div className="rounded-xl overflow-hidden aspect-video">
              <iframe
                src={getEmbedUrl(videoUrl)}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            {videoContent?.videoCaption && (
              <p className="text-xs text-muted-foreground mt-2 text-center">{videoContent.videoCaption}</p>
            )}
          </motion.section>
        )}

        {/* Services */}
        {enabledSections.has("services") && displayServices.length > 0 && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Services</h2>
            <div className="space-y-2">
              {displayServices.map((s: any) => (
                <motion.div
                  key={s.name}
                  variants={fade}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    )}
                  </div>
                  {s.price && (
                    <Badge variant="secondary" className="text-xs font-bold shrink-0 ml-3">
                      {s.price}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Before/After Projects */}
        {enabledSections.has("projects") && projectItems && projectItems.length > 0 && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">{sectionContent("projects")?.heading || "Our Work"}</h2>
            <ProjectShowcase projects={projectItems} theme={theme} baseIndex={15} />
          </motion.section>
        )}

        {/* DB Project Gallery */}
        {dbProjects.length > 0 && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Project Gallery</h2>
            <div className="grid grid-cols-2 gap-3">
              {dbProjects.map((proj: any) => (
                <motion.a
                  key={proj.id}
                  href={`/project/${proj.id}`}
                  variants={fade}
                  className="block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  {(proj.after_image_url || proj.before_image_url) && (
                    <img src={proj.after_image_url || proj.before_image_url} alt={proj.title} loading="lazy" className="w-full h-28 object-cover" />
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-foreground">{proj.title}</p>
                    {proj.location && (
                      <p className="text-2xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {proj.location}
                      </p>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>
        )}

        {/* Quote Calculator */}
        {enabledSections.has("quote_calculator") && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6" id="quote-calculator-section">
            <h2 className="text-lg font-bold text-foreground mb-3">{sectionContent("quote_calculator")?.heading || "Instant Quote"}</h2>
            <QuoteCalculator theme={theme} profileId={profile.id} handle={handle} profession={professionName} />
          </motion.section>
        )}

        {/* Booking */}
        {enabledSections.has("booking") && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6" id="booking-section">
            <Link to={`/book/${handle}`}>
              <Button className="w-full gap-2 h-12 text-base rounded-xl shadow-sm">
                <Calendar className="h-5 w-5" /> {sectionContent("booking")?.bookingHeading || "Book an Appointment"}
              </Button>
            </Link>
          </motion.section>
        )}

        {/* Testimonials */}
        {enabledSections.has("testimonials") && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Testimonials</h2>
            <div className="space-y-3">
              {(testimonials && testimonials.length > 0 ? testimonials : [{ name: "Happy Client", text: "Absolutely amazing experience. Highly recommend!", role: "" }]).map((t, i) => (
                <motion.div key={i} variants={fade} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
                      ))}
                    </div>
                    <span className="text-2xs text-muted-foreground font-medium">{t.name}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">"{t.text}"</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Client Reviews (from DB) */}
        {publicReviews.length > 0 && (() => {
          const avgRating = publicReviews.reduce((s: number, r: any) => s + r.rating, 0) / publicReviews.length;
          return (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-4 mt-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Reviews</h2>
              {/* Summary */}
              <div className="rounded-xl border border-border bg-card p-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= Math.round(avgRating) ? "fill-warning text-warning" : "fill-muted text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-1">{publicReviews.length} reviews</p>
                  </div>
                </div>
              </div>
              {/* Individual reviews */}
              <div className="space-y-3">
                {publicReviews.slice(0, 6).map((review: any) => (
                  <motion.div key={review.id} variants={fade} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-warning text-warning" : "fill-muted text-muted"}`} />
                      ))}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-foreground leading-relaxed italic">"{review.review_text}"</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 font-medium">— {review.reviewer_name}</p>
                  </motion.div>
                ))}
              </div>
              {/* Leave review */}
              {!showReviewForm ? (
                <Button variant="outline" className="w-full mt-3 gap-2" onClick={() => setShowReviewForm(true)}>
                  <Star className="h-4 w-4" /> Leave a Review
                </Button>
              ) : (
                <div className="mt-3 rounded-xl border border-border bg-card p-4">
                  <ReviewForm userId={profile.id} onSuccess={() => setShowReviewForm(false)} />
                </div>
              )}
            </motion.section>
          );
        })()}

        {/* Review form when no reviews but ?review=1 */}
        {publicReviews.length === 0 && showReviewForm && (
          <motion.section variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Leave a Review</h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <ReviewForm userId={profile.id} onSuccess={() => setShowReviewForm(false)} />
            </div>
          </motion.section>
        )}

        {/* Gallery */}
        {enabledSections.has("gallery") && galleryImages && galleryImages.length > 0 && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Gallery</h2>
            <GalleryLightbox images={galleryImages} radii="12px" palette={palette} />
          </motion.section>
        )}

        {/* Social Links */}
        {enabledSections.has("social") && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Connect</h2>
            <div className="flex justify-center gap-3 flex-wrap">
              {(socialLinks && socialLinks.length > 0 ? socialLinks : []).filter((l: any) => l.url).map((link: any, i: number) => (
                <a
                  key={i}
                  href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                  title={link.platform}
                >
                  {SOCIAL_ICONS[link.platform.toLowerCase().replace("/x", "")] || <Globe className="h-5 w-5" />}
                </a>
              ))}
            </div>
          </motion.section>
        )}

        {/* Contact / Lead Capture */}
        {enabledSections.has("contact") && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">{sectionContent("contact")?.heading || "Get in Touch"}</h2>
            {formSent ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <h4 className="font-bold text-foreground mb-1">Message sent!</h4>
                <p className="text-sm text-muted-foreground">We'll be in touch shortly.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                {/* Honeypot */}
                <input type="text" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" className="absolute -left-[9999px] opacity-0 h-0 w-0" />
                <Input placeholder="Your name *" value={formData.name} onChange={(e) => setFormData((f: any) => ({ ...f, name: e.target.value }))} />
                <Input placeholder="Phone number" value={formData.phone} onChange={(e) => setFormData((f: any) => ({ ...f, phone: e.target.value }))} />
                <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData((f: any) => ({ ...f, email: e.target.value }))} />
                <Textarea placeholder="Message (optional)" rows={3} value={formData.message} onChange={(e) => setFormData((f: any) => ({ ...f, message: e.target.value }))} />
                <Button className="w-full gap-2" onClick={handleFormSubmit} disabled={submitting}>
                  <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            )}
          </motion.section>
        )}

        {/* Quote Request */}
        {enabledSections.has("quote_request") && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6" id="quote-request-section">
            <h2 className="text-lg font-bold text-foreground mb-3">{sectionContent("quote_request")?.heading || "Request a Quote"}</h2>
            <QuoteRequestForm theme={theme} profileId={profile.id} handle={handle} sectionContent={sectionContent("quote_request")} />
          </motion.section>
        )}

        {/* Scan to Save */}
        {themeJson.scan_to_save === true && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Scan Your Card</h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <ScanToSaveWidget ownerId={profile.id} handle={handle} palette={palette} fonts={theme.fonts} radii={theme.radii} />
            </div>
          </motion.section>
        )}

        {/* Contact info (protected) */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-6">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {profile.phone && (
              <a
                href={contactRevealed ? `tel:${profile.phone}` : "#"}
                onClick={(e) => {
                  if (!contactRevealed) {
                    e.preventDefault();
                    setContactRevealed(true);
                    onTrackEvent("button_click", { action: "reveal_contact" });
                  }
                }}
                className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                {contactRevealed ? profile.phone : "••• ••• ••••"}
                {!contactRevealed && <span className="text-xs text-primary font-medium">Tap to reveal</span>}
              </a>
            )}
            {profile.email && (
              <a
                href={contactRevealed ? `mailto:${profile.email}` : "#"}
                onClick={(e) => {
                  if (!contactRevealed) {
                    e.preventDefault();
                    setContactRevealed(true);
                    onTrackEvent("button_click", { action: "reveal_contact" });
                  }
                }}
                className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                {contactRevealed ? profile.email : "•••@•••.com"}
                {!contactRevealed && <span className="text-xs text-primary font-medium">Tap to reveal</span>}
              </a>
            )}
          </div>
        </motion.section>

        {/* Save Contact button */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fade} className="mx-4 mt-4">
          <Button variant="outline" className="w-full gap-2 h-11 rounded-xl" onClick={onDownloadVCard}>
            <Download className="h-4 w-4" /> Save Contact
          </Button>
          <p className="text-2xs text-muted-foreground text-center mt-1.5">Downloads .vcf to your phone</p>
        </motion.section>

        {/* Powered by */}
        {showsBranding((profile as any)?.plan ?? "free") && (
          <div className="text-center mt-8 space-y-1">
            <a
              href={`/?ref=card&from=${handle}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onTrackEvent("button_click", { cta: "powered_by_footer", referrer_handle: handle })}
            >
              Powered by <span className="text-primary font-extrabold">guzzl</span><span className="font-normal">.pro</span>
            </a>
            <p className="text-2xs text-muted-foreground">
              <a href={`/auth?ref=card&from=${handle}`} className="text-primary font-medium hover:underline"
                onClick={() => onTrackEvent("button_click", { cta: "create_your_own", referrer_handle: handle })}
              >
                Create your own smart business card →
              </a>
            </p>
          </div>
        )}
      </div>

      <BookingModal name={profile.name || ""} handle={handle} open={showBooking} onClose={() => setShowBooking(false)} />
    </div>
  );
}
