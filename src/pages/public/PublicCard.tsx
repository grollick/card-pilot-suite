import {
  Phone,
  MessageSquare,
  Mail,
  Download,
  MapPin,
  Star,
  Send,
  Calendar,
  FileText,
  Globe,
  Loader2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { usePublicCard, CTA_TYPES, type CardSection } from "@/hooks/useCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadVCard } from "@/lib/vcard";

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
import QRShareDialog from "@/components/card/QRShareDialog";
import NFCShareDialog from "@/components/card/NFCShareDialog";
import WalletPassDialog from "@/components/card/WalletPassDialog";

const CTA_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4 mr-1.5" />,
  text: <MessageSquare className="h-4 w-4 mr-1.5" />,
  email: <Mail className="h-4 w-4 mr-1.5" />,
  book: <Calendar className="h-4 w-4 mr-1.5" />,
  quote: <FileText className="h-4 w-4 mr-1.5" />,
  vcard: <Download className="h-4 w-4 mr-1.5" />,
  website: <Globe className="h-4 w-4 mr-1.5" />,
};

export default function PublicCard() {
  const { handle } = useParams();
  
  const { data, isLoading, isError } = usePublicCard(handle);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const viewTracked = useRef(false);

  const profile = data?.profile;

  // Track card view once — fire-and-forget, non-blocking
  useEffect(() => {
    if (!handle || !profile?.id || viewTracked.current) return;
    viewTracked.current = true;
    // Use requestIdleCallback to defer analytics after paint
    const track = () => {
      const meta = getVisitorMeta();
      supabase
        .from("analytics_events")
        .insert({
          user_id: profile.id,
          handle,
          event_type: "card_view" as const,
          meta_json: meta,
        })
        .then();
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(track);
    } else {
      setTimeout(track, 100);
    }
  }, [handle, profile?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

  const { card, services } = data;
  const sections: CardSection[] =
    card && Array.isArray(card.sections_json) ? (card.sections_json as unknown as CardSection[]) : [];
  const enabledSections = new Set(sections.filter((s) => s.enabled).map((s) => s.id));
  const primaryCta = profile.primary_cta ?? "call";
  const professionName = (profile as any)?.professions?.name ?? "Professional";
  const cardUrl = `${window.location.origin}/${handle}`;

  const handleCtaClick = (cta: string) => {
    // Track analytics
    supabase.from("analytics_events").insert({
      user_id: profile.id,
      handle: handle!,
      event_type: "button_click" as const,
      meta_json: { cta },
    }).then();

    if (cta === "call" && profile.phone) window.location.href = `tel:${profile.phone}`;
    else if (cta === "text" && profile.phone) window.location.href = `sms:${profile.phone}`;
    else if (cta === "email" && profile.email) window.location.href = `mailto:${profile.email}`;
    else if (cta === "vcard") {
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

      // 1. Find "New Lead" pipeline stage for this card owner
      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("user_id", profile.id)
        .order("sort_order", { ascending: true })
        .limit(1);
      const firstStageId = stages?.[0]?.id ?? null;

      // 2. Create lead with stage + source metadata
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

      // 3. Log activity on the new lead
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

      // 4. Track analytics
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

  // Secondary CTAs (exclude primary)
  const secondaryCtas = ["call", "text", "email", "vcard"].filter((c) => c !== primaryCta);

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg">
          {/* Header */}
          <div className="h-36 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent relative">
            <div className="absolute -bottom-12 left-6">
              <div className="h-24 w-24 rounded-2xl bg-card border-4 border-card shadow-card flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  (profile.name || "U")[0].toUpperCase()
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pt-14 pb-6 space-y-6">
            {/* Name */}
            {enabledSections.has("hero") && (
              <div>
                <h1 className="text-xl font-bold">{profile.name || "Your Name"}</h1>
                <p className="text-sm text-muted-foreground">{professionName}</p>
                {profile.company && (
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.company}</p>
                )}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button className="shadow-glow" onClick={() => handleCtaClick(primaryCta)}>
                {CTA_ICONS[primaryCta]}
                {CTA_TYPES.find((c) => c.value === primaryCta)?.label ?? "Call"}
              </Button>
              {secondaryCtas.slice(0, 3).map((cta) => (
                <Button key={cta} variant="outline" onClick={() => handleCtaClick(cta)}>
                  {CTA_ICONS[cta]}
                  {CTA_TYPES.find((c) => c.value === cta)?.label ?? cta}
                </Button>
              ))}
            </div>

            {/* Sharing Tools */}
            <div className="flex items-center gap-2 justify-center flex-wrap">
              <QRShareDialog url={cardUrl} name={profile.name || "Contact"} />
              <NFCShareDialog url={cardUrl} name={profile.name || "Contact"} />
              <WalletPassDialog handle={handle!} name={profile.name || "Contact"} />
            </div>

            {/* About */}
            {enabledSections.has("about") && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  About
                </h2>
                <p className="text-sm leading-relaxed">
                  Passionate professional dedicated to delivering exceptional results.
                </p>
              </div>
            )}

            {/* Services */}
            {enabledSections.has("services") && services.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Services
                </h2>
                <div className="space-y-2">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{s.name}</span>
                      {s.price != null && (
                        <span className="text-xs text-muted-foreground">
                          ${Number(s.price).toFixed(0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking */}
            {enabledSections.has("booking") && (
              <Link to={`/book/${handle}`}>
                <Button className="w-full shadow-glow" size="lg">
                  <Calendar className="h-4 w-4 mr-1.5" /> Book an Appointment
                </Button>
              </Link>
            )}

            {/* Testimonials */}
            {enabledSections.has("testimonials") && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Testimonials
                </h2>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/10">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                      />
                    ))}
                  </div>
                  <p className="text-sm italic">
                    "Absolutely amazing experience. Highly recommend!"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">— Happy Client</p>
                </div>
              </div>
            )}

            {/* Lead Capture */}
            {enabledSections.has("contact") && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Get in Touch
                </h2>
                {formSent ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-[hsl(var(--success))]/10 text-center"
                  >
                    <p className="text-sm font-medium text-[hsl(var(--success))]">
                      Message sent! We'll be in touch.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Message (optional)"
                      className="min-h-[60px]"
                      value={formData.message}
                      onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                    />
                    <Button
                      onClick={handleFormSubmit}
                      disabled={submitting || !formData.name}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-1.5" /> Send Message
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-muted-foreground">
                Powered by{" "}
                <span className="font-semibold gradient-text">CardPilot</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
