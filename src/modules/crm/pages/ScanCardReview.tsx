import { useState, useEffect, useCallback, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, UserPlus, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DRAFT_KEY = "scan_business_card_draft_v3";

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

const safeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export default function ScanCardReview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contact, setContact] = useState<ExtractedContact | null>(null);
  const [contactType, setContactType] = useState("lead");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load draft from sessionStorage on mount
  useEffect(() => {
    console.log("[scan-review] page mounted");
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        console.warn("[scan-review] no draft found, redirecting to scan");
        navigate("/app/scan-card", { replace: true });
        return;
      }
      const draft = JSON.parse(raw);
      if (!draft.contact) {
        navigate("/app/scan-card", { replace: true });
        return;
      }
      console.log("[scan-review] draft restored", draft.contact);
      setContact(draft.contact);
      setContactType(draft.contactType ?? "lead");
      setImagePreview(draft.imagePreview ?? null);
    } catch {
      navigate("/app/scan-card", { replace: true });
    }
  }, [navigate]);

  // Persist edits back to sessionStorage
  useEffect(() => {
    if (!contact) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ imagePreview, contact, contactType }));
    } catch { /* ignore */ }
  }, [contact, contactType, imagePreview]);

  // Diagnostic guards
  useEffect(() => {
    const onBeforeUnload = () => console.warn("[scan-review] beforeunload fired!");
    const onPageHide = () => console.warn("[scan-review] pagehide fired!");
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);

    // Overscroll containment
    const prevHtml = document.documentElement.style.overscrollBehaviorY;
    const prevBody = document.body.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = "contain";
    document.body.style.overscrollBehaviorY = "contain";

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.documentElement.style.overscrollBehaviorY = prevHtml;
      document.body.style.overscrollBehaviorY = prevBody;
    };
  }, []);

  const handleSave = useCallback(async () => {
    console.log("[scan-review] save handler started");
    if (saving || !contact) return;

    const finalName = safeString(contact.name) || [safeString(contact.first_name), safeString(contact.last_name)].filter(Boolean).join(" ").trim();
    if (!finalName) {
      setSaveError("Name is required.");
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .limit(1);

      const notesText = [
        contact.title && `Title: ${contact.title}`,
        contact.website && `Website: ${contact.website}`,
        contact.notes,
      ].filter(Boolean).join("\n") || null;

      const payload = {
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

      console.log("[scan-review] save payload", payload);

      const { data: newLead, error } = await supabase
        .from("leads")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      if (!newLead?.id) throw new Error("No lead id returned");

      await supabase.from("contact_activities").insert({
        user_id: user.id,
        lead_id: newLead.id,
        activity_type: "card_scanned",
        title: "Business card scanned",
        description: `Contact added via business card scan${contact.company ? ` — ${contact.company}` : ""}`,
        occurred_at: new Date().toISOString(),
      });

      console.log("[scan-review] save SUCCESS, id:", newLead.id);
      sessionStorage.removeItem(DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setSavedLeadId(newLead.id);
      toast.success("Contact saved");
    } catch (err: any) {
      console.error("[scan-review] save FAILED", err);
      setSaveError("Could not save contact. Try again.");
      toast.error("Could not save contact. Try again.");
    } finally {
      setSaving(false);
      console.log("[scan-review] save handler completed");
    }
  }, [contact, contactType, saving, queryClient]);

  const handleSaveClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    console.log("[scan-review] save button clicked");
    e.preventDefault();
    e.stopPropagation();
    void handleSave();
  }, [handleSave]);

  const handleRescan = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    navigate("/app/scan-card", { replace: true });
  };

  if (!contact) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  // SUCCESS state
  if (savedLeadId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/app/contacts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Contact Saved</h1>
        </div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">Contact saved</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" className="flex-1" onClick={() => navigate(`/app/contacts/${savedLeadId}`)}>
              View Contact
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleRescan}>
              Scan Another Card
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // REVIEW state
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={handleRescan}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Review Contact</h1>
          <p className="text-sm text-muted-foreground">Review and save</p>
        </div>
      </div>

      {imagePreview && (
        <div className="relative">
          <img src={imagePreview} alt="Business card" className="w-full rounded-lg border border-border opacity-60" />
          <div className="absolute top-2 right-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleRescan} className="gap-1">
              <X className="h-3 w-3" /> Rescan
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label>Contact Type</Label>
          <Select value={contactType} onValueChange={(v) => { setSaveError(null); setContactType(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Input value={contact.name} onChange={(e) => { setSaveError(null); setContact({ ...contact, name: e.target.value, full_name: e.target.value }); }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>First Name</Label>
            <Input value={contact.first_name || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, first_name: e.target.value }); }} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input value={contact.last_name || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, last_name: e.target.value }); }} />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={contact.email || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, email: e.target.value }); }} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={contact.phone || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, phone: e.target.value }); }} />
        </div>
        <div>
          <Label>Company</Label>
          <Input value={contact.company || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, company: e.target.value }); }} />
        </div>
        <div>
          <Label>Title</Label>
          <Input value={contact.title || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, title: e.target.value, job_title: e.target.value }); }} />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={contact.website || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, website: e.target.value }); }} />
        </div>
        <div>
          <Label>Address</Label>
          <Input value={contact.address || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, address: e.target.value }); }} />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={contact.notes || ""} onChange={(e) => { setSaveError(null); setContact({ ...contact, notes: e.target.value }); }} rows={3} />
        </div>
      </div>

      {saveError && <p className="text-sm text-destructive" role="alert">{saveError}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={handleRescan}>
          Scan Another
        </Button>
        <Button type="button" className="flex-1 gap-2" onClick={handleSaveClick} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Save Contact
        </Button>
      </div>
    </div>
  );
}
