import {
  Phone,
  MessageSquare,
  Mail,
  Download,
  Star,
  Send,
  Calendar,
  FileText,
  Globe,
  Loader2,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { usePublicCard, CTA_TYPES, type CardSection } from "@/hooks/useCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadVCard } from "@/lib/vcard";
import {
  resolveCardTheme,
  getGoogleFontsUrl,
  type ResolvedCardTheme,
} from "@/lib/cardTokens";
import CardHeader from "@/components/card/CardHeader";
import CardButton from "@/components/card/CardButton";
import CardSectionWrapper from "@/components/card/CardSectionWrapper";
import QRShareDialog from "@/components/card/QRShareDialog";
import NFCShareDialog from "@/components/card/NFCShareDialog";
import WalletPassDialog from "@/components/card/WalletPassDialog";

// ── Visitor meta for analytics ──
function getVisitorMeta() {
  return {
    referrer: document.referrer || null,
    utm_source: new URLSearchParams(window.location.search).get("utm_source"),
    utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
    utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
    user_agent: navigator.userAgent,
    language: navigator.language,
    screen: `${screen.width}x${screen.height}`,
    timestamp: new Date().toISOString(),
  };
}

const CTA_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  text: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  book: <Calendar className="h-4 w-4" />,
  quote: <FileText className="h-4 w-4" />,
  vcard: <Download className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
};

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  website: <Globe className="h-5 w-5" />,
};

// ── Default palette when no style pack ──
const DEFAULT_PALETTE = {
  primary: "#4361ee",
  secondary: "#6b7280",
  accent: "#7c3aed",
  background: "#ffffff",
};

