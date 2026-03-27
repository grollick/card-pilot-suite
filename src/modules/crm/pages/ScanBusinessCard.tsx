import { useState, useRef, useCallback, useEffect, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Loader2, ArrowLeft, ScanLine, UserPlus, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CONTACT_TYPES = [
  { value: "lead", label: "Lead", description: "Potential customer" },
  { value: "client", label: "Client", description: "Existing customer" },
  { value: "vendor", label: "Vendor", description: "Supplier or service provider" },
  { value: "partner", label: "Partner", description: "Business partner" },
  { value: "personal", label: "Personal", description: "Personal contact" },
  { value: "other", label: "Other", description: "Other contact" },
] as const;

const DRAFT_KEY = "scan_business_card_draft_v3";

interface ExtractedContact {
  name: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  job_title?: string;
  website?: string;
  address?: string;
  notes?: string;
}

type Step = "capture" | "scanning" | "review" | "saved";

const safeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeExtractedContact = (raw: any): ExtractedContact => {
  const firstName = safeString(raw?.first_name || raw?.firstName);
  const lastName = safeString(raw?.last_name || raw?.lastName);
  const fullName = safeString(raw?.full_name || raw?.fullName || raw?.name) || [firstName, lastName].filter(Boolean).join(" ").trim();
  const title = safeString(raw?.title || raw?.job_title || raw?.jobTitle);

  return {
    name: fullName,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email: safeString(raw?.email),
    phone: safeString(raw?.phone),
    company: safeString(raw?.company),
    title,
    job_title: title,
    website: safeString(raw?.website),
    address: safeString(raw?.address),
    notes: safeString(raw?.notes),
  };
};

export default function ScanBusinessCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contact, setContact] = useState<ExtractedContact>({ name: "" });
  const [contactType, setContactType] = useState<string>("lead");
  const [saving, setSaving] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const stepRef = useRef<Step>("capture");
  const savingRef = useRef(false);
  const mountCountRef = useRef(0);
  const [mountCount, setMountCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState({
    draftFound: false,
    draftTimestamp: "",
    rehydrated: false,
    rehydratedFrom: "",
    lastResetBy: "",
    mountedAt: "",
  });

  // Track mounts
  useEffect(() => {
    mountCountRef.current += 1;
    const count = mountCountRef.current;
    setMountCount(count);
    const now = new Date().toISOString().slice(11, 19);
    console.log(`[scan-card-debug] MOUNT #${count} at ${now}`);
    setDebugInfo(prev => ({ ...prev, mountedAt: now }));
  }, []);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  const persistDraft = useCallback((draft: { imagePreview: string | null; contact: ExtractedContact; contactType: string; timestamp?: string }) => {
    try {
      const withTimestamp = { ...draft, timestamp: draft.timestamp || new Date().toISOString() };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(withTimestamp));
      console.log("[scan-card-debug] draft WRITTEN to sessionStorage", DRAFT_KEY);
    } catch (e) {
      console.error("[scan-card-debug] draft write FAILED", e);
    }
  }, []);

  // Rehydration — runs once on mount, restores draft if present
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      console.log("[scan-card-debug] rehydration check — draft present:", !!raw);
      if (!raw) {
        setDebugInfo(prev => ({ ...prev, draftFound: false, rehydrated: false }));
        return;
      }
      const draft = JSON.parse(raw) as {
        imagePreview?: string | null;
        contact?: ExtractedContact;
        contactType?: string;
        timestamp?: string;
      };
      if (!draft.contact) {
        console.log("[scan-card-debug] draft found but no contact data");
        setDebugInfo(prev => ({ ...prev, draftFound: true, rehydrated: false, rehydratedFrom: "no contact in draft" }));
        return;
      }

      const restored = normalizeExtractedContact(draft.contact);
      console.log("[scan-card-debug] REHYDRATING from draft", { restored, timestamp: draft.timestamp });
      setImagePreview(draft.imagePreview ?? null);
      setContact(restored);
      setContactType(draft.contactType ?? "lead");
      setStep("review");
      setDebugInfo(prev => ({
        ...prev,
        draftFound: true,
        draftTimestamp: draft.timestamp || "unknown",
        rehydrated: true,
        rehydratedFrom: `name: ${restored.name}, email: ${restored.email}`,
      }));
    } catch (e) {
      console.error("[scan-card-debug] rehydration FAILED", e);
      setDebugInfo(prev => ({ ...prev, draftFound: false, rehydrated: false, rehydratedFrom: "parse error" }));
    }
  }, []);

  useEffect(() => {
    if (step !== "review") return;
    persistDraft({ imagePreview, contact, contactType });
  }, [contact, contactType, imagePreview, persistDraft, step]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const preventNativeSubmit = (event: Event) => {
      console.warn("[scan-card] submit event fired");
      event.preventDefault();
      event.stopPropagation();
      console.warn("[scan-card] preventDefault executed");
    };

    const ancestorForms: HTMLFormElement[] = [];
    let node: HTMLElement | null = root.parentElement;
    while (node) {
      if (node instanceof HTMLFormElement) {
        ancestorForms.push(node);
      }
      node = node.parentElement;
    }

    ancestorForms.forEach((form) => form.addEventListener("submit", preventNativeSubmit, true));

    if (ancestorForms.length > 0) {
      console.warn("[scan-card] attached submit guards to ancestor forms", ancestorForms.length);
    }

    return () => {
      ancestorForms.forEach((form) => form.removeEventListener("submit", preventNativeSubmit, true));
    };
  }, []);

  useEffect(() => {
    const prevHtmlOverscrollY = document.documentElement.style.overscrollBehaviorY;
    const prevBodyOverscrollY = document.body.style.overscrollBehaviorY;

    document.documentElement.style.overscrollBehaviorY = "contain";
    document.body.style.overscrollBehaviorY = "contain";

    const onBeforeUnload = () => {
      console.warn("[scan-card] unexpected beforeunload", {
        step: stepRef.current,
        saving: savingRef.current,
      });
    };

    const onPageHide = (event: PageTransitionEvent) => {
      console.warn("[scan-card] pagehide triggered", {
        persisted: event.persisted,
        step: stepRef.current,
        saving: savingRef.current,
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.documentElement.style.overscrollBehaviorY = prevHtmlOverscrollY;
      document.body.style.overscrollBehaviorY = prevBodyOverscrollY;
    };
  }, []);

  const handleSubmitCapture = useCallback((event: FormEvent<HTMLDivElement>) => {
    console.warn("[scan-card] submit event fired (capture)");
    event.preventDefault();
    event.stopPropagation();
    console.warn("[scan-card] preventDefault executed");
  }, []);

  const processImage = useCallback(async (base64: string) => {
    setImagePreview(base64);
    setStep("scanning");
    setSaveError(null);
    setSavedLeadId(null);

    try {
      const { data, error } = await supabase.functions.invoke("scan-business-card", {
        body: { image: base64 },
      });

      if (error) {
        console.error("[scan-card] Scan edge function error", error);
        throw new Error(typeof error === "object" && error.message ? error.message : "Scan failed — please try again");
      }
      if (data?.error) throw new Error(data.error);

      console.log("[scan-card] OCR result received", data?.contact);
      const scanned = normalizeExtractedContact(data?.contact ?? {});

      if (!scanned.name && !scanned.email && !scanned.phone) {
        throw new Error("Could not extract contact details. Please retake the photo.");
      }

      console.log("[scan-card] OCR result stored", scanned);
      persistDraft({ imagePreview: base64, contact: scanned, contactType });
      setContact(scanned);
      setStep("review");
      console.log("[scan-card] step set to review — no navigation, staying on same page");
      toast.success("Card scanned! Review and tap Save Contact.");
    } catch (err: any) {
      console.error("[scan-card] Scan business card error", err);
      toast.error(err.message || "Failed to scan business card");
      setStep("capture");
    }
  }, [contactType, persistDraft]);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1600;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          const ratio = Math.min(MAX / w, MAX / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Could not read image"));
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    try {
      const compressed = await compressImage(file);
      await processImage(compressed);
    } catch (err: any) {
      toast.error(err.message || "Failed to read image");
    }
  }, [compressImage, processImage]);

  const handleSave = async () => {
    console.log("[scan-card] save handler started");

    if (saving) return;

    const finalName = safeString(contact.name) || [safeString(contact.first_name), safeString(contact.last_name)].filter(Boolean).join(" ").trim();

    if (!finalName) {
      setSaveError("Could not save contact. Try again.");
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: stages, error: stagesError } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (stagesError) {
        console.error("[scan-card] Stage fetch error", stagesError);
      }

      const notesText = [
        contact.title && `Title: ${contact.title}`,
        contact.website && `Website: ${contact.website}`,
        contact.notes,
      ]
        .filter(Boolean)
        .join("\n") || null;

      const savePayload = {
        user_id: user.id,
        name: finalName,
        email: safeString(contact.email) || null,
        phone: safeString(contact.phone) || null,
        company: safeString(contact.company) || null,
        source: "business_card" as any,
        contact_type: contactType as any,
        stage_id: stages?.[0]?.id || null,
        notes: notesText,
        address: safeString(contact.address) || null,
        custom_fields_json: {
          first_name: safeString(contact.first_name),
          last_name: safeString(contact.last_name),
          full_name: safeString(contact.full_name) || finalName,
          title: safeString(contact.title),
          website: safeString(contact.website),
          ocr_source: "scan-business-card",
        },
      };

      console.log("[scan-card] review form values at save", contact);
      console.log("[scan-card] contact save payload", savePayload);

      const { data: newLead, error } = await supabase
        .from("leads")
        .insert(savePayload)
        .select("id")
        .single();

      if (error) throw error;

      if (!newLead?.id) {
        throw new Error("Insert succeeded but no lead id was returned");
      }

      await supabase.from("contact_activities").insert({
        user_id: user.id,
        lead_id: newLead.id,
        activity_type: "card_scanned",
        title: "Business card scanned",
        description: `Contact added via business card scan${contact.company ? ` — ${contact.company}` : ""}`,
        occurred_at: new Date().toISOString(),
      });

      const { data: verifyContact, error: verifyError } = await supabase
        .from("leads")
        .select("id")
        .eq("id", newLead.id)
        .maybeSingle();

      if (verifyError) {
        console.error("[scan-card] contact verify error", verifyError);
      }

      console.log("[scan-card] contact save success", { leadId: newLead.id, existsInListQuery: Boolean(verifyContact?.id) });

      sessionStorage.removeItem(DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setSavedLeadId(newLead.id);
      setStep("saved");
      toast.success("Contact saved");
    } catch (err) {
      console.error("[scan-card] contact save failure", err);
      setSaveError("Could not save contact. Try again.");
      toast.error("Could not save contact. Try again.");
      setStep("review");
    } finally {
      setSaving(false);
      console.log("[scan-card] save handler completed");
    }
  };

  const handleSaveContactClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    console.log("[scan-card] save button click handler runs");
    event.preventDefault();
    event.stopPropagation();
    console.log("[scan-card] preventDefault executed for save button");
    void handleSave();
  }, [handleSave]);

  const reset = () => {
    console.log("[scan-card-debug] RESET triggered");
    setStep("capture");
    setImagePreview(null);
    setContact({ name: "" });
    setContactType("lead");
    setSaveError(null);
    setSavedLeadId(null);
    sessionStorage.removeItem(DRAFT_KEY);
    setDebugInfo(prev => ({ ...prev, lastResetBy: "user-reset", draftFound: false, rehydrated: false }));
  };

  return (
    <div
      ref={rootRef}
      className="max-w-lg mx-auto px-4 py-6 space-y-6"
      onSubmitCapture={handleSubmitCapture}
      onTouchStartCapture={(e) => e.stopPropagation()}
      onTouchMoveCapture={(e) => e.stopPropagation()}
      onTouchEndCapture={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Scan Business Card</h1>
          <p className="text-sm text-muted-foreground">
            {step === "capture" && "Take a photo or upload an image"}
            {step === "scanning" && "Extracting contact info…"}
            {step === "review" && "Review and save"}
            {step === "saved" && "Contact saved"}
          </p>
        </div>
      </div>

      {step === "capture" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-10 text-center space-y-4">
            <ScanLine className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Position the business card in good lighting for best results</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button type="button" onClick={() => cameraInputRef.current?.click()} className="gap-2">
                <Camera className="h-4 w-4" /> Take Photo
              </Button>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> Upload Image
              </Button>
            </div>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (file) void handleFile(file);
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (file) void handleFile(file);
            }}
          />
        </div>
      )}

      {step === "scanning" && (
        <div className="space-y-4">
          {imagePreview && <img src={imagePreview} alt="Business card" className="w-full rounded-lg border border-border" />}
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Analyzing business card…</span>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Business card" className="w-full rounded-lg border border-border opacity-60" />
              <div className="absolute top-2 right-2">
                <Button type="button" variant="secondary" size="sm" onClick={reset} className="gap-1">
                  <X className="h-3 w-3" /> Rescan
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label>Contact Type</Label>
              <Select
                value={contactType}
                onValueChange={(value) => {
                  setSaveError(null);
                  setContactType(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span>{t.label}</span>
                      <span className="text-muted-foreground ml-1 text-xs">— {t.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={contact.name}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, name: e.target.value, full_name: e.target.value });
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input
                  value={contact.first_name || ""}
                  onChange={(e) => {
                    setSaveError(null);
                    setContact({ ...contact, first_name: e.target.value });
                  }}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={contact.last_name || ""}
                  onChange={(e) => {
                    setSaveError(null);
                    setContact({ ...contact, last_name: e.target.value });
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={contact.email || ""}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, email: e.target.value });
                }}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={contact.phone || ""}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, phone: e.target.value });
                }}
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={contact.company || ""}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, company: e.target.value });
                }}
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={contact.title || ""}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, title: e.target.value, job_title: e.target.value });
                }}
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={contact.website || ""}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, website: e.target.value });
                }}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={contact.address || ""}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, address: e.target.value });
                }}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={contact.notes || ""}
                onChange={(e) => {
                  setSaveError(null);
                  setContact({ ...contact, notes: e.target.value });
                }}
                rows={3}
              />
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-destructive" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={reset}>
              Scan Another
            </Button>
            <Button type="button" className="flex-1 gap-2" onClick={handleSaveContactClick} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Save Contact
            </Button>
          </div>
        </div>
      )}

      {step === "saved" && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">Contact saved</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" className="flex-1" onClick={() => savedLeadId && navigate(`/app/contacts/${savedLeadId}`)} disabled={!savedLeadId}>
              View Contact
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={reset}>
              Scan Another Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
