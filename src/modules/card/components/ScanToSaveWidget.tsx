import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Loader2, ScanLine, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { captureLead } from "@/lib/captureLead";
import { toast } from "sonner";

interface Props {
  ownerId: string;
  handle: string;
  palette: { primary: string; secondary: string; accent?: string; background: string };
  fonts: { primary: string; secondary: string };
  radii: { card: number | string; button: number | string };
  onSuccess?: () => void;
}

type Step = "idle" | "scanning" | "review" | "done";

interface ExtractedContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  website?: string;
  address?: string;
  notes?: string;
}

export default function ScanToSaveWidget({ ownerId, handle, palette, fonts, radii, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [contact, setContact] = useState<ExtractedContact>({ name: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (base64: string) => {
    setStep("scanning");
    try {
      // Use the public (no-auth) edge function so unauthenticated visitors can scan
      const { data, error } = await supabase.functions.invoke("scan-business-card-public", {
        body: { image: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContact(data.contact);
      setStep("review");
    } catch (err: any) {
      toast.error(err.message || "Failed to scan card");
      setStep("idle");
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => processImage(reader.result as string);
    reader.readAsDataURL(file);
  }, [processImage]);

  const handleSave = async () => {
    if (!contact.name?.trim()) return;
    setSaving(true);
    try {
      const noteParts = [
        contact.job_title && `Title: ${contact.job_title}`,
        contact.website && `Website: ${contact.website}`,
        contact.address && `Address: ${contact.address}`,
        contact.notes,
      ].filter(Boolean).join("\n");

      await captureLead({
        ownerId,
        name: contact.name.trim(),
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() || null,
        source: "business_card",
        activityType: "card_scanned",
        activityTitle: `Business card scanned: ${contact.name.trim()}`,
        activityDescription: noteParts || null,
        handle,
        metaJson: {
          company: contact.company || "",
          job_title: contact.job_title || "",
          scan_source: "public_card",
        },
      });

      setStep("done");
      onSuccess?.();
    } catch {
      toast.error("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: radii.button,
    border: `1px solid ${palette.secondary}30`,
    fontSize: 13,
    fontFamily: `'${fonts.secondary}', sans-serif`,
    outline: "none",
    background: "transparent",
    color: palette.primary,
  };

  if (step === "done") {
    return (
      <div style={{ textAlign: "center", padding: 16, borderRadius: radii.card, background: `${palette.primary}10` }}>
        <Check style={{ width: 28, height: 28, color: palette.primary, margin: "0 auto 8px" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: palette.primary, margin: 0 }}>Card saved!</p>
        <p style={{ fontSize: 12, color: palette.secondary, margin: "4px 0 0" }}>Thank you for sharing your info.</p>
        <button
          onClick={() => { setStep("idle"); setContact({ name: "" }); }}
          style={{ fontSize: 12, color: palette.primary, background: "none", border: "none", cursor: "pointer", marginTop: 8, textDecoration: "underline" }}
        >
          Scan another card
        </button>
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 24 }}>
        <Loader2 style={{ width: 18, height: 18, color: palette.primary, animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 13, color: palette.secondary, fontFamily: `'${fonts.secondary}', sans-serif` }}>Reading your card…</span>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: palette.primary, fontFamily: `'${fonts.primary}', sans-serif` }}>Confirm your info</span>
          <button onClick={() => { setStep("idle"); setContact({ name: "" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: palette.secondary }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <input style={inputStyle} placeholder="Name *" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
        <input style={inputStyle} placeholder="Email" value={contact.email || ""} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
        <input style={inputStyle} placeholder="Phone" value={contact.phone || ""} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
        <input style={inputStyle} placeholder="Company" value={contact.company || ""} onChange={(e) => setContact({ ...contact, company: e.target.value })} />
        <button
          onClick={handleSave}
          disabled={saving || !contact.name?.trim()}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: radii.button,
            background: palette.primary,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: saving ? "wait" : "pointer",
            fontFamily: `'${fonts.secondary}', sans-serif`,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Share My Info"}
        </button>
      </div>
    );
  }

  // ── IDLE: Show scan buttons ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <p style={{ fontSize: 12, color: palette.secondary, margin: 0, textAlign: "center", fontFamily: `'${fonts.secondary}', sans-serif` }}>
        Scan your business card to share your contact info
      </p>
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        <button
          onClick={() => cameraRef.current?.click()}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 12px",
            borderRadius: radii.button,
            background: palette.primary,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            fontFamily: `'${fonts.secondary}', sans-serif`,
          }}
        >
          <Camera style={{ width: 16, height: 16 }} />
          <span>Take Photo</span>
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 12px",
            borderRadius: radii.button,
            background: "transparent",
            color: palette.primary,
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${palette.primary}`,
            cursor: "pointer",
            fontFamily: `'${fonts.secondary}', sans-serif`,
          }}
        >
          <Upload style={{ width: 16, height: 16 }} />
          <span>Upload</span>
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
