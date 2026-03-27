import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Loader2, ScanLine, Check, ArrowLeft, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { captureLead } from "@/lib/captureLead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

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
  const navigate = useNavigate();

  // Rehydrate persisted draft on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as ExtractedContact;
        if (draft.name) {
          setContact(draft);
          setStep("review");
        }
      }
    } catch {}
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

  // File selection → preview only
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setOcrError(null);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setStep("preview");
  }, []);

  // Prepare base64 for OCR
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
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setContact(draft);
      setStep("review");
    } catch (err: any) {
      setOcrError(err?.message || "OCR failed");
      setStep("preview");
    }
  }, [file, prepareBase64]);

  // Clear everything
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
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  }, [previewUrl]);

  // Update a contact field and persist
  const updateField = useCallback((field: keyof ExtractedContact, value: string) => {
    setContact(prev => {
      const updated = { ...prev!, [field]: value };
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // Save Contact
  const handleSaveContact = useCallback(async () => {
    if (!contact?.name?.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    setStep("saving");
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

      // Patch company/address/notes directly (capture_lead doesn't set these columns)
      const patchFields: Record<string, string | null> = {};
      if (contact.company?.trim()) patchFields.company = contact.company.trim();
      if (contact.address?.trim()) patchFields.address = contact.address.trim();
      if (noteParts) patchFields.notes = noteParts;
      if (Object.keys(patchFields).length > 0) {
        await supabase.from("leads").update(patchFields).eq("id", result.lead_id);
      }

      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      setSavedLeadId(result.lead_id);
      setStep("saved");
    } catch (err: any) {
      setSaveError(err?.message || "Could not save contact. Try again.");
      setStep("review");
    } finally {
      setSaving(false);
    }
  }, [contact, saving]);

  const FIELD_LABELS: Record<keyof ExtractedContact, string> = {
    name: "Full Name *",
    email: "Email",
    phone: "Phone",
    company: "Company",
    job_title: "Job Title",
    website: "Website",
    address: "Address",
    notes: "Notes",
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/contacts")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Scan Business Card</h1>
          <p className="text-xs text-muted-foreground">Capture a card to add a contact</p>
        </div>
      </div>

      {/* CAPTURE */}
      {step === "capture" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Select or capture a business card</p>
              <p className="text-xs text-muted-foreground mt-1">Take a photo or choose from your gallery</p>
            </div>
            <label className="w-full">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="flex gap-2">
                <Button type="button" className="flex-1 gap-2" onClick={(e) => {
                  const input = (e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement);
                  input?.click();
                }}>
                  <Upload className="h-4 w-4" /> Choose Image
                </Button>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* PREVIEW */}
      {step === "preview" && previewUrl && (
        <div className="space-y-3">
          <img src={previewUrl} alt="Card preview" className="w-full rounded-lg border" />
          {ocrError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
              <p className="text-sm text-destructive">{ocrError}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" onClick={handleStartOcr} className="flex-1 gap-2">
              <ScanLine className="h-4 w-4" /> Read Card
            </Button>
            <Button type="button" variant="outline" onClick={handleClear} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Retake
            </Button>
          </div>
        </div>
      )}

      {/* OCR RUNNING */}
      {step === "ocr_running" && (
        <div className="space-y-3">
          {previewUrl && (
            <img src={previewUrl} alt="Card preview" className="w-full rounded-lg border opacity-60" />
          )}
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-sm font-medium text-muted-foreground">Reading card…</span>
          </div>
        </div>
      )}

      {/* REVIEW */}
      {step === "review" && contact && (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-primary">Review extracted info, then save</p>
          </div>
          {saveError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
              <p className="text-sm text-destructive">{saveError}</p>
            </div>
          )}
          <div className="space-y-3">
            {(Object.keys(FIELD_LABELS) as (keyof ExtractedContact)[]).map(field => (
              <div key={field}>
                <Label className="text-xs">{FIELD_LABELS[field]}</Label>
                <Input
                  value={contact[field] || ""}
                  onChange={e => updateField(field, e.target.value)}
                  placeholder={FIELD_LABELS[field].replace(" *", "")}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={handleSaveContact} className="flex-1" disabled={!contact.name?.trim()}>
              Save Contact
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              Start Over
            </Button>
          </div>
        </div>
      )}

      {/* SAVING */}
      {step === "saving" && (
        <div className="flex items-center justify-center gap-2 py-16">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">Saving contact…</span>
        </div>
      )}

      {/* SAVED */}
      {step === "saved" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Contact saved!</p>
              {contact?.name && <p className="text-sm text-muted-foreground mt-1">{contact.name}</p>}
            </div>
            <div className="flex gap-2 w-full">
              {savedLeadId && (
                <Button type="button" onClick={() => navigate(`/app/contacts/${savedLeadId}`)} className="flex-1">
                  View Contact
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleClear} className="flex-1 gap-2">
                <Camera className="h-4 w-4" /> Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
