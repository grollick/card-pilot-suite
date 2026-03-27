import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { captureLead } from "@/lib/captureLead";

const isoNow = () => new Date().toISOString();
const DRAFT_KEY = "scan_business_card_draft_v3";

type Step = "capture" | "preview" | "ocr_running" | "review" | "saving" | "saved";

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

export default function ScanBusinessCard() {
  const [step, setStep] = useState<Step>("capture");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contact, setContact] = useState<ExtractedContact | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [mountCount, setMountCount] = useState(0);
  const [lastEvent, setLastEvent] = useState("none");
  const mountCountRef = useRef(0);
  const phaseRef = useRef("idle");
  const navigate = useNavigate();

  // Mount counter + rehydrate draft
  useEffect(() => {
    mountCountRef.current += 1;
    setMountCount(mountCountRef.current);

    // Rehydrate persisted draft on mount
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as ExtractedContact;
        if (draft.name) {
          setContact(draft);
          setStep("review");
          phaseRef.current = "review_rehydrated";
        }
      }
    } catch {}
  }, []);

  // Unload detection — only real unloads, not visibilitychange
  useEffect(() => {
    const mark = (evt: string) => {
      setLastEvent(`${phaseRef.current} (${evt}) ${isoNow()}`);
    };
    const onBU = () => mark("beforeunload");
    const onPH = () => mark("pagehide");
    const onVC = () => {
      if (document.visibilityState === "hidden") setLastEvent(`visibility_hidden ${isoNow()}`);
    };

    window.addEventListener("beforeunload", onBU);
    window.addEventListener("pagehide", onPH);
    document.addEventListener("visibilitychange", onVC);
    return () => {
      window.removeEventListener("beforeunload", onBU);
      window.removeEventListener("pagehide", onPH);
      document.removeEventListener("visibilitychange", onVC);
    };
  }, []);

  // Prevent pull-to-refresh
  useEffect(() => {
    const prev = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = "contain";
    document.body.style.overscrollBehaviorY = "contain";
    return () => {
      document.documentElement.style.overscrollBehaviorY = prev;
      document.body.style.overscrollBehaviorY = "";
    };
  }, []);

  // ── File selection → preview only ──
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    phaseRef.current = "file_selected";
    setFile(selected);
    setOcrError(null);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setStep("preview");
    phaseRef.current = "preview_ready";
  }, []);

  // ── Prepare base64 for OCR ──
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

  // ── Manual OCR start ──
  const handleStartOcr = useCallback(async () => {
    if (!file) return;
    setStep("ocr_running");
    setOcrError(null);
    phaseRef.current = "ocr_running";

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

      const draft: ExtractedContact = {
        name: extracted.name ?? "",
        email: extracted.email ?? "",
        phone: extracted.phone ?? "",
        company: extracted.company ?? "",
        job_title: extracted.job_title ?? "",
        website: extracted.website ?? "",
        address: extracted.address ?? "",
        notes: extracted.notes ?? "",
      };

      // Persist BEFORE changing step
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setContact(draft);
      setStep("review");
      phaseRef.current = "review";
    } catch (err: any) {
      setOcrError(err?.message || "OCR failed");
      setStep("preview"); // back to preview, keep image
      phaseRef.current = "ocr_failed";
    }
  }, [file, prepareBase64]);

  // ── Clear everything ──
  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setContact(null);
    setOcrError(null);
    setSaveError(null);
    setSavedLeadId(null);
    setSaving(false);
    setStep("capture");
    phaseRef.current = "idle";
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  }, [previewUrl]);

  // ── Update a contact field and persist ──
  const updateField = useCallback((field: keyof ExtractedContact, value: string) => {
    setContact(prev => {
      const updated = { ...prev!, [field]: value };
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // ── Save Contact ──
  const handleSaveContact = useCallback(async () => {
    if (!contact?.name?.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    setStep("saving");
    phaseRef.current = "saving";

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to save contacts.");

      const noteParts = [
        contact.job_title && `Title: ${contact.job_title}`,
        contact.website && `Website: ${contact.website}`,
        contact.address && `Address: ${contact.address}`,
        contact.notes,
      ].filter(Boolean).join("\n");

      const result = await captureLead({
        ownerId: user.id,
        name: contact.name.trim(),
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() || null,
        source: "business_card",
        activityType: "card_scanned",
        activityTitle: `Business card scanned: ${contact.name.trim()}`,
        activityDescription: noteParts || null,
        metaJson: {
          company: contact.company || "",
          job_title: contact.job_title || "",
          website: contact.website || "",
          address: contact.address || "",
          scan_source: "crm_scanner",
        },
      });

      if (!result) throw new Error("No result returned from save");

      // captureLead DB function doesn't set company/address/notes columns directly — patch them now
      const patchFields: Record<string, string | null> = {};
      if (contact.company?.trim()) patchFields.company = contact.company.trim();
      if (contact.address?.trim()) patchFields.address = contact.address.trim();
      if (noteParts) patchFields.notes = noteParts;

      if (Object.keys(patchFields).length > 0) {
        await supabase.from("leads").update(patchFields).eq("id", result.lead_id);
      }

      // Clear draft only after confirmed save
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      setSavedLeadId(result.lead_id);
      setStep("saved");
      phaseRef.current = "saved";
    } catch (err: any) {
      setSaveError(err?.message || "Could not save contact. Try again.");
      setStep("review"); // back to review, keep data
      phaseRef.current = "save_failed";
    } finally {
      setSaving(false);
    }
  }, [contact, saving]);

  // ── Styles ──
  const panel: React.CSSProperties = {
    border: "1px solid #ccc", borderRadius: 8, padding: 12, marginBottom: 16,
    fontSize: 12, fontFamily: "monospace", background: "#f9f9f9", lineHeight: 1.8,
  };
  const btn = (bg: string, color: string): React.CSSProperties => ({
    width: "100%", padding: "10px 16px", borderRadius: 8, fontSize: 14,
    fontWeight: 600, border: "none", cursor: "pointer", background: bg, color,
  });
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 6,
    border: "1px solid #ccc", fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        📷 Business Card Scanner
      </h1>

      {/* ── Debug Panel ── */}
      <div style={panel}>
        <p style={{ fontWeight: 700, margin: 0 }}>🔍 Debug</p>
        <p style={{ margin: 0 }}>Step: <b>{step}</b> | Mounts: <b>{mountCount}</b></p>
        <p style={{ margin: 0 }}>File: <b>{file ? `${file.name} (${(file.size/1024).toFixed(0)}KB)` : "—"}</b></p>
        <p style={{ margin: 0 }}>Preview: <b>{previewUrl ? "YES ✅" : "NO"}</b></p>
        <p style={{ margin: 0 }}>Draft stored: <b>{contact ? "YES ✅" : "NO"}</b></p>
        <p style={{ margin: 0 }}>Save: <b>{savedLeadId ? `✅ ${savedLeadId}` : saving ? "⏳" : "—"}</b></p>
        <p style={{ margin: 0 }}>Last event: <b>{lastEvent}</b></p>
      </div>

      {/* ── STEP: CAPTURE ── */}
      {step === "capture" && (
        <div style={{ border: "2px dashed #ccc", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 14, marginBottom: 12 }}>Select or capture a business card image</p>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 14 }} />
        </div>
      )}

      {/* ── STEP: PREVIEW (image selected, OCR not started) ── */}
      {step === "preview" && previewUrl && (
        <div>
          <div style={{ background: "#e8f5e9", border: "1px solid #4caf50", borderRadius: 8, padding: 8, textAlign: "center", marginBottom: 8 }}>
            <p style={{ fontWeight: 600, color: "#2e7d32", fontSize: 14, margin: 0 }}>✅ Image captured — ready for OCR</p>
          </div>
          <img src={previewUrl} alt="Card preview" style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd" }} />
          {ocrError && (
            <div style={{ background: "#fbe9e7", border: "1px solid #e53935", borderRadius: 8, padding: 8, marginTop: 8, textAlign: "center" }}>
              <p style={{ color: "#c62828", fontSize: 13, margin: 0 }}>❌ {ocrError}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={handleStartOcr} style={btn("#1976d2", "#fff")}>
              🔍 Start OCR
            </button>
            <button type="button" onClick={handleClear} style={btn("#fff", "#333")}>
              ↩ Retake
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: OCR RUNNING ── */}
      {step === "ocr_running" && (
        <div>
          {previewUrl && (
            <img src={previewUrl} alt="Card preview" style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd", opacity: 0.6 }} />
          )}
          <div style={{ background: "#e3f2fd", border: "1px solid #1976d2", borderRadius: 8, padding: 12, marginTop: 8, textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1565c0", margin: 0 }}>⏳ OCR running…</p>
          </div>
        </div>
      )}

      {/* ── STEP: REVIEW ── */}
      {step === "review" && contact && (
        <div>
          <div style={{ background: "#e8f5e9", border: "1px solid #4caf50", borderRadius: 8, padding: 8, textAlign: "center", marginBottom: 12 }}>
            <p style={{ fontWeight: 600, color: "#2e7d32", fontSize: 14, margin: 0 }}>✅ OCR complete — review & save</p>
          </div>
          {saveError && (
            <div style={{ background: "#fbe9e7", border: "1px solid #e53935", borderRadius: 8, padding: 8, marginBottom: 8, textAlign: "center" }}>
              <p style={{ color: "#c62828", fontSize: 13, margin: 0 }}>❌ {saveError}</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["name", "email", "phone", "company", "job_title", "website", "address", "notes"] as (keyof ExtractedContact)[]).map(field => (
              <div key={field}>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "#555" }}>
                  {field.replace("_", " ")}{field === "name" ? " *" : ""}
                </label>
                <input
                  style={inputStyle}
                  value={contact[field] || ""}
                  onChange={e => updateField(field, e.target.value)}
                  placeholder={field.replace("_", " ")}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={handleSaveContact} style={{ ...btn("#4caf50", "#fff"), opacity: !contact.name?.trim() ? 0.5 : 1 }} disabled={!contact.name?.trim()}>
              💾 Save Contact
            </button>
            <button type="button" onClick={handleClear} style={btn("#fff", "#333")}>
              ↩ Start Over
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: SAVING ── */}
      {step === "saving" && (
        <div style={{ background: "#e3f2fd", border: "1px solid #1976d2", borderRadius: 8, padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1565c0", margin: 0 }}>⏳ Saving contact…</p>
        </div>
      )}

      {/* ── STEP: SAVED ── */}
      {step === "saved" && (
        <div>
          <div style={{ background: "#e8f5e9", border: "1px solid #4caf50", borderRadius: 8, padding: 16, textAlign: "center", marginBottom: 12 }}>
            <p style={{ fontWeight: 700, color: "#2e7d32", fontSize: 16, margin: 0 }}>✅ Contact saved!</p>
            <p style={{ fontSize: 13, color: "#555", margin: "4px 0 0" }}>{contact?.name}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {savedLeadId && (
              <button type="button" onClick={() => navigate(`/app/contacts/${savedLeadId}`)} style={btn("#1976d2", "#fff")}>
                👤 View Contact
              </button>
            )}
            <button type="button" onClick={handleClear} style={btn("#fff", "#333")}>
              📷 Scan Another Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