export default function PublicCard() {
  const { handle } = useParams();
  const { data, isLoading, isError } = usePublicCard(handle);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const viewTracked = useRef(false);

  const profile = data?.profile;

  // ── Resolve theme from style pack ──
  const theme: ResolvedCardTheme = useMemo(() => {
    const tokens = (data?.stylePack?.theme_tokens as Record<string, any>) ?? {};
    const palettes = (data?.stylePack?.default_palettes as any[]) ?? [];
    const palette = palettes[0] ?? DEFAULT_PALETTE;
    return resolveCardTheme(tokens, palette);
  }, [data?.stylePack]);

  // ── Load Google Fonts ──
  const fontsUrl = useMemo(() => {
    const tokens = (data?.stylePack?.theme_tokens as Record<string, any>) ?? {};
    return getGoogleFontsUrl(tokens);
  }, [data?.stylePack]);

  useEffect(() => {
    if (!fontsUrl) return;
    const existing = document.querySelector(`link[href="${fontsUrl}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontsUrl;
    document.head.appendChild(link);
  }, [fontsUrl]);

  // ── Track card view ──
  useEffect(() => {
    if (!handle || !profile?.id || viewTracked.current) return;
    viewTracked.current = true;
    const track = () => {
      supabase
        .from("analytics_events")
        .insert({
          user_id: profile.id,
          handle,
          event_type: "card_view" as const,
          meta_json: getVisitorMeta(),
        })
        .then();
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(track);
    } else {
      setTimeout(track, 100);
    }
  }, [handle, profile?.id]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.palette.background }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.palette.secondary }} />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Card not found</p>
      </div>
    );
  }

  const { card, services } = data!;
  const sections: CardSection[] =
    card && Array.isArray(card.sections_json) ? (card.sections_json as unknown as CardSection[]) : [];
  const enabledSections = new Set(sections.filter((s) => s.enabled).map((s) => s.id));
  const primaryCta = profile.primary_cta ?? "call";
  const professionName = (profile as any)?.professions?.name ?? "Professional";
  const cardUrl = `${window.location.origin}/${handle}`;

  const handleCtaClick = (cta: string) => {
    supabase.from("analytics_events").insert({
      user_id: profile.id,
      handle: handle!,
      event_type: "button_click" as const,
      meta_json: { cta },
    }).then();

    if (cta === "call" && profile.phone) window.location.href = `tel:${profile.phone}`;
    else if (cta === "text" && profile.phone) window.location.href = `sms:${profile.phone}`;
    else if (cta === "email" && profile.email) window.location.href = `mailto:${profile.email}`;
    else if (cta === "book") {
      const bookingSection = document.getElementById("booking-section");
      if (bookingSection) bookingSection.scrollIntoView({ behavior: "smooth" });
    } else if (cta === "vcard") {
      downloadVCard({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        company: profile.company,
        handle: profile.handle,
        profession: professionName,
      });
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name) return;
    setSubmitting(true);
    try {
      const visitorMeta = getVisitorMeta();

      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("user_id", profile.id)
        .order("sort_order", { ascending: true })
        .limit(1);
      const firstStageId = stages?.[0]?.id ?? null;

      const { data: lead } = await supabase
        .from("leads")
        .insert({
          user_id: profile.id,
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.message || null,
          source: "card_form" as const,
          stage_id: firstStageId,
          custom_fields_json: {
            referrer: visitorMeta.referrer,
            utm_source: visitorMeta.utm_source,
            utm_medium: visitorMeta.utm_medium,
            utm_campaign: visitorMeta.utm_campaign,
            device: visitorMeta.user_agent,
            capture_url: window.location.href,
          },
        })
        .select("id")
        .single();

      if (lead?.id) {
        await supabase.from("contact_activities").insert({
          user_id: profile.id,
          lead_id: lead.id,
          activity_type: "form_submitted",
          title: "Contact form submitted via digital card",
          description: formData.message || null,
          occurred_at: new Date().toISOString(),
        });
      }

      await supabase.from("analytics_events").insert({
        user_id: profile.id,
        handle: handle!,
        event_type: "form_submit" as const,
        meta_json: { lead_id: lead?.id, ...visitorMeta },
      });

      setFormSent(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Secondary CTAs
  const secondaryCtas = ["call", "text", "email", "vcard"].filter((c) => c !== primaryCta);

  // Card theme-aware inline styles
  const { palette, fonts, radii, spacing, shadows } = theme;

  const cardContainerStyle: React.CSSProperties = {
    borderRadius: radii.card,
    boxShadow: shadows.card,
    background: palette.background,
    fontFamily: `'${fonts.secondary}', sans-serif`,
    overflow: "hidden",
    maxWidth: 440,
    width: "100%",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: `'${fonts.primary}', sans-serif`,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: palette.secondary,
    marginBottom: 8,
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center p-4 py-8"
      style={{ background: `linear-gradient(135deg, ${palette.primary}08, ${palette.accent}06, ${palette.background})` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={cardContainerStyle}
      >
        {/* ── Header ── */}
        {enabledSections.has("hero") && (
          <CardHeader
            theme={theme}
            name={profile.name || "Your Name"}
            profession={professionName}
            company={profile.company ?? undefined}
            avatarUrl={profile.avatar_url}
          />
        )}

        <div style={{ padding: `${spacing.section}px`, display: "flex", flexDirection: "column", gap: spacing.section }}>
          {/* ── Primary CTA ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <CardButton theme={theme} fullWidth onClick={() => handleCtaClick(primaryCta)}>
              {CTA_ICONS[primaryCta]}
              <span>{CTA_TYPES.find((c) => c.value === primaryCta)?.label ?? "Call"}</span>
            </CardButton>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {secondaryCtas.slice(0, 3).map((cta) => (
                <button
                  key={cta}
                  onClick={() => handleCtaClick(cta)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "12px 8px",
                    borderRadius: radii.button,
                    border: `1px solid ${palette.primary}20`,
                    background: `${palette.primary}06`,
                    color: palette.primary,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: `'${fonts.secondary}', sans-serif`,
                    transition: "all 0.2s",
                  }}
                >
                  {CTA_ICONS[cta]}
                  {CTA_TYPES.find((c) => c.value === cta)?.label ?? cta}
                </button>
              ))}
            </div>
          </div>

          {/* ── Sharing Tools ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <QRShareDialog url={cardUrl} name={profile.name || "Contact"} />
            <NFCShareDialog url={cardUrl} name={profile.name || "Contact"} />
            <WalletPassDialog handle={handle!} name={profile.name || "Contact"} />
          </div>

          {/* ── About ── */}
          {enabledSections.has("about") && (
            <CardSectionWrapper theme={theme}>
              <p style={sectionTitleStyle}>About</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: palette.secondary, margin: 0 }}>
                Passionate professional dedicated to delivering exceptional results.
              </p>
            </CardSectionWrapper>
          )}

          {/* ── Services ── */}
          {enabledSections.has("services") && services.length > 0 && (
            <div>
              <p style={sectionTitleStyle}>Services</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {services.map((s) => (
                  <CardSectionWrapper key={s.id} theme={theme}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: palette.primary }}>
                        {s.name}
                      </span>
                      {s.price != null && (
                        <span style={{ fontSize: 13, color: palette.secondary }}>
                          ${Number(s.price).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </CardSectionWrapper>
                ))}
              </div>
            </div>
          )}

          {/* ── Booking ── */}
          {enabledSections.has("booking") && (
            <div id="booking-section">
              <Link to={`/book/${handle}`} style={{ textDecoration: "none" }}>
                <CardButton theme={theme} fullWidth>
                  <Calendar className="h-4 w-4" />
                  <span>Book an Appointment</span>
                </CardButton>
              </Link>
            </div>
          )}

          {/* ── Testimonials ── */}
          {enabledSections.has("testimonials") && (
            <div>
              <p style={sectionTitleStyle}>Testimonials</p>
              <CardSectionWrapper theme={theme}>
                <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      style={{ fill: "#f59e0b", color: "#f59e0b" }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: 14, fontStyle: "italic", color: palette.secondary, margin: 0, lineHeight: 1.6 }}>
                  "Absolutely amazing experience. Highly recommend!"
                </p>
                <p style={{ fontSize: 12, color: `${palette.secondary}99`, marginTop: 8, margin: 0, marginBlockStart: 8 }}>
                  — Happy Client
                </p>
              </CardSectionWrapper>
            </div>
          )}

          {/* ── Social Links ── */}
          {enabledSections.has("social") && (
            <div>
              <p style={sectionTitleStyle}>Connect</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                {["instagram", "facebook", "linkedin", "twitter"].map((platform) => (
                  <button
                    key={platform}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: theme.button.shape === "pill" ? "9999px" : radii.button,
                      border: `1px solid ${palette.primary}20`,
                      background: `${palette.primary}08`,
                      color: palette.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => toast.info(`${platform} link not configured yet`)}
                  >
                    {SOCIAL_ICONS[platform]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Contact / Lead Capture ── */}
          {enabledSections.has("contact") && (
            <div>
              <p style={sectionTitleStyle}>Get in Touch</p>
              {formSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: 20,
                    borderRadius: radii.card,
                    background: `${palette.primary}10`,
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 600, color: palette.primary, margin: 0 }}>
                    ✓ Message sent! We'll be in touch.
                  </p>
                </motion.div>
              ) : (
                <CardSectionWrapper theme={theme}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input
                      placeholder="Your name *"
                      value={formData.name}
                      onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                      style={{
                        padding: "10px 14px",
                        borderRadius: radii.button,
                        border: `1px solid ${palette.secondary}30`,
                        fontSize: 14,
                        fontFamily: `'${fonts.secondary}', sans-serif`,
                        outline: "none",
                        background: "transparent",
                        color: palette.primary,
                      }}
                    />
                    <input
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                      style={{
                        padding: "10px 14px",
                        borderRadius: radii.button,
                        border: `1px solid ${palette.secondary}30`,
                        fontSize: 14,
                        fontFamily: `'${fonts.secondary}', sans-serif`,
                        outline: "none",
                        background: "transparent",
                        color: palette.primary,
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                      style={{
                        padding: "10px 14px",
                        borderRadius: radii.button,
                        border: `1px solid ${palette.secondary}30`,
                        fontSize: 14,
                        fontFamily: `'${fonts.secondary}', sans-serif`,
                        outline: "none",
                        background: "transparent",
                        color: palette.primary,
                      }}
                    />
                    <textarea
                      placeholder="Message (optional)"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                      style={{
                        padding: "10px 14px",
                        borderRadius: radii.button,
                        border: `1px solid ${palette.secondary}30`,
                        fontSize: 14,
                        fontFamily: `'${fonts.secondary}', sans-serif`,
                        outline: "none",
                        resize: "vertical",
                        background: "transparent",
                        color: palette.primary,
                      }}
                    />
                    <CardButton
                      theme={theme}
                      fullWidth
                      onClick={handleFormSubmit}
                    >
                      <Send className="h-4 w-4" />
                      <span>{submitting ? "Sending..." : "Send Message"}</span>
                    </CardButton>
                  </div>
                </CardSectionWrapper>
              )}
            </div>
          )}

          {/* ── Contact Info ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  color: palette.secondary,
                  textDecoration: "none",
                }}
              >
                <Phone className="h-3.5 w-3.5" style={{ color: palette.primary }} />
                {profile.phone}
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  color: palette.secondary,
                  textDecoration: "none",
                }}
              >
                <Mail className="h-3.5 w-3.5" style={{ color: palette.primary }} />
                {profile.email}
              </a>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <p style={{ fontSize: 10, color: `${palette.secondary}80`, margin: 0 }}>
              Powered by{" "}
              <span style={{ fontWeight: 700, color: palette.primary }}>CardPilot</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
