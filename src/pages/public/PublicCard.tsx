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
  User,
  Briefcase,
  Image,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { usePublicCard, CTA_TYPES, type CardSection } from "@/hooks/useCard";
import { usePublicReviews } from "@/hooks/useReviews";
import ReviewForm from "@/components/public/ReviewForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadVCard } from "@/lib/vcard";
import {
  resolveCardTheme,
  getGoogleFontsUrl,
  type ResolvedCardTheme,
} from "@/lib/cardTokens";
import CardHeader from "@/components/card/CardHeader";
import { getPatternSvg } from "@/components/card/CardThemeEditor";
import CardButton from "@/components/card/CardButton";
import CardSectionWrapper from "@/components/card/CardSectionWrapper";
import QRShareDialog from "@/components/card/QRShareDialog";
import NFCShareDialog from "@/components/card/NFCShareDialog";
import WalletPassDialog from "@/components/card/WalletPassDialog";
import QuoteRequestForm from "@/components/card/QuoteRequestForm";
import SmartEngagementPopup from "@/components/card/SmartEngagementPopup";
import { showsBranding } from "@/lib/plans";

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

// ── Promotion Banner Component ──
function PromoBanner({ userId, palette, fonts }: { userId: string; palette: any; fonts: any }) {
  const [promo, setPromo] = useState<any>(null);
  useEffect(() => {
    supabase
      .from("promotions")
      .select("title, description, badge_text, discount_text, expires_at")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const p = data[0];
          if (!p.expires_at || new Date(p.expires_at) > new Date()) {
            setPromo(p);
          }
        }
      });
  }, [userId]);

  if (!promo) return null;

  return (
    <div
      style={{
        background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent || palette.primary})`,
        color: "#fff",
        padding: "10px 16px",
        fontFamily: `'${fonts.secondary}', sans-serif`,
        textAlign: "center",
        position: "relative",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        {promo.badge_text && (
          <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {promo.badge_text}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600 }}>{promo.discount_text || promo.title}</span>
      </div>
      {promo.description && (
        <p style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>{promo.description}</p>
      )}
    </div>
  );
}

export default function PublicCard() {
  const { handle } = useParams();
  const { user } = useAuth();
  const { data, isLoading, isError } = usePublicCard(handle);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(() => new URLSearchParams(window.location.search).get("review") === "1");
  const viewTracked = useRef(false);

  const profile = data?.profile;

  // ── Resolve theme from style pack ──
  const theme: ResolvedCardTheme = useMemo(() => {
    const tokens = (data?.stylePack?.theme_tokens as Record<string, any>) ?? {};
    const palettes = (data?.stylePack?.default_palettes as any[]) ?? [];
    const basePalette = palettes[0] ?? DEFAULT_PALETTE;
    const themeJson = (data?.card?.theme_json ?? {}) as Record<string, any>;
    // User overrides from card builder theme editor take priority
    const palette = themeJson.palette
      ? { ...basePalette, ...themeJson.palette }
      : basePalette;
    // Merge custom fonts into tokens
    let mergedTokens = { ...tokens };
    if (themeJson.fonts) {
      mergedTokens = { ...mergedTokens, fontPrimary: themeJson.fonts.primary, fontSecondary: themeJson.fonts.secondary };
    }
    // Merge card style token overrides
    if (themeJson.tokens) {
      const t = themeJson.tokens;
      if (t.button) mergedTokens = { ...mergedTokens, button: { ...(mergedTokens.button ?? {}), ...t.button } };
      if (t.header) mergedTokens = { ...mergedTokens, header: { ...(mergedTokens.header ?? {}), ...t.header } };
      if (t.section) mergedTokens = { ...mergedTokens, section: { ...(mergedTokens.section ?? {}), ...t.section } };
      if (t.spacingScale) mergedTokens = { ...mergedTokens, spacingScale: t.spacingScale };
      if (t.shadow) mergedTokens = { ...mergedTokens, shadow: { ...(mergedTokens.shadow ?? {}), ...t.shadow } };
      if (t.radius) mergedTokens = { ...mergedTokens, radius: { ...(mergedTokens.radius ?? {}), ...t.radius } };
    }
    return resolveCardTheme(mergedTokens, palette);
  }, [data?.stylePack, data?.card?.theme_json]);

  // ── Load Google Fonts ──
  const fontsUrl = useMemo(() => {
    const tokens = (data?.stylePack?.theme_tokens as Record<string, any>) ?? {};
    const themeJson = (data?.card?.theme_json ?? {}) as Record<string, any>;
    const mergedTokens = themeJson.fonts
      ? { ...tokens, fontPrimary: themeJson.fonts.primary, fontSecondary: themeJson.fonts.secondary }
      : tokens;
    return getGoogleFontsUrl(mergedTokens);
  }, [data?.stylePack, data?.card?.theme_json]);

  useEffect(() => {
    if (!fontsUrl) return;
    const existing = document.querySelector(`link[href="${fontsUrl}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontsUrl;
    document.head.appendChild(link);
  }, [fontsUrl]);

  // ── Track card view via edge function (enriches with geo/device data + sends notification) ──
  useEffect(() => {
    if (!handle || !profile?.id || viewTracked.current) return;
    viewTracked.current = true;
    const track = () => {
      supabase.functions.invoke("track-card-view", {
        body: {
          user_id: profile.id,
          handle,
          meta: getVisitorMeta(),
        },
      }).catch(() => {
        // Fallback: direct insert if edge function fails
        supabase
          .from("analytics_events")
          .insert({
            user_id: profile.id,
            handle,
            event_type: "card_view" as const,
            meta_json: getVisitorMeta(),
          })
          .then();
      });
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
  const isOwner = user?.id === profile.id;
  const isUnpublished = !card || card.status !== "published";

  // Non-owners cannot see unpublished cards
  if (isUnpublished && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">This card is not published yet</p>
      </div>
    );
  }
  const sections: CardSection[] =
    card && Array.isArray(card.sections_json) ? (card.sections_json as unknown as CardSection[]) : [];
  const enabledSections = new Set(sections.filter((s) => s.enabled).map((s) => s.id));
  const sectionContent = (id: string) => sections.find((s) => s.id === id)?.content as Record<string, any> | undefined;
  const professionName = (profile as any)?.professions?.name ?? "Professional";
  const cardUrl = `${window.location.origin}/${handle}`;
  const themeJson = (card?.theme_json ?? {}) as Record<string, any>;
  const displayJobTitle = (themeJson.job_title as string) || professionName;
  const coverUrl = themeJson.cover_url as string | undefined;
  const showSectionIcons = themeJson.section_icons === true;
  const metallicEffect = themeJson.metallicEffect as import("@/components/card/CardThemeEditor").MetallicEffect | undefined;

  // CTA config from theme_json or fallback to legacy primary_cta
  type CtaItem = { id: string; label: string; enabled: boolean; isPrimary: boolean };
  const ctaConfig: CtaItem[] = themeJson.cta_config && Array.isArray(themeJson.cta_config)
    ? (themeJson.cta_config as CtaItem[])
    : [
        { id: profile.primary_cta ?? "call", label: CTA_TYPES.find(c => c.value === (profile.primary_cta ?? "call"))?.label ?? "Call", enabled: true, isPrimary: true },
        ...["call", "text", "email", "vcard"]
          .filter(c => c !== (profile.primary_cta ?? "call"))
          .map(c => ({ id: c, label: CTA_TYPES.find(ct => ct.value === c)?.label ?? c, enabled: true, isPrimary: false })),
      ];
  const enabledCtas = ctaConfig.filter(c => c.enabled);
  const primaryCtaItem = enabledCtas.find(c => c.isPrimary) || enabledCtas[0];
  const secondaryCtaItems = enabledCtas.filter(c => c !== primaryCtaItem);
  const primaryCta = primaryCtaItem?.id ?? "call";
  const ctaIconsOnly = themeJson.cta_icons_only === true;
  const socialIconsOnly = themeJson.social_icons_only !== false; // default true
  const socialBtnColor = (themeJson.social_btn_color as string) || "";
  const socialBtnStyle = (themeJson.social_btn_style as string) || "auto";

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
    } else if (cta === "quote") {
      const quoteSection = document.getElementById("quote-request-section");
      if (quoteSection) quoteSection.scrollIntoView({ behavior: "smooth" });
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

      // ── Duplicate detection: match by email or phone ──
      let existingLead: { id: string } | null = null;

      if (formData.email) {
        const { data } = await supabase
          .from("leads")
          .select("id")
          .eq("user_id", profile.id)
          .eq("email", formData.email)
          .limit(1)
          .maybeSingle();
        if (data) existingLead = data;
      }

      if (!existingLead && formData.phone) {
        const { data } = await supabase
          .from("leads")
          .select("id")
          .eq("user_id", profile.id)
          .eq("phone", formData.phone)
          .limit(1)
          .maybeSingle();
        if (data) existingLead = data;
      }

      let leadId: string | undefined;

      if (existingLead) {
        // Update existing lead with latest info
        await supabase
          .from("leads")
          .update({
            name: formData.name,
            ...(formData.phone ? { phone: formData.phone } : {}),
            ...(formData.email ? { email: formData.email } : {}),
            notes: formData.message || undefined,
            custom_fields_json: {
              referrer: visitorMeta.referrer,
              utm_source: visitorMeta.utm_source,
              utm_medium: visitorMeta.utm_medium,
              utm_campaign: visitorMeta.utm_campaign,
              device: visitorMeta.user_agent,
              capture_url: window.location.href,
            },
          })
          .eq("id", existingLead.id);
        leadId = existingLead.id;
      } else {
        // Create new lead
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
          .maybeSingle();
        leadId = lead?.id;
      }

      if (leadId) {
        await supabase.from("contact_activities").insert({
          user_id: profile.id,
          lead_id: leadId,
          activity_type: "form_submitted",
          title: existingLead
            ? "Returning contact submitted card form"
            : "Contact form submitted via digital card",
          description: formData.message || null,
          occurred_at: new Date().toISOString(),
        });
      }

      await supabase.from("analytics_events").insert({
        user_id: profile.id,
        handle: handle!,
        event_type: "form_submit" as const,
        meta_json: { lead_id: leadId, duplicate: !!existingLead, ...visitorMeta },
      });

      // Notify card owner via email (fire-and-forget)
      if (profile.email) {
        supabase.functions.invoke("send-email", {
          body: {
            to: profile.email,
            subject: existingLead
              ? `Returning lead: ${formData.name}`
              : `New lead captured: ${formData.name}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
                <h2 style="color:#4361ee;margin:0 0 16px;">${existingLead ? "Returning Contact" : "New Lead"} from Your Card</h2>
                <p style="color:#374151;margin:0 0 12px;">${existingLead ? "A returning contact" : "Someone new"} just submitted the contact form on your digital card.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:90px;">Name</td><td style="padding:8px 0;color:#111827;font-weight:600;">${formData.name}</td></tr>
                  ${formData.email ? `<tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;color:#111827;">${formData.email}</td></tr>` : ""}
                  ${formData.phone ? `<tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;color:#111827;">${formData.phone}</td></tr>` : ""}
                  ${formData.message ? `<tr><td style="padding:8px 0;color:#6b7280;">Message</td><td style="padding:8px 0;color:#111827;">${formData.message}</td></tr>` : ""}
                </table>
                <a href="${window.location.origin}/app/contacts" style="display:inline-block;padding:10px 20px;background:#4361ee;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px;">View in CRM</a>
                <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">CardPilot — Your digital business card platform</p>
              </div>
            `,
            email_type: "custom",
            lead_id: leadId,
          },
        }).catch(() => {}); // fire-and-forget
      }

      // Schedule automated follow-up sequence (fire-and-forget)
      if (leadId && formData.email) {
        supabase
          .from("profiles")
          .select("followup_enabled")
          .eq("id", profile.id)
          .single()
          .then(({ data: ownerProfile }) => {
            if (!ownerProfile?.followup_enabled) return;
            // Fetch all enabled sequence steps
            supabase
              .from("followup_steps")
              .select("id, step_number, delay_minutes")
              .eq("user_id", profile.id)
              .eq("enabled", true)
              .order("step_number", { ascending: true })
              .then(({ data: steps }) => {
                if (!steps || steps.length === 0) {
                  // Fallback: use legacy single-step from profile
                  supabase.from("profiles")
                    .select("followup_delay_minutes")
                    .eq("id", profile.id)
                    .single()
                    .then(({ data: p }) => {
                      const delayMs = ((p as any)?.followup_delay_minutes || 120) * 60 * 1000;
                      supabase.from("scheduled_followups").insert({
                        user_id: profile.id,
                        lead_id: leadId,
                        trigger_type: "form_submit",
                        recipient_name: formData.name,
                        recipient_email: formData.email,
                        send_at: new Date(Date.now() + delayMs).toISOString(),
                        step_number: 1,
                      } as any).then();
                    });
                  return;
                }
                // Schedule each step
                const inserts = steps.map((step: any) => ({
                  user_id: profile.id,
                  lead_id: leadId,
                  trigger_type: "form_submit",
                  recipient_name: formData.name,
                  recipient_email: formData.email,
                  send_at: new Date(Date.now() + step.delay_minutes * 60 * 1000).toISOString(),
                  step_id: step.id,
                  step_number: step.step_number,
                }));
                supabase.from("scheduled_followups").insert(inserts as any).then();
              });
          });
      }

      setFormSent(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Secondary CTAs (from config)
  const secondaryCtas = secondaryCtaItems.map(c => c.id);

  // Card theme-aware inline styles
  const { palette, fonts, radii, spacing, shadows } = theme;
  const gradientBg = (themeJson as any)?.gradientBg as { enabled: boolean; color2: string; direction: string } | undefined;
  const bgPattern = (themeJson as any)?.bgPattern as { type: string; opacity: number } | undefined;

  const cardBackground = gradientBg?.enabled
    ? `linear-gradient(${gradientBg.direction}, ${palette.background}, ${gradientBg.color2})`
    : palette.background;

  const cardContainerStyle: React.CSSProperties = {
    borderRadius: radii.card,
    boxShadow: shadows.card,
    background: cardBackground,
    fontFamily: `'${fonts.secondary}', sans-serif`,
    overflow: "hidden",
    maxWidth: 440,
    width: "100%",
    position: "relative",
  };

  const SECTION_ICONS: Record<string, LucideIcon> = {
    about: User,
    services: Briefcase,
    testimonials: Star,
    gallery: Image,
    social: Share2,
    contact: Mail,
    quote_request: FileText,
    booking: Calendar,
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

  const SectionTitle = ({ id, label }: { id: string; label: string }) => {
    const Icon = SECTION_ICONS[id];
    return (
      <p style={{ ...sectionTitleStyle, display: "flex", alignItems: "center", gap: 6 }}>
        {showSectionIcons && Icon && <Icon size={14} style={{ opacity: 0.7 }} />}
        {label}
      </p>
    );
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
        {bgPattern?.type && bgPattern.type !== "none" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: (bgPattern as any).coverage === "gaps" ? 0 : 1,
              opacity: bgPattern.opacity,
              backgroundImage: getPatternSvg(bgPattern.type as any, (bgPattern as any).color || palette.secondary),
              backgroundSize: bgPattern.type === "noise" ? "200px 200px" : `${(bgPattern as any).scale ?? 20}px ${(bgPattern as any).scale ?? 20}px`,
            }}
          />
        )}
        {/* Draft preview banner */}
        {isOwner && isUnpublished && (
          <div
            style={{
              background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent || palette.primary})`,
              color: "#fff",
              textAlign: "center",
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: `'${fonts.secondary}', sans-serif`,
              letterSpacing: "0.02em",
            }}
          >
            Draft Preview — only you can see this
          </div>
        )}
        {/* Promotion Banner */}
        <PromoBanner userId={profile.id} palette={palette} fonts={fonts} />
        {/* ── Header ── */}
        {enabledSections.has("hero") && (
          <div style={{ position: "relative", zIndex: 2 }}>
          <CardHeader
            theme={theme}
            name={profile.name || "Your Name"}
            boldLastName={themeJson.bold_last_name === true}
            uppercaseName={themeJson.uppercase_name === true}
            nameLetterSpacing={typeof themeJson.name_letter_spacing === "number" ? themeJson.name_letter_spacing : 0}
            nameFontWeight={typeof themeJson.name_font_weight === "number" ? themeJson.name_font_weight : 700}
            firstNameFontWeight={typeof themeJson.first_name_font_weight === "number" ? themeJson.first_name_font_weight : null}
            nameItalic={themeJson.name_italic === true}
            nameFontSize={typeof themeJson.name_font_size === "number" ? themeJson.name_font_size : null}
            subtitleFontSize={typeof themeJson.subtitle_font_size === "number" ? themeJson.subtitle_font_size : null}
            profession={displayJobTitle}
            company={profile.company ?? undefined}
            avatarUrl={profile.avatar_url}
            coverUrl={coverUrl}
            avatarBgColor={themeJson.avatar_bg_color as string | undefined}
            avatarRotation={themeJson.avatar_rotation as number | undefined}
            avatarBorderWidth={(themeJson.tokens as any)?.header?.avatarBorderWidth ?? 3}
            avatarSize={(themeJson.tokens as any)?.header?.avatarSize ?? 80}
            avatarBannerText={(themeJson.tokens as any)?.header?.avatarBannerText ?? ""}
            avatarBannerBg={(themeJson.tokens as any)?.header?.avatarBannerBg ?? ""}
            avatarBannerPosition={(themeJson.tokens as any)?.header?.avatarBannerPosition ?? "bottom"}
            avatarBannerAnimation={(themeJson.tokens as any)?.header?.avatarBannerAnimation ?? "none"}
            coverOffsetY={themeJson.cover_offset_y as number | undefined}
            logoUrl={themeJson.logo_url as string | undefined}
            logoFrostedBg={themeJson.logo_frosted_bg !== false}
            logoGlow={themeJson.logo_glow === true}
            logoPosition={(themeJson.logo_position as any) ?? "top-right"}
            logoSize={(themeJson.logo_size as any) ?? "medium"}
            logoOpacity={typeof themeJson.logo_opacity === "number" ? (themeJson.logo_opacity as number) : 100}
            logoPadding={typeof themeJson.logo_padding === "number" ? (themeJson.logo_padding as number) : 4}
            logoNameGap={typeof themeJson.logo_name_gap === "number" ? (themeJson.logo_name_gap as number) : 8}
            logoVerticalAlign={(themeJson.logo_vertical_align as any) ?? "center"}
            metallicEffect={metallicEffect}
          />
          </div>
        )}

        <div style={{ padding: `${spacing.section}px`, display: "flex", flexDirection: "column", gap: spacing.section, position: "relative", zIndex: 2 }}>
          {/* ── CTA Buttons ── */}
          {primaryCtaItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ctaIconsOnly ? (
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                {enabledCtas.map((ctaItem) => (
                  <button
                    key={ctaItem.id}
                    onClick={() => handleCtaClick(ctaItem.id)}
                    title={ctaItem.label}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: ctaItem.isPrimary ? palette.primary : "transparent",
                      color: ctaItem.isPrimary ? palette.background : palette.primary,
                      border: ctaItem.isPrimary ? "none" : `1.5px solid ${palette.primary}40`,
                    }}
                  >
                    {CTA_ICONS[ctaItem.id]}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <CardButton theme={theme} fullWidth onClick={() => handleCtaClick(primaryCta)} metallicEffect={metallicEffect}>
                  {CTA_ICONS[primaryCta]}
                  <span>{primaryCtaItem.label}</span>
                </CardButton>

                {secondaryCtaItems.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(secondaryCtaItems.length, 3)}, 1fr)`, gap: 8 }}>
                  {secondaryCtaItems.map((ctaItem) => (
                    <button
                      key={ctaItem.id}
                      onClick={() => handleCtaClick(ctaItem.id)}
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
                      {CTA_ICONS[ctaItem.id]}
                      {ctaItem.label}
                    </button>
                  ))}
                </div>
                )}
              </>
            )}
          </div>
          )}

          {/* ── Sharing Tools ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <QRShareDialog url={cardUrl} name={profile.name || "Contact"} />
            <NFCShareDialog url={cardUrl} name={profile.name || "Contact"} />
            <WalletPassDialog handle={handle!} name={profile.name || "Contact"} />
          </div>

          {/* ── About ── */}
          {enabledSections.has("about") && (
            <CardSectionWrapper theme={theme} index={0} metallicEffect={metallicEffect}>
              <SectionTitle id="about" label="About" />
              <p style={{ fontSize: 14, lineHeight: 1.7, color: palette.secondary, margin: 0 }}>
                {sectionContent("about")?.text || "Passionate professional dedicated to delivering exceptional results."}
              </p>
            </CardSectionWrapper>
          )}

          {/* ── Services ── */}
          {enabledSections.has("services") && (() => {
            const cardServices = sectionContent("services")?.items as { name: string; description?: string; price?: string }[] | undefined;
            const hasCardServices = cardServices && cardServices.length > 0;
            const hasDbServices = services.length > 0;

            if (!hasCardServices && !hasDbServices) return null;

            return (
              <CardSectionWrapper theme={theme} index={1} metallicEffect={metallicEffect}>
                <SectionTitle id="services" label="Services" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {hasCardServices
                    ? cardServices!.filter((s) => s.name).map((s, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: palette.primary }}>{s.name}</span>
                            {s.description && (
                              <p style={{ fontSize: 12, color: palette.secondary, margin: "4px 0 0", opacity: 0.8 }}>{s.description}</p>
                            )}
                          </div>
                          {s.price && (
                            <span style={{ fontSize: 13, color: palette.secondary, fontWeight: 500 }}>{s.price}</span>
                          )}
                        </div>
                      ))
                    : services.map((s) => (
                        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: palette.primary }}>{s.name}</span>
                          {s.price != null && (
                            <span style={{ fontSize: 13, color: palette.secondary }}>${Number(s.price).toFixed(0)}</span>
                          )}
                        </div>
                      ))
                  }
                </div>
              </CardSectionWrapper>
            );
          })()}

          {/* ── Booking ── */}
          {enabledSections.has("booking") && (
            <div id="booking-section">
              <Link to={`/book/${handle}`} style={{ textDecoration: "none" }}>
                <CardButton theme={theme} fullWidth metallicEffect={metallicEffect}>
                  <Calendar className="h-4 w-4" />
                  <span>{sectionContent("booking")?.bookingHeading || "Book an Appointment"}</span>
                </CardButton>
              </Link>
            </div>
          )}

          {/* ── Testimonials ── */}
          {enabledSections.has("testimonials") && (() => {
            const testimonials = sectionContent("testimonials")?.testimonials as { name: string; text: string; role?: string }[] | undefined;
            const hasContent = testimonials && testimonials.length > 0;

            return (
              <div>
                <SectionTitle id="testimonials" label="Testimonials" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {hasContent
                    ? testimonials!.map((t, i) => (
                        <CardSectionWrapper key={i} theme={theme} index={i + 2} metallicEffect={metallicEffect}>
                          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className="h-3.5 w-3.5" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 14, fontStyle: "italic", color: palette.secondary, margin: 0, lineHeight: 1.6 }}>
                            "{t.text}"
                          </p>
                          <p style={{ fontSize: 12, color: `${palette.secondary}99`, margin: 0, marginTop: 8 }}>
                            — {t.name}{t.role ? `, ${t.role}` : ""}
                          </p>
                        </CardSectionWrapper>
                      ))
                    : (
                        <CardSectionWrapper theme={theme} index={2} metallicEffect={metallicEffect}>
                          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 14, fontStyle: "italic", color: palette.secondary, margin: 0, lineHeight: 1.6 }}>
                            "Absolutely amazing experience. Highly recommend!"
                          </p>
                          <p style={{ fontSize: 12, color: `${palette.secondary}99`, margin: 0, marginTop: 8 }}>
                            — Happy Client
                          </p>
                        </CardSectionWrapper>
                      )
                  }
                </div>
              </div>
            );
          })()}

          {/* ── Gallery ── */}
          {enabledSections.has("gallery") && (() => {
            const images = sectionContent("gallery")?.images as { url: string; caption?: string }[] | undefined;
            if (!images || images.length === 0) return null;

            return (
              <div>
                <SectionTitle id="gallery" label="Gallery" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ borderRadius: radii.button, overflow: "hidden" }}>
                      <img
                        src={img.url}
                        alt={img.caption || ""}
                        style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                      />
                      {img.caption && (
                        <p style={{ fontSize: 11, color: palette.secondary, padding: "4px 0", margin: 0, textAlign: "center" }}>
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Social Links ── */}
          {enabledSections.has("social") && (() => {
            const links = sectionContent("social")?.links as { platform: string; url: string }[] | undefined;
            const hasLinks = links && links.length > 0;

            const platformIcon = (platform: string) => {
              const key = platform.toLowerCase().replace("/x", "");
              return SOCIAL_ICONS[key] || <Globe className="h-5 w-5" />;
            };

            const sc = socialBtnColor || palette.primary;
            const socialStyle = ((): React.CSSProperties => {
              const base: React.CSSProperties = {
                borderRadius: theme.button.shape === "pill" ? "9999px" : radii.button,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                textDecoration: "none",
                fontSize: 10,
                fontWeight: 500,
                fontFamily: `'${fonts.secondary}', sans-serif`,
              };
              if (socialBtnStyle === "filled") {
                return { ...base, background: sc, color: palette.background, border: "none" };
              } else if (socialBtnStyle === "outline") {
                return { ...base, background: "transparent", color: sc, border: `2px solid ${sc}` };
              }
              return { ...base, border: `1px solid ${sc}20`, background: `${sc}08`, color: sc };
            })();

            const sizeStyle = (iconOnly: boolean): React.CSSProperties => ({
              width: iconOnly ? 44 : "auto",
              minWidth: iconOnly ? undefined : 64,
              height: iconOnly ? 44 : "auto",
              padding: iconOnly ? 0 : "10px 14px",
              flexDirection: iconOnly ? "row" as const : "column" as const,
              gap: iconOnly ? 0 : 4,
            });

            return (
              <div>
                <SectionTitle id="social" label="Connect" />
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  {hasLinks
                    ? links!.filter((l) => l.url).map((link, i) => (
                        <a
                          key={i}
                          href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...socialStyle, ...sizeStyle(socialIconsOnly) }}
                          title={link.platform}
                        >
                          {platformIcon(link.platform)}
                          {!socialIconsOnly && <span>{link.platform}</span>}
                        </a>
                      ))
                    : ["instagram", "facebook", "linkedin", "twitter"].map((platform) => (
                        <button
                          key={platform}
                          style={{ ...socialStyle, ...sizeStyle(socialIconsOnly) }}
                          onClick={() => toast.info(`${platform} link not configured yet`)}
                        >
                          {SOCIAL_ICONS[platform]}
                          {!socialIconsOnly && <span style={{ textTransform: "capitalize" }}>{platform}</span>}
                        </button>
                      ))
                  }
                </div>
              </div>
            );
          })()}

          {/* ── Contact / Lead Capture ── */}
          {enabledSections.has("contact") && (
            <div>
              <SectionTitle id="contact" label={sectionContent("contact")?.heading || "Get in Touch"} />
              {sectionContent("contact")?.description && (
                <p style={{ fontSize: 13, color: palette.secondary, margin: "0 0 12px", lineHeight: 1.5 }}>
                  {sectionContent("contact")?.description}
                </p>
              )}
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
                <CardSectionWrapper theme={theme} index={4} metallicEffect={metallicEffect}>
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
                      metallicEffect={metallicEffect}
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

          {/* ── Quote Request ── */}
          {enabledSections.has("quote_request") && (
            <div id="quote-request-section">
              <SectionTitle id="quote_request" label={sectionContent("quote_request")?.heading || "Request a Quote"} />
              <QuoteRequestForm
                theme={theme}
                profileId={profile.id}
                handle={handle!}
                metallicEffect={metallicEffect}
                sectionContent={sectionContent("quote_request")}
              />
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

          {/* ── Save Contact Button ── */}
          <button
            onClick={() => {
              supabase.from("analytics_events").insert({
                user_id: profile.id,
                handle: handle!,
                event_type: "contact_saved" as const,
                meta_json: getVisitorMeta(),
              }).then();
              downloadVCard({
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                company: profile.company,
                handle: profile.handle,
                profession: professionName,
              });
            }}
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: theme.button.shape === "pill" ? "9999px" : radii.button,
              border: `1.5px solid ${palette.primary}30`,
              background: `${palette.primary}08`,
              color: palette.primary,
              fontSize: 14,
              fontWeight: 500,
              fontFamily: `'${fonts.secondary}', sans-serif`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${palette.primary}15`;
              e.currentTarget.style.borderColor = `${palette.primary}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${palette.primary}08`;
              e.currentTarget.style.borderColor = `${palette.primary}30`;
            }}
          >
            <Download className="h-4 w-4" />
            <span>Save Contact</span>
          </button>
          <p style={{ fontSize: 11, color: `${palette.secondary}90`, textAlign: "center", marginTop: -2 }}>
            Downloads .vcf to your phone
          </p>

          {showsBranding((profile as any)?.plan ?? "free") && (
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <a
                href="/"
                style={{ fontSize: 10, color: `${palette.secondary}80`, textDecoration: "none" }}
              >
                Powered by{" "}
                <span style={{ fontWeight: 700, color: palette.primary }}>CardPilot</span>
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Smart engagement popup after delay */}
      {!isOwner && (
        <SmartEngagementPopup
          handle={handle!}
          profileName={profile.name ?? ""}
          palette={palette}
          fonts={fonts}
          delaySeconds={8}
          onAction={(action) => {
            if (action === "quote") {
              const el = document.getElementById("quote-request-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            } else if (action === "book") {
              const el = document.getElementById("booking-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            } else if (action === "ask") {
              const el = document.getElementById("contact-form-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else {
                const quote = document.getElementById("quote-request-section");
                if (quote) quote.scrollIntoView({ behavior: "smooth" });
              }
            }
          }}
        />
      )}
    </div>
  );
}
