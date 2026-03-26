import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Loader2, ArrowLeft, ScanLine, UserPlus, X } from "lucide-react";
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

const DRAFT_KEY = "scan_business_card_draft_v2";

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

type Step = "capture" | "scanning" | "review";

export default function ScanBusinessCard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contact, setContact] = useState<ExtractedContact>({ name: "" });
  const [contactType, setContactType] = useState<string>("lead");
  const [saving, setSaving] = useState(false);

  const persistDraft = useCallback((draft: { imagePreview: string | null; contact: ExtractedContact; contactType: string }) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        imagePreview?: string | null;
        contact?: ExtractedContact;
        contactType?: string;
      };
      if (!draft.contact) return;
      setImagePreview(draft.imagePreview ?? null);
      setContact({
        name: draft.contact.name ?? "",
        email: draft.contact.email ?? "",
        phone: draft.contact.phone ?? "",
        company: draft.contact.company ?? "",
        job_title: draft.contact.job_title ?? "",
        website: draft.contact.website ?? "",
        address: draft.contact.address ?? "",
        notes: draft.contact.notes ?? "",
      });
      setContactType(draft.contactType ?? "lead");
      setStep("review");
    } catch {
      // ignore malformed draft
    }
  }, []);

  const processImage = useCallback(async (base64: string) => {
    setImagePreview(base64);
    setStep("scanning");

    try {
      const { data, error } = await supabase.functions.invoke("scan-business-card", {
        body: { image: base64 },
      });

      if (error) {
        console.error("Scan edge function error:", error);
        throw new Error(typeof error === "object" && error.message ? error.message : "Scan failed — please try again");
      }
      if (data?.error) throw new Error(data.error);

      const scanned: ExtractedContact = {
        name: data?.contact?.name ?? "",
        email: data?.contact?.email ?? "",
        phone: data?.contact?.phone ?? "",
        company: data?.contact?.company ?? "",
        job_title: data?.contact?.job_title ?? "",
        website: data?.contact?.website ?? "",
        address: data?.contact?.address ?? "",
        notes: data?.contact?.notes ?? "",
      };

      persistDraft({ imagePreview: base64, contact: scanned, contactType });
      setContact(scanned);
      setStep("review");
      toast.success("Card scanned! Review and tap Save Contact.");
    } catch (err: any) {
      console.error("Scan business card error:", err);
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
    if (!contact.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .limit(1);

      const notesText = [
        contact.job_title && `Title: ${contact.job_title}`,
        contact.website && `Website: ${contact.website}`,
        contact.address && `Address: ${contact.address}`,
        contact.notes,
      ]
        .filter(Boolean)
        .join("\n") || null;

      const { data: newLead, error } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          name: contact.name.trim(),
          email: contact.email?.trim() || null,
          phone: contact.phone?.trim() || null,
          company: contact.company?.trim() || null,
          source: "business_card" as any,
          contact_type: contactType as any,
          stage_id: stages?.[0]?.id || null,
          notes: notesText,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (newLead?.id) {
        await supabase.from("contact_activities").insert({
          user_id: user.id,
          lead_id: newLead.id,
          activity_type: "card_scanned",
          title: "Business card scanned",
          description: `Contact added via business card scan${contact.company ? ` — ${contact.company}` : ""}`,
          occurred_at: new Date().toISOString(),
        });
      }

      sessionStorage.removeItem(DRAFT_KEY);
      toast.success(`${contact.name.trim()} saved to contacts!`);
      navigate("/app/contacts");
    } catch (err: any) {
      console.error("Save contact error:", err);
      toast.error(err.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep("capture");
    setImagePreview(null);
    setContact({ name: "" });
    setContactType("lead");
    sessionStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
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
              <Select value={contactType} onValueChange={setContactType}>
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
              <Label>Name *</Label>
              <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={contact.email || ""} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={contact.phone || ""} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
            <div>
              <Label>Company</Label>
              <Input value={contact.company || ""} onChange={(e) => setContact({ ...contact, company: e.target.value })} />
            </div>
            <div>
              <Label>Job Title</Label>
              <Input value={contact.job_title || ""} onChange={(e) => setContact({ ...contact, job_title: e.target.value })} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={contact.website || ""} onChange={(e) => setContact({ ...contact, website: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={contact.address || ""} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={contact.notes || ""} onChange={(e) => setContact({ ...contact, notes: e.target.value })} rows={3} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={reset}>
              Scan Another
            </Button>
            <Button type="button" className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Save Contact
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
