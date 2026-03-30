import { useState, useRef } from "react";
import { detectBot } from "@/lib/contactProtection";
import { FileText, Upload, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { captureLead, getVisitorMeta } from "@/lib/captureLead";
import { toast } from "sonner";
import CardButton from "./CardButton";
import CardSectionWrapper from "./CardSectionWrapper";
import type { ResolvedCardTheme } from "@/lib/cardTokens";
import type { MetallicEffect } from "./CardThemeEditor";

interface QuoteRequestFormProps {
  theme: ResolvedCardTheme;
  profileId: string;
  handle: string;
  metallicEffect?: MetallicEffect;
  sectionContent?: Record<string, any>;
}

export default function QuoteRequestForm({
  theme,
  profileId,
  handle,
  metallicEffect,
  sectionContent,
}: QuoteRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formLoadTime] = useState(() => Date.now());
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    project_type: "",
    budget: "",
    location: "",
    timeline: "",
    description: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { palette, fonts, radii } = theme;

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: radii.button,
    border: `1px solid ${palette.secondary}30`,
    fontSize: 14,
    fontFamily: `'${fonts.secondary}', sans-serif`,
    outline: "none",
    background: "transparent",
    color: palette.primary,
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: palette.secondary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
    display: "block",
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 5));
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `quote-photos/${profileId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("card-assets").upload(path, photo);
      if (!error) {
        const { data: urlData } = supabase.storage.from("card-assets").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      toast.error("Please enter your email or phone number");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please describe your project");
      return;
    }
    // Bot detection
    const botCheck = detectBot(honeypot, formLoadTime);
    if (botCheck.isBot) {
      setSubmitted(true); // Silently pretend success
      return;
    }
    setSubmitting(true);
    try {
      const visitorMeta = getVisitorMeta();
      const photoUrls = await uploadPhotos();

      const quoteDescription = [
        form.project_type && `Project: ${form.project_type}`,
        form.budget && `Budget: ${form.budget}`,
        form.location && `Location: ${form.location}`,
        form.timeline && `Timeline: ${form.timeline}`,
        form.description && `Details: ${form.description}`,
        photoUrls.length > 0 && `${photoUrls.length} photo(s) attached`,
      ].filter(Boolean).join("\n");

      // Use centralized capture_lead function
      const result = await captureLead({
        ownerId: profileId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        source: "card_form",
        activityType: "quote_requested",
        activityTitle: "Quote request submitted via digital card",
        activityDescription: quoteDescription,
        handle,
        metaJson: visitorMeta,
      });

      const leadId = result?.lead_id;

      // Store quote request details
      if (leadId) {
        await supabase.from("quote_requests" as any).insert({
          user_id: profileId,
          lead_id: leadId,
          project_type: form.project_type || null,
          budget: form.budget || null,
          location: form.location || null,
          timeline: form.timeline || null,
          description: form.description || null,
          photo_urls: photoUrls,
          form_answers: {
            ...form,
            photo_count: photoUrls.length,
          },
        });
      }

      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: radii.card,
          background: `${palette.primary}10`,
          textAlign: "center",
        }}
      >
        <FileText style={{ color: palette.primary, margin: "0 auto 8px", width: 28, height: 28 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: palette.primary, margin: 0 }}>
          ✓ Quote request submitted!
        </p>
        <p style={{ fontSize: 13, color: palette.secondary, margin: "8px 0 0" }}>
          We'll review your request and get back to you soon.
        </p>
      </div>
    );
  }

  const heading = sectionContent?.heading || "Request a Quote";
  const subtitle = sectionContent?.description || "Tell us about your project and we'll get back to you with a quote.";

  return (
    <CardSectionWrapper theme={theme} index={5} metallicEffect={metallicEffect}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 13, color: palette.secondary, margin: 0, lineHeight: 1.5 }}>{subtitle}</p>

        {/* Honeypot */}
        <input
          type="text"
          name="company_website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
        />
        {/* Name */}
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Email & Phone row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Project Type */}
        <div>
          <label style={labelStyle}>Project Type</label>
          <input
            placeholder="e.g. Kitchen renovation, logo design..."
            value={form.project_type}
            onChange={(e) => setForm((f) => ({ ...f, project_type: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Budget & Timeline row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={labelStyle}>Budget</label>
            <input
              placeholder="e.g. $1,000 - $5,000"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Timeline</label>
            <input
              placeholder="e.g. 2 weeks"
              value={form.timeline}
              onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Location</label>
          <input
            placeholder="City, state, or address"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            placeholder="Tell us more about your project..."
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Photo upload */}
        <div>
          <label style={labelStyle}>Photos (optional, up to 5)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddPhotos}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={photos.length >= 5}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: radii.button,
              border: `1px dashed ${palette.secondary}40`,
              background: "transparent",
              color: palette.secondary,
              fontSize: 13,
              cursor: photos.length >= 5 ? "not-allowed" : "pointer",
              opacity: photos.length >= 5 ? 0.5 : 1,
              fontFamily: `'${fonts.secondary}', sans-serif`,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Upload style={{ width: 14, height: 14 }} />
            {photos.length === 0 ? "Upload photos" : `${photos.length}/5 photo(s)`}
          </button>
          {photos.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {photos.map((f, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <CardButton theme={theme} fullWidth metallicEffect={metallicEffect} onClick={handleSubmit}>
          {submitting ? (
            <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
          ) : (
            <Send style={{ width: 16, height: 16 }} />
          )}
          <span>{submitting ? "Submitting..." : "Submit Quote Request"}</span>
        </CardButton>
      </div>
    </CardSectionWrapper>
  );
}
