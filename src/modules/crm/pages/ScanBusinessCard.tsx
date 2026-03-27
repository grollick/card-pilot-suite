import { useState, useRef, useCallback, useEffect, type FormEvent, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
const RUNTIME_DEBUG_KEY = "scan_business_card_runtime_debug_v1";

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

type Step = "capture" | "preview" | "scanning" | "review" | "saved";

interface RuntimeTimeline {
  fileSelectedAt: string;
  ocrStartedAt: string;
  ocrSuccessAt: string;
  draftWrittenAt: string;
  stepReviewAt: string;
  routeChangedAfterOcr: boolean;
  routeChangedAt: string;
  remountedAfterOcr: boolean;
  remountedAt: string;
  stateResetAfterOcr: boolean;
  stateResetAt: string;
}

interface RuntimeDebugState {
  currentPath: string;
  currentStep: Step;
  mountCount: number;
  unmountCount: number;
  lastMountAt: string;
  lastUnmountAt: string;
  draftExists: boolean;
  rehydrationSucceeded: boolean;
  ocrSuccessReceived: boolean;
  lastOcrAt: string;
  lastRouteChangeAt: string;
  lastStateResetAt: string;
  trueReloadDetected: boolean;
  trueReloadEvent: string;
  trueReloadAt: string;
  routeChangedAfterOcr: boolean;
  remountedAfterOcr: boolean;
  stepResetAfterOcr: boolean;
  contactResetAfterOcr: boolean;
  pathAtOcrSuccess: string;
  pathAfterOcrRouteChange: string;
  lastResetReason: string;
  navigateCalls: number;
  lastNavigateAt: string;
  lastNavigateTarget: string;
  timeline: RuntimeTimeline;
}

const isoNow = () => new Date().toISOString();

const defaultRuntimeTimeline = (): RuntimeTimeline => ({
  fileSelectedAt: "",
  ocrStartedAt: "",
  ocrSuccessAt: "",
  draftWrittenAt: "",
  stepReviewAt: "",
  routeChangedAfterOcr: false,
  routeChangedAt: "",
  remountedAfterOcr: false,
  remountedAt: "",
  stateResetAfterOcr: false,
  stateResetAt: "",
});

const createDefaultRuntimeState = (path: string, step: Step): RuntimeDebugState => ({
  currentPath: path,
  currentStep: step,
  mountCount: 0,
  unmountCount: 0,
  lastMountAt: "",
  lastUnmountAt: "",
  draftExists: false,
  rehydrationSucceeded: false,
  ocrSuccessReceived: false,
  lastOcrAt: "",
  lastRouteChangeAt: "",
  lastStateResetAt: "",
  trueReloadDetected: false,
  trueReloadEvent: "",
  trueReloadAt: "",
  routeChangedAfterOcr: false,
  remountedAfterOcr: false,
  stepResetAfterOcr: false,
  contactResetAfterOcr: false,
  pathAtOcrSuccess: "",
  pathAfterOcrRouteChange: "",
  lastResetReason: "",
  navigateCalls: 0,
  lastNavigateAt: "",
  lastNavigateTarget: "",
  timeline: defaultRuntimeTimeline(),
});

const writeStoredRuntimeState = (state: RuntimeDebugState) => {
  try {
    sessionStorage.setItem(RUNTIME_DEBUG_KEY, JSON.stringify(state));
  } catch {
    // ignore diagnostics storage failures
  }
};

const readStoredRuntimeState = (path: string, step: Step): RuntimeDebugState => {
  const base = createDefaultRuntimeState(path, step);
  try {
    const raw = sessionStorage.getItem(RUNTIME_DEBUG_KEY);
    if (!raw) return base;

    const parsed = JSON.parse(raw) as Partial<RuntimeDebugState>;
    return {
      ...base,
      ...parsed,
      currentPath: path,
      currentStep: step,
      timeline: {
        ...base.timeline,
        ...(parsed.timeline ?? {}),
      },
    };
  } catch {
    return base;
  }
};

const safeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeExtractedContact = (raw: any): ExtractedContact => {
  const firstName = safeString(raw?.first_name || raw?.firstName);
  const lastName = safeString(raw?.last_name || raw?.lastName);
  const fullName = safeString(raw?.full_name || raw?.fullName || raw?.name) || [firstName, lastName].filter(Boolean).join(" ").trim();
  const title = safeString(raw?.title || raw?.job_title || raw?.jobTitle || raw?.position || raw?.role);
  const company = safeString(raw?.company || raw?.company_name || raw?.companyName || raw?.business_name || raw?.businessName || raw?.organization || raw?.org);

  return {
    name: fullName,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email: safeString(raw?.email || raw?.email_address),
    phone: safeString(raw?.phone || raw?.phone_number || raw?.mobile || raw?.tel),
    company,
    title,
    job_title: title,
    website: safeString(raw?.website || raw?.url || raw?.web),
    address: safeString(raw?.address || raw?.location || raw?.office_address),
    notes: safeString(raw?.notes || raw?.other),
  };
};

export default function ScanBusinessCard() {
  const location = useLocation();
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
  const previousPathRef = useRef(location.pathname);
  const previousStepRef = useRef<Step>("capture");
  const previousContactRef = useRef<ExtractedContact>({ name: "" });
  const [runtimeDebug, setRuntimeDebug] = useState<RuntimeDebugState>(() => createDefaultRuntimeState(location.pathname, "capture"));
  const runtimeRef = useRef<RuntimeDebugState>(createDefaultRuntimeState(location.pathname, "capture"));

  const updateRuntimeDebug = useCallback((updater: (prev: RuntimeDebugState) => RuntimeDebugState) => {
    setRuntimeDebug((previous) => {
      const next = updater(previous);
      runtimeRef.current = next;
      try {
        sessionStorage.setItem(RUNTIME_DEBUG_KEY, JSON.stringify(next));
      } catch {
        // ignore storage write failures for diagnostics
      }
      return next;
    });
  }, []);

  const trackedNavigate = useCallback((to: string | number, options?: { replace?: boolean }) => {
    const at = isoNow();
    updateRuntimeDebug((prev) => ({
      ...prev,
      navigateCalls: prev.navigateCalls + 1,
      lastNavigateAt: at,
      lastNavigateTarget: String(to),
    }));
    if (typeof to === "number") {
      navigate(to);
      return;
    }
    navigate(to, options);
  }, [navigate, updateRuntimeDebug]);

  const hasContactData = useCallback((value: ExtractedContact) => {
    return [
      value.name,
      value.first_name,
      value.last_name,
      value.email,
      value.phone,
      value.company,
      value.title,
      value.website,
      value.address,
      value.notes,
    ].some((item) => safeString(item).length > 0);
  }, []);

  useEffect(() => {
    const mountedAt = isoNow();
    const restored = readStoredRuntimeState(location.pathname, step);
    const remountedAfterOcr = Boolean(restored.ocrSuccessReceived || restored.rehydrationSucceeded);

    const next: RuntimeDebugState = {
      ...restored,
      currentPath: location.pathname,
      currentStep: step,
      mountCount: restored.mountCount + 1,
      lastMountAt: mountedAt,
      remountedAfterOcr: restored.remountedAfterOcr || remountedAfterOcr,
      timeline: {
        ...restored.timeline,
        remountedAfterOcr: restored.timeline.remountedAfterOcr || remountedAfterOcr,
        remountedAt: remountedAfterOcr ? mountedAt : restored.timeline.remountedAt,
      },
    };

    runtimeRef.current = next;
    setRuntimeDebug(next);
    writeStoredRuntimeState(next);

    console.log("[scan-card-debug] mount", {
      mountCount: next.mountCount,
      remountedAfterOcr,
      mountedAt,
    });

    return () => {
      const unmountedAt = isoNow();
      const current = runtimeRef.current;
      const nextOnUnmount: RuntimeDebugState = {
        ...current,
        unmountCount: current.unmountCount + 1,
        lastUnmountAt: unmountedAt,
      };
      runtimeRef.current = nextOnUnmount;
      writeStoredRuntimeState(nextOnUnmount);
      console.log("[scan-card-debug] unmount", {
        unmountCount: nextOnUnmount.unmountCount,
        unmountedAt,
      });
    };
    // intentionally only on mount/unmount for remount diagnostics
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stepRef.current = step;
    updateRuntimeDebug((prev) => ({
      ...prev,
      currentPath: location.pathname,
      currentStep: step,
      draftExists: (() => {
        try {
          return Boolean(sessionStorage.getItem(DRAFT_KEY));
        } catch {
          return prev.draftExists;
        }
      })(),
    }));
  }, [location.pathname, step, updateRuntimeDebug]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    if (previousPath === location.pathname) return;

    const changedAt = isoNow();
    updateRuntimeDebug((prev) => ({
      ...prev,
      currentPath: location.pathname,
      lastRouteChangeAt: changedAt,
      routeChangedAfterOcr: prev.routeChangedAfterOcr || prev.ocrSuccessReceived,
      pathAfterOcrRouteChange: prev.ocrSuccessReceived ? location.pathname : prev.pathAfterOcrRouteChange,
      timeline: {
        ...prev.timeline,
        routeChangedAfterOcr: prev.timeline.routeChangedAfterOcr || prev.ocrSuccessReceived,
        routeChangedAt: changedAt,
      },
    }));

    console.warn("[scan-card-debug] route changed", {
      from: previousPath,
      to: location.pathname,
      afterOcr: runtimeRef.current.ocrSuccessReceived,
    });

    previousPathRef.current = location.pathname;
  }, [location.pathname, updateRuntimeDebug]);

  useEffect(() => {
    const previousStep = previousStepRef.current;
    const hadOcr = runtimeRef.current.ocrSuccessReceived || runtimeRef.current.rehydrationSucceeded;

    if (hadOcr && previousStep !== "capture" && step === "capture") {
      const resetAt = isoNow();
      updateRuntimeDebug((prev) => ({
        ...prev,
        stepResetAfterOcr: true,
        lastStateResetAt: resetAt,
        lastResetReason: `Step reset after OCR (${previousStep} -> capture)`,
        timeline: {
          ...prev.timeline,
          stateResetAfterOcr: true,
          stateResetAt: resetAt,
        },
      }));
      console.warn("[scan-card-debug] Step reset after OCR", { previousStep, nextStep: step });
    }

    previousStepRef.current = step;
  }, [step, updateRuntimeDebug]);

  useEffect(() => {
    const hadOcr = runtimeRef.current.ocrSuccessReceived || runtimeRef.current.rehydrationSucceeded;
    const hadPreviousData = hasContactData(previousContactRef.current);
    const hasCurrentData = hasContactData(contact);

    if (hadOcr && hadPreviousData && !hasCurrentData) {
      const resetAt = isoNow();
      updateRuntimeDebug((prev) => ({
        ...prev,
        contactResetAfterOcr: true,
        lastStateResetAt: resetAt,
        lastResetReason: "Contact state reset after OCR",
        timeline: {
          ...prev.timeline,
          stateResetAfterOcr: true,
          stateResetAt: resetAt,
        },
      }));
      console.warn("[scan-card-debug] Contact state reset after OCR");
    }

    previousContactRef.current = contact;
  }, [contact, hasContactData, updateRuntimeDebug]);

  const persistDraft = useCallback((draft: { imagePreview: string | null; contact: ExtractedContact; contactType: string; timestamp?: string }) => {
    try {
      const withTimestamp = { ...draft, timestamp: draft.timestamp || isoNow() };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(withTimestamp));
      console.log("[scan-card-debug] draft WRITTEN to sessionStorage", DRAFT_KEY);
      updateRuntimeDebug((prev) => ({
        ...prev,
        draftExists: true,
        timeline: {
          ...prev.timeline,
          draftWrittenAt: withTimestamp.timestamp || isoNow(),
        },
      }));
    } catch (e) {
      console.error("[scan-card-debug] draft write FAILED", e);
    }
  }, [updateRuntimeDebug]);

  // Rehydration — runs once on mount, restores draft if present
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      console.log("[scan-card-debug] rehydration check — draft present:", !!raw);
      if (!raw) {
        updateRuntimeDebug((prev) => ({
          ...prev,
          draftExists: false,
          rehydrationSucceeded: false,
        }));
        return;
      }

      const draft = JSON.parse(raw) as {
        imagePreview?: string | null;
        contact?: ExtractedContact;
        contactType?: string;
        timestamp?: string;
      };

      if (!draft.contact) {
        updateRuntimeDebug((prev) => ({
          ...prev,
          draftExists: true,
          rehydrationSucceeded: false,
          lastResetReason: "Draft exists but contact payload missing",
        }));
        return;
      }

      const restored = normalizeExtractedContact(draft.contact);
      setImagePreview(draft.imagePreview ?? null);
      setContact(restored);
      setContactType(draft.contactType ?? "lead");
      setStep("review");

      const reviewAt = isoNow();
      updateRuntimeDebug((prev) => ({
        ...prev,
        currentStep: "review",
        draftExists: true,
        rehydrationSucceeded: true,
        timeline: {
          ...prev.timeline,
          stepReviewAt: reviewAt,
        },
      }));
    } catch (e) {
      console.error("[scan-card-debug] rehydration FAILED", e);
      updateRuntimeDebug((prev) => ({
        ...prev,
        draftExists: false,
        rehydrationSucceeded: false,
        lastResetReason: "Draft parse failed during rehydration",
      }));
    }
  }, [updateRuntimeDebug]);

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

    const markTrueReload = (eventName: "beforeunload" | "unload" | "pagehide" | "visibilitychange") => {
      const at = isoNow();
      const current = runtimeRef.current;
      const next = {
        ...current,
        trueReloadDetected: true,
        trueReloadEvent: eventName,
        trueReloadAt: at,
        lastResetReason: `True browser reload/unload detected (${eventName})`,
      };

      runtimeRef.current = next;
      setRuntimeDebug(next);
      writeStoredRuntimeState(next);

      console.warn("[scan-card-debug] True browser reload/unload detected", {
        eventName,
        at,
      });
    };

    const onBeforeUnload = () => markTrueReload("beforeunload");
    const onUnload = () => markTrueReload("unload");
    const onPageHide = () => markTrueReload("pagehide");
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markTrueReload("visibilitychange");
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("unload", onUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("unload", onUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
    const ocrStartedAt = isoNow();
    updateRuntimeDebug((prev) => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        ocrStartedAt,
      },
    }));

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
      const ocrSuccessAt = isoNow();
      updateRuntimeDebug((prev) => ({
        ...prev,
        ocrSuccessReceived: true,
        lastOcrAt: ocrSuccessAt,
        pathAtOcrSuccess: location.pathname,
        timeline: {
          ...prev.timeline,
          ocrSuccessAt,
        },
      }));

      const scanned = normalizeExtractedContact(data?.contact ?? {});

      if (!scanned.name && !scanned.email && !scanned.phone) {
        throw new Error("Could not extract contact details. Please retake the photo.");
      }

      console.log("[scan-card] OCR result stored", scanned);
      persistDraft({ imagePreview: base64, contact: scanned, contactType });
      setContact(scanned);
      setStep("review");
      updateRuntimeDebug((prev) => ({
        ...prev,
        currentStep: "review",
        timeline: {
          ...prev.timeline,
          stepReviewAt: isoNow(),
        },
      }));
      console.log("[scan-card] step set to review — no navigation, staying on same page");
      toast.success("Card scanned! Review and tap Save Contact.");
    } catch (err: any) {
      console.error("[scan-card] Scan business card error", err);
      toast.error(err.message || "Failed to scan business card");
      setStep("capture");
    }
  }, [contactType, location.pathname, persistDraft, updateRuntimeDebug]);

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

  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [ocrManuallyStarted, setOcrManuallyStarted] = useState(false);
  const [unloadPhase, setUnloadPhase] = useState<string>("none");

  // Track which phase unload happens in
  useEffect(() => {
    const detectPhase = (eventName: string) => {
      const phase = step === "capture" ? "capture" : step === "preview" ? "idle_preview" : step === "scanning" ? "ocr_running" : step;
      setUnloadPhase(`${phase} (${eventName})`);
      try {
        sessionStorage.setItem("scan_unload_phase", `${phase} (${eventName}) at ${isoNow()}`);
      } catch {}
    };
    const onBU = () => detectPhase("beforeunload");
    const onU = () => detectPhase("unload");
    const onPH = () => detectPhase("pagehide");
    const onVC = () => { if (document.visibilityState === "hidden") detectPhase("visibilitychange"); };
    window.addEventListener("beforeunload", onBU);
    window.addEventListener("unload", onU);
    window.addEventListener("pagehide", onPH);
    document.addEventListener("visibilitychange", onVC);
    return () => {
      window.removeEventListener("beforeunload", onBU);
      window.removeEventListener("unload", onU);
      window.removeEventListener("pagehide", onPH);
      document.removeEventListener("visibilitychange", onVC);
    };
  }, [step]);

  // Rehydrate unload phase from previous session
  useEffect(() => {
    try {
      const prev = sessionStorage.getItem("scan_unload_phase");
      if (prev) setUnloadPhase(prev);
    } catch {}
  }, []);

  const handleFile = useCallback(async (file: File) => {
    updateRuntimeDebug((prev) => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        fileSelectedAt: isoNow(),
      },
    }));

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
      // Do NOT auto-start OCR — just show preview
      setImagePreview(compressed);
      setPendingBase64(compressed);
      setOcrManuallyStarted(false);
      setStep("preview");
      toast.success("Image captured successfully — tap Start OCR when ready");
    } catch (err: any) {
      toast.error(err.message || "Failed to read image");
    }
  }, [compressImage, updateRuntimeDebug]);

  const handleStartOcr = useCallback(() => {
    if (!pendingBase64) return;
    setOcrManuallyStarted(true);
    void processImage(pendingBase64);
  }, [pendingBase64, processImage]);

  const handleSave = useCallback(async () => {
    console.log("[scan-card] save handler started");

    if (savingRef.current) return;

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
          address: safeString(contact.address),
          company: safeString(contact.company),
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
  }, [contact, contactType, queryClient]);

  const handleSaveContactClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    console.log("[scan-card] save button click handler runs");
    event.preventDefault();
    event.stopPropagation();
    console.log("[scan-card] preventDefault executed for save button");
    void handleSave();
  }, [handleSave]);

  const reset = () => {
    console.log("[scan-card-debug] RESET triggered");
    const resetAt = isoNow();
    setStep("capture");
    setImagePreview(null);
    setContact({ name: "" });
    setContactType("lead");
    setSaveError(null);
    setSavedLeadId(null);
    sessionStorage.removeItem(DRAFT_KEY);
    updateRuntimeDebug((prev) => ({
      ...prev,
      currentStep: "capture",
      draftExists: false,
      lastStateResetAt: resetAt,
      lastResetReason: "user-reset",
    }));
  };

  return (
    <div
      ref={rootRef}
      className="max-w-lg mx-auto px-4 py-6 space-y-6"
      onSubmitCapture={handleSubmitCapture}
    >
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => trackedNavigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Scan Business Card</h1>
          <p className="text-sm text-muted-foreground">
            {step === "capture" && "Take a photo or upload an image"}
            {step === "preview" && "Image captured — start OCR when ready"}
            {step === "scanning" && "Extracting contact info…"}
            {step === "review" && "Review and save"}
            {step === "saved" && "Contact saved"}
          </p>
        </div>
      </div>

      {/* Temporary debug panel */}
      <div className="rounded-lg border border-border bg-muted p-3 text-xs font-mono space-y-1">
        <p className="font-bold text-foreground">🔍 Scanner Debug Panel</p>
        <p>Current route/path: <strong>{runtimeDebug.currentPath || "—"}</strong></p>
        <p>Step: <strong>{step}</strong></p>
        <p>Mount count: <strong>{runtimeDebug.mountCount}</strong> (last: {runtimeDebug.lastMountAt || "—"})</p>
        <p>Unmount count: <strong>{runtimeDebug.unmountCount}</strong> (last: {runtimeDebug.lastUnmountAt || "—"})</p>
        <p>Draft key: {DRAFT_KEY}</p>
        <p>sessionStorage draft exists: <strong>{runtimeDebug.draftExists ? "YES ✅" : "NO ❌"}</strong></p>
        <p>Rehydration succeeded: <strong>{runtimeDebug.rehydrationSucceeded ? "YES ✅" : "NO ❌"}</strong></p>
        <p>OCR success received: <strong>{runtimeDebug.ocrSuccessReceived ? "YES ✅" : "NO ❌"}</strong></p>
        <p>Last OCR timestamp: {runtimeDebug.lastOcrAt || "—"}</p>
        <p>Last route change timestamp: {runtimeDebug.lastRouteChangeAt || "—"}</p>
        <p>Last state reset timestamp: {runtimeDebug.lastStateResetAt || "—"}</p>
        <p>Path at OCR success: {runtimeDebug.pathAtOcrSuccess || "—"}</p>
        <p>Path after OCR route change: {runtimeDebug.pathAfterOcrRouteChange || "—"}</p>
        <p>Route changed after OCR: <strong>{runtimeDebug.routeChangedAfterOcr ? "YES ⚠️" : "NO ✅"}</strong></p>
        <p>Component remounted after OCR: <strong>{runtimeDebug.remountedAfterOcr ? "YES ⚠️" : "NO ✅"}</strong></p>
        <p>Step reset after OCR: <strong>{runtimeDebug.stepResetAfterOcr ? "YES ⚠️" : "NO ✅"}</strong></p>
        <p>Contact reset after OCR: <strong>{runtimeDebug.contactResetAfterOcr ? "YES ⚠️" : "NO ✅"}</strong></p>
        <p>navigate() calls seen: <strong>{runtimeDebug.navigateCalls}</strong> (last target: {runtimeDebug.lastNavigateTarget || "—"}, at {runtimeDebug.lastNavigateAt || "—"})</p>
        <p>Last reset reason: {runtimeDebug.lastResetReason || "—"}</p>
        <p>Contact name: {contact.name || "(empty)"}</p>
        <p>Contact email: {contact.email || "(empty)"}</p>
        {runtimeDebug.trueReloadDetected && (
          <p className="text-destructive font-bold">🔴 True browser reload/unload detected ({runtimeDebug.trueReloadEvent} at {runtimeDebug.trueReloadAt || "—"})</p>
        )}
        {runtimeDebug.routeChangedAfterOcr && (
          <p className="text-destructive font-bold">🔴 Route changed after OCR</p>
        )}
        {runtimeDebug.remountedAfterOcr && (
          <p className="text-destructive font-bold">🔴 Component remounted after OCR</p>
        )}
        {(runtimeDebug.stepResetAfterOcr || runtimeDebug.contactResetAfterOcr) && (
          <p className="text-destructive font-bold">🔴 State reset after OCR</p>
        )}
        {runtimeDebug.rehydrationSucceeded && step === "review" && (
          <p className="text-primary font-bold">🟢 Recovered scanned card draft</p>
        )}

        <div className="pt-2 mt-2 border-t border-border space-y-1">
          <p className="font-bold">OCR Success Timeline</p>
          <p>1) file selected: {runtimeDebug.timeline.fileSelectedAt || "—"}</p>
          <p>2) OCR started: {runtimeDebug.timeline.ocrStartedAt || "—"}</p>
          <p>3) OCR success received: {runtimeDebug.timeline.ocrSuccessAt || "—"}</p>
          <p>4) draft written: {runtimeDebug.timeline.draftWrittenAt || "—"}</p>
          <p>5) step switched to review: {runtimeDebug.timeline.stepReviewAt || "—"}</p>
          <p>6) route changed after OCR: {runtimeDebug.timeline.routeChangedAfterOcr ? `YES at ${runtimeDebug.timeline.routeChangedAt || "—"}` : "NO"}</p>
          <p>7) component remounted after OCR: {runtimeDebug.timeline.remountedAfterOcr ? `YES at ${runtimeDebug.timeline.remountedAt || "—"}` : "NO"}</p>
          <p>8) state reset after OCR: {runtimeDebug.timeline.stateResetAfterOcr ? `YES at ${runtimeDebug.timeline.stateResetAt || "—"}` : "NO"}</p>
        </div>

        <div className="pt-2 mt-2 border-t border-border space-y-1">
          <p className="font-bold">🧪 Capture vs OCR Isolation</p>
          <p>Image preview visible: <strong>{imagePreview ? "YES ✅" : "NO ❌"}</strong></p>
          <p>OCR manually started: <strong>{ocrManuallyStarted ? "YES" : "NO"}</strong></p>
          <p>Pending base64 ready: <strong>{pendingBase64 ? "YES ✅" : "NO ❌"}</strong></p>
          <p>Unload phase: <strong>{unloadPhase}</strong></p>
          <p>Previous unload (sessionStorage): <strong>{(() => { try { return sessionStorage.getItem("scan_unload_phase") || "—"; } catch { return "—"; } })()}</strong></p>
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
            capture="environment"
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

      {step === "preview" && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 text-center">
            <p className="text-sm font-semibold text-primary">✅ Image captured successfully</p>
            <p className="text-xs text-muted-foreground mt-1">No OCR yet — tap "Start OCR" when ready</p>
          </div>
          {imagePreview && <img src={imagePreview} alt="Business card preview" className="w-full rounded-lg border border-border" />}
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setStep("capture"); setImagePreview(null); setPendingBase64(null); }}>
              Retake
            </Button>
            <Button type="button" className="flex-1 gap-2" onClick={handleStartOcr}>
              <ScanLine className="h-4 w-4" /> Start OCR
            </Button>
          </div>
        </div>
      )}


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
            <Button type="button" className="flex-1" onClick={() => savedLeadId && trackedNavigate(`/app/contacts/${savedLeadId}`)} disabled={!savedLeadId}>
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
