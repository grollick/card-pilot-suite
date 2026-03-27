import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MOCK_OCR = {
  first_name: "Jane",
  last_name: "Doe",
  company: "Acme Corp",
  phone: "555-123-4567",
  email: "jane.doe@acme.com",
};

export default function ScannerDiagnostic() {
  const { user } = useAuth();
  const [fields, setFields] = useState(MOCK_OCR);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    console.log("[diag] page mounted");
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log("[diag] beforeunload fired!");
    };
    const onUnload = () => {
      console.log("[diag] unload fired!");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("unload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("unload", onUnload);
    };
  }, []);

  const handleChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = useCallback(async () => {
    console.log("[diag] save button clicked");
    if (!user) {
      setStatus("Not authenticated");
      return;
    }
    setSaving(true);
    setStatus("");
    const fullName = `${fields.first_name} ${fields.last_name}`.trim();
    const payload = {
      name: fullName || "Unknown",
      email: fields.email || null,
      phone: fields.phone || null,
      company: fields.company || null,
      source: "business_card" as const,
      user_id: user.id,
    };
    console.log("[diag] save handler started, payload:", payload);

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[diag] save FAILED:", error);
      setStatus(`Error: ${error.message}`);
    } else {
      console.log("[diag] save SUCCESS, id:", data.id);
      setSavedId(data.id);
      setStatus(`Contact saved! ID: ${data.id}`);
    }
    setSaving(false);
    console.log("[diag] save handler completed");
  }, [fields, user]);

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Scanner Diagnostic (Standalone)
      </h1>
      <p style={{ fontSize: 12, marginBottom: 16, color: "#888" }}>
        No parent form. No router wrappers. Pure save test.
      </p>

      {Object.entries(fields).map(([key, value]) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <Label>{key}</Label>
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      ))}

      <Button
        type="button"
        disabled={saving}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("[diag] click event intercepted, calling handleSave");
          void handleSave();
        }}
        style={{ marginTop: 8, width: "100%" }}
      >
        {saving ? "Saving…" : "Save Contact"}
      </Button>

      {status && (
        <p style={{ marginTop: 16, fontWeight: 600, fontSize: 14 }}>{status}</p>
      )}

      {savedId && (
        <Button
          type="button"
          variant="outline"
          onClick={() => console.log("[diag] view contact clicked, id:", savedId)}
          style={{ marginTop: 8, width: "100%" }}
        >
          View Contact (logged only)
        </Button>
      )}
    </div>
  );
}
