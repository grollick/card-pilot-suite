import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Loader2, ScanLine, Check, X, RotateCcw } from "lucide-react";
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

type Step = "idle" | "preview" | "ocr_running" | "review" | "saving" | "done";

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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contact, setContact] = useState<ExtractedContact>({ name: "" });
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // File selection → preview only (no auto-OCR)
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setOcrError(null);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setStep("preview");
    // Reset input value so same file/camera can be re-selected
    e.target.value = "";
  }, []);

  const prepareBase64 = useCallback(async (f: File): Promise<string> => {
    const objectUrl = URL.createObjectURL(f);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = objectUrl;
    });
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  // Manual OCR start
  const handleStartOcr = useCallback(async () => {
    if (!file) return;
    setStep("ocr_running");
    setOcrError(null);
    try {
      const base64 = await prepareBase64(file);
      const { data, error } = await supabase.functions.invoke("scan-business-card-public", {
        body: { image: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const extracted = data?.contact;
      if (!extracted || typeof extracted !== "object" || !extracted.name) {
        throw new Error("Could not read this card. Try a clearer photo.");
      }
      setContact({
        name: extracted.name ?? "",
        email: extracted.email ?? "",
        phone: extracted.phone ?? "",
        company: extracted.company ?? "",
        job_title: extracted.job_title ?? "",
        website: extracted.website ?? "",
        address: extracted.address ?? "",
        notes: extracted.notes ?? "",
      });
      setStep("review");
    } catch (err: any) {
      setOcrError(err?.message || "OCR failed");
      setStep("preview");
    }
  }, [file, prepareBase64]);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setContact({ name: "" });
    setOcrError(null);
    setSaving(false);
    setStep("idle");
  }, [previewUrl]);

  const handleSave = useCallback(async () => {
    if (!contact.name?.trim() || saving) return;
    setSaving(true);
    setStep("saving");
    try {
      const noteParts = [
        contact.job_title && `Title: ${contact.job_title}`,
        contact.website && `Website: ${contact.website}`,
        contact.address && `Address: ${contact.address}`,
        contact.notes,
      ].filter(Boolean).join("\n");

      const result = await captureLead({
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

      if (!result) throw new Error("No result returned");

      const patchFields: Record<string, string | null> = {};
      if (contact.company?.trim()) patchFields.company = contact.company.trim();
      if (contact.address?.trim()) patchFields.address = contact.address.trim();
      if (noteParts) patchFields.notes = noteParts;
      if (Object.keys(patchFields).length > 0) {
        await supabase.from("leads").update(patchFields).eq("id", result.lead_id);
      }

      setStep("done");
      onSuccess?.();
    } catch {
      toast.error("Failed to save contact");
      setStep("review");
    } finally {
      setSaving(false);
    }
  }, [contact, saving, ownerId, handle, onSuccess]);

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

  const btnPrimary: React.CSSProperties = {
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
  };

  const btnOutline: React.CSSProperties = {
    ...btnPrimary,
    background: "transparent",
    color: palette.primary,
    border: `1px solid ${palette.primary}`,
  };

  // ── DONE ──
  if (step === "done") {
    return (
      <div style={{ textAlign: "center", padding: 16, borderRadius: radii.card, background: `${palette.primary}10` }}>
        <Check style={{ width: 28, height: 28, color: palette.primary, margin: "0 auto 8px" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: palette.primary, margin: 0 }}>Card saved!</p>
        <p style={{ fontSize: 12, color: palette.secondary, margin: "4px 0 0" }}>Thank you for sharing your info.</p>
        <button type="button" onClick={handleClear}
          style={{ fontSize: 12, color: palette.primary, background: "none", border: "none", cursor: "pointer", marginTop: 8, textDecoration: "underline" }}>
          Scan another card
        </button>
      </div>
    );
  }

  // ── SAVING ──
  if (step === "saving") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 24 }}>
        <Loader2 style={{ width: 18, height: 18, color: palette.primary, animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 13, color: palette.secondary, fontFamily: `'${fonts.secondary}', sans-serif` }}>Saving…</span>
      </div>
    );
  }

  // ── REVIEW ──
  if (step === "review") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: palette.primary, fontFamily: `'${fonts.primary}', sans-serif` }}>Confirm your info</span>
          <button type="button" onClick={handleClear} style={{ background: "none", border: "none", cursor: "pointer", color: palette.secondary }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <input style={inputStyle} placeholder="Name *" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
        <input style={inputStyle} placeholder="Email" value={contact.email || ""} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
        <input style={inputStyle} placeholder="Phone" value={contact.phone || ""} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
        <input style={inputStyle} placeholder="Company" value={contact.company || ""} onChange={(e) => setContact({ ...contact, company: e.target.value })} />
        <button type="button" onClick={handleSave} disabled={saving || !contact.name?.trim()}
          style={{ ...btnPrimary, flex: "unset", width: "100%", opacity: saving ? 0.7 : 1, cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Saving…" : "Share My Info"}
        </button>
      </div>
    );
  }

  // ── OCR RUNNING ──
  if (step === "ocr_running") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        {previewUrl && (
          <img src={previewUrl} alt="Card preview" style={{ width: "100%", borderRadius: radii.card, opacity: 0.6 }} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
          <Loader2 style={{ width: 18, height: 18, color: palette.primary, animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: palette.secondary, fontFamily: `'${fonts.secondary}', sans-serif` }}>Reading your card…</span>
        </div>
      </div>
    );
  }

  // ── PREVIEW ──
  if (step === "preview" && previewUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <img src={previewUrl} alt="Card preview" style={{ width: "100%", borderRadius: radii.card }} />
        {ocrError && (
          <p style={{ fontSize: 12, color: "#dc2626", textAlign: "center", margin: 0 }}>{ocrError}</p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={handleStartOcr} style={btnPrimary}>
            <ScanLine style={{ width: 16, height: 16 }} /> Read Card
          </button>
          <button type="button" onClick={handleClear} style={btnOutline}>
            <RotateCcw style={{ width: 14, height: 14 }} /> Retake
          </button>
        </div>
      </div>
    );
  }

  // ── IDLE ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <p style={{ fontSize: 12, color: palette.secondary, margin: 0, textAlign: "center", fontFamily: `'${fonts.secondary}', sans-serif` }}>
        Scan your business card to share your contact info
      </p>
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        <button type="button" onClick={() => cameraRef.current?.click()} style={btnPrimary}>
          <Camera style={{ width: 16, height: 16 }} /> Take Photo
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} style={btnOutline}>
          <Upload style={{ width: 16, height: 16 }} /> Upload
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
    </div>
  );
}
