import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Loader2, Check, ArrowLeft, ScanLine, UserPlus, X } from "lucide-react";
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
  const [saving, setSaving] = useState(false);

  const processImage = useCallback(async (base64: string) => {
    setImagePreview(base64);
    setStep("scanning");

    try {
      const { data, error } = await supabase.functions.invoke("scan-business-card", {
        body: { image: base64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setContact(data.contact);
      setStep("review");
    } catch (err: any) {
      toast.error(err.message || "Failed to scan business card");
      setStep("capture");
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => processImage(reader.result as string);
    reader.readAsDataURL(file);
  }, [processImage]);

  const handleSave = async () => {
    if (!contact.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("leads").insert({
        user_id: user.id,
        name: contact.name.trim(),
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() || null,
        company: contact.company?.trim() || null,
        source: "business_card" as any,
        notes: [
          contact.job_title && `Title: ${contact.job_title}`,
          contact.website && `Website: ${contact.website}`,
          contact.address && `Address: ${contact.address}`,
          contact.notes,
        ].filter(Boolean).join("\n") || null,
      });

      if (error) throw error;
      toast.success("Contact saved!");
      navigate("/app/contacts");
    } catch (err: any) {
      toast.error(err.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep("capture");
    setImagePreview(null);
    setContact({ name: "" });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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

      {/* ── CAPTURE STEP ── */}
      {step === "capture" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-10 text-center space-y-4">
            <ScanLine className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Position the business card in good lighting for best results
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => cameraInputRef.current?.click()} className="gap-2">
                <Camera className="h-4 w-4" /> Take Photo
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
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
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* ── SCANNING STEP ── */}
      {step === "scanning" && (
        <div className="space-y-4">
          {imagePreview && (
            <img src={imagePreview} alt="Business card" className="w-full rounded-lg border border-border" />
          )}
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Analyzing business card…</span>
          </div>
        </div>
      )}

      {/* ── REVIEW STEP ── */}
      {step === "review" && (
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Business card" className="w-full rounded-lg border border-border opacity-60" />
              <div className="absolute top-2 right-2">
                <Button variant="secondary" size="sm" onClick={reset} className="gap-1">
                  <X className="h-3 w-3" /> Rescan
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
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
            <Button variant="outline" className="flex-1" onClick={reset}>
              Scan Another
            </Button>
            <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Save Contact
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
