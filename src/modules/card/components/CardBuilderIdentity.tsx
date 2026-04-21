import { useState, useRef } from "react";
import { Pencil, Loader2, Check, ChevronDown, ScanLine, Camera, Upload, X, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  profile: any;
  editName: string | null;
  setEditName: (v: string | null) => void;
  editCompany: string | null;
  setEditCompany: (v: string | null) => void;
  editJobTitle: string | null;
  setEditJobTitle: (v: string | null) => void;
  jobTitle: string | null;
  setJobTitle: (v: string | null) => void;
  boldLastName: boolean;
  setBoldLastName: (v: boolean) => void;
  uppercaseName: boolean;
  setUppercaseName: (v: boolean) => void;
  nameLetterSpacing: number;
  setNameLetterSpacing: (v: number) => void;
  nameFontWeight: number;
  setNameFontWeight: (v: number) => void;
  firstNameFontWeight: number | null;
  setFirstNameFontWeight: (v: number | null) => void;
  nameItalic: boolean;
  setNameItalic: (v: boolean) => void;
  nameFontSize: number | null;
  setNameFontSize: (v: number | null) => void;
  subtitleFontSize: number | null;
  setSubtitleFontSize: (v: number | null) => void;
  subtitleItalic: boolean;
  setSubtitleItalic: (v: boolean) => void;
  subtitleSpacing: number | null;
  setSubtitleSpacing: (v: number | null) => void;
  showCompany: boolean;
  setShowCompany: (v: boolean) => void;
  companyColor: string | null;
  setCompanyColor: (v: string | null) => void;
  nameLineHeight: number | null;
  setNameLineHeight: (v: number | null) => void;
  nameTextStroke: boolean;
  setNameTextStroke: (v: boolean) => void;
  nameTextStrokeWidth: number;
  setNameTextStrokeWidth: (v: number) => void;
  professionName: string;
  identitySaveTimers: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  identitySaveState: Record<string, "saving" | "saved" | null>;
  setIdentitySaveState: React.Dispatch<React.SetStateAction<Record<string, "saving" | "saved" | null>>>;
  saveThemeField: (fields: Record<string, any>) => void;
  qc: any;
  hideWrapper?: boolean;
}

function SaveIndicator({ state }: { state: "saving" | "saved" | null }) {
  if (state === "saving") return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  if (state === "saved") return <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium"><Check className="h-3 w-3" />Saved</span>;
  return null;
}

export default function CardBuilderIdentity({
  profile, editName, setEditName, editCompany, setEditCompany,
  editJobTitle, setEditJobTitle, jobTitle, setJobTitle, boldLastName, setBoldLastName,
  uppercaseName, setUppercaseName,
  nameLetterSpacing, setNameLetterSpacing,
  nameFontWeight, setNameFontWeight,
  firstNameFontWeight, setFirstNameFontWeight,
  nameItalic, setNameItalic,
  nameFontSize, setNameFontSize,
  subtitleFontSize, setSubtitleFontSize,
  subtitleItalic, setSubtitleItalic,
  subtitleSpacing, setSubtitleSpacing,
  showCompany, setShowCompany,
  companyColor, setCompanyColor,
  nameLineHeight, setNameLineHeight,
  nameTextStroke, setNameTextStroke,
  nameTextStrokeWidth, setNameTextStrokeWidth,
  professionName, identitySaveTimers, identitySaveState, setIdentitySaveState,
  saveThemeField, qc, hideWrapper,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── Card scanner state (Item 3) ──
  type ScanStep = "idle" | "preview" | "running" | "review";
  const [scanOpen, setScanOpen] = useState(false);
  const [scanStep, setScanStep] = useState<ScanStep>("idle");
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [scanned, setScanned] = useState<{
    name: string; job_title: string; company: string;
    phone: string; email: string; website: string;
  }>({ name: "", job_title: "", company: "", phone: "", email: "", website: "" });
  const scanCameraRef = useRef<HTMLInputElement>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);

  const resetScanner = () => {
    if (scanPreview) URL.revokeObjectURL(scanPreview);
    setScanFile(null);
    setScanPreview(null);
    setScanError(null);
    setScanStep("idle");
    setScanned({ name: "", job_title: "", company: "", phone: "", email: "", website: "" });
  };

  const handleScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setScanFile(f);
    setScanError(null);
    setScanPreview(URL.createObjectURL(f));
    setScanStep("preview");
    e.target.value = "";
  };

  const prepareBase64 = async (f: File): Promise<string> => {
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
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const runScan = async () => {
    if (!scanFile) return;
    setScanStep("running");
    setScanError(null);
    try {
      const base64 = await prepareBase64(scanFile);
      const { data, error } = await supabase.functions.invoke("scan-business-card-public", {
        body: { image: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const c = data?.contact;
      if (!c || !c.name) throw new Error("Could not read this card. Try a clearer photo.");
      setScanned({
        name: c.name ?? "",
        job_title: c.job_title ?? "",
        company: c.company ?? "",
        phone: c.phone ?? "",
        email: c.email ?? "",
        website: c.website ?? "",
      });
      setScanStep("review");
    } catch (err: any) {
      setScanError(err?.message || "Scan failed");
      setScanStep("preview");
    }
  };

  const applyScan = async () => {
    if (!profile || applying) return;
    setApplying(true);
    try {
      // 1) Identity fields handled via existing setters / theme (no separate save path)
      const name = scanned.name.trim();
      const jt = scanned.job_title.trim();
      const co = scanned.company.trim();

      const profilePatch: Record<string, any> = {};
      if (name) profilePatch.name = name;
      if (co) profilePatch.company = co;
      // Profiles contact fields — same column names SettingsPage patches
      const phone = scanned.phone.trim();
      const email = scanned.email.trim();
      const website = scanned.website.trim();
      if (phone) profilePatch.phone = phone;
      if (email) profilePatch.email = email;
      if (website) profilePatch.website = website;

      if (Object.keys(profilePatch).length > 0) {
        const { error } = await supabase.from("profiles").update(profilePatch).eq("id", profile.id);
        if (error) throw error;
      }

      // Mirror identity values into the in-memory builder state via existing setters
      if (name) setEditName(name);
      if (co) {
        setEditCompany(co);
        if (!showCompany) setShowCompany(true);
      }
      if (jt) {
        setJobTitle(jt);
        setEditJobTitle(null);
        saveThemeField({ job_title: jt });
      }

      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["public-card"] });

      toast.success("Card details applied — review and tweak below");
      resetScanner();
      setScanOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply scanned values");
    } finally {
      setApplying(false);
    }
  };

  const makeHandler = (field: string, dbField: string, setter: (v: string | null) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setter(val);
      setIdentitySaveState(s => ({ ...s, [field]: "saving" }));
      clearTimeout(identitySaveTimers.current[field]);
      identitySaveTimers.current[field] = setTimeout(async () => {
        if (!profile) return;
        if (dbField === "job_title") {
          const trimmed = val.trim() || null;
          setJobTitle(trimmed);
          setter(null);
          saveThemeField({ job_title: trimmed });
        } else {
          const { supabase } = await import("@/integrations/supabase/client");
          const { error } = await supabase.from("profiles").update({ [dbField]: val }).eq("id", profile.id);
          if (error) {
            toast.error(`Failed to save ${field}`);
            setIdentitySaveState(s => ({ ...s, [field]: null }));
            return;
          }
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["public-card"] });
          setter(null);
        }
        setIdentitySaveState(s => ({ ...s, [field]: "saved" }));
        setTimeout(() => setIdentitySaveState(s => s[field] === "saved" ? { ...s, [field]: null } : s), 2000);
      }, 800);
    };

  return (
    <div className={hideWrapper ? "space-y-3" : "rounded-xl border border-border bg-card p-4 space-y-3"}>
      {!hideWrapper && (
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Identity</h2>
        </div>
      )}

      {/* ── Scan Your Card (Item 3) ── */}
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
        {scanStep === "idle" && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ScanLine className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Scan your card</p>
                  <p className="text-[10px] text-muted-foreground truncate">Auto-fill name, title, company & contact info</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" className="flex-1 gap-1.5 h-8" onClick={() => scanCameraRef.current?.click()}>
                <Camera className="h-3.5 w-3.5" /> Take Photo
              </Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 gap-1.5 h-8" onClick={() => scanFileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Upload
              </Button>
            </div>
            <input ref={scanCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanFile} />
            <input ref={scanFileRef} type="file" accept="image/*" className="hidden" onChange={handleScanFile} />
          </>
        )}

        {scanStep === "preview" && scanPreview && (
          <div className="space-y-2">
            <img src={scanPreview} alt="Card preview" className="w-full rounded-md border border-border max-h-48 object-contain bg-background" />
            {scanError && <p className="text-[11px] text-destructive text-center">{scanError}</p>}
            <div className="flex gap-2">
              <Button type="button" size="sm" className="flex-1 gap-1.5 h-8" onClick={runScan}>
                <ScanLine className="h-3.5 w-3.5" /> Read Card
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8" onClick={resetScanner}>
                <RotateCcw className="h-3.5 w-3.5" /> Retake
              </Button>
            </div>
          </div>
        )}

        {scanStep === "running" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Reading card…</span>
          </div>
        )}

        {scanStep === "review" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Review & confirm</p>
              <button type="button" onClick={resetScanner} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Edit anything that's wrong, then apply.</p>
            <div className="grid grid-cols-1 gap-1.5">
              <Input className="h-8 text-xs" placeholder="Name" value={scanned.name} onChange={(e) => setScanned(s => ({ ...s, name: e.target.value }))} />
              <Input className="h-8 text-xs" placeholder="Job title" value={scanned.job_title} onChange={(e) => setScanned(s => ({ ...s, job_title: e.target.value }))} />
              <Input className="h-8 text-xs" placeholder="Company" value={scanned.company} onChange={(e) => setScanned(s => ({ ...s, company: e.target.value }))} />
              <Input className="h-8 text-xs" placeholder="Phone" value={scanned.phone} onChange={(e) => setScanned(s => ({ ...s, phone: e.target.value }))} />
              <Input className="h-8 text-xs" placeholder="Email" value={scanned.email} onChange={(e) => setScanned(s => ({ ...s, email: e.target.value }))} />
              <Input className="h-8 text-xs" placeholder="Website" value={scanned.website} onChange={(e) => setScanned(s => ({ ...s, website: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" size="sm" className="flex-1 gap-1.5 h-8" disabled={applying || !scanned.name.trim()} onClick={applyScan}>
                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {applying ? "Applying…" : "Apply to my card"}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={resetScanner}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Basic Fields ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Display Name</label>
          <SaveIndicator state={identitySaveState.name ?? null} />
        </div>
        <Input value={editName ?? profile?.name ?? ""} onChange={makeHandler("name", "name", setEditName)} placeholder="Your Name" className="text-sm" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Job Title</label>
          <SaveIndicator state={identitySaveState.jobTitle ?? null} />
        </div>
        <Input value={editJobTitle ?? jobTitle ?? ""} onChange={makeHandler("jobTitle", "job_title", setEditJobTitle)} placeholder={professionName} className="text-sm" />
        {jobTitle && <p className="text-[10px] text-muted-foreground">Clear to use default: {professionName}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Company</label>
          <div className="flex items-center gap-2">
            <SaveIndicator state={identitySaveState.company ?? null} />
            <Switch
              checked={showCompany}
              onCheckedChange={(v) => { setShowCompany(v); saveThemeField({ show_company: v }); }}
              className="scale-75 origin-right"
            />
          </div>
        </div>
        {showCompany && (
          <Input value={editCompany ?? profile?.company ?? ""} onChange={makeHandler("company", "company", setEditCompany)} placeholder="Your Company" className="text-sm" />
        )}
      </div>

      {/* ── Advanced Typography ── */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-1.5 px-1 group rounded-lg hover:bg-accent/30 transition-colors duration-150 mt-1">
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Advanced Typography</span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground/50 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {/* Name styling */}
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Bold last name</label>
            <Switch checked={boldLastName} onCheckedChange={(v) => { setBoldLastName(v); saveThemeField({ bold_last_name: v }); }} className="scale-75 origin-right" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Uppercase name</label>
            <Switch checked={uppercaseName} onCheckedChange={(v) => { setUppercaseName(v); saveThemeField({ uppercase_name: v }); }} className="scale-75 origin-right" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Italic name</label>
            <Switch checked={nameItalic} onCheckedChange={(v) => { setNameItalic(v); saveThemeField({ name_italic: v }); }} className="scale-75 origin-right" />
          </div>

          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-muted-foreground">Name size</label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{nameFontSize ?? "Auto"}</span>
            </div>
            <Slider min={14} max={48} step={1} value={[nameFontSize ?? 22]} onValueChange={([v]) => { setNameFontSize(v); saveThemeField({ name_font_size: v }); }} className="w-full" />
            {nameFontSize !== null && (
              <button type="button" onClick={() => { setNameFontSize(null); saveThemeField({ name_font_size: null }); }} className="text-[10px] text-primary hover:underline mt-0.5">Reset</button>
            )}
          </div>

          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-muted-foreground">Name weight</label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{nameFontWeight}</span>
            </div>
            <Slider min={100} max={900} step={100} value={[nameFontWeight]} onValueChange={([v]) => { setNameFontWeight(v); saveThemeField({ name_font_weight: v }); }} className="w-full" />
          </div>

          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-muted-foreground">First name weight</label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{firstNameFontWeight ?? "Same"}</span>
            </div>
            <Slider min={100} max={900} step={100} value={[firstNameFontWeight ?? nameFontWeight]} onValueChange={([v]) => { setFirstNameFontWeight(v); saveThemeField({ first_name_font_weight: v }); }} className="w-full" />
            {firstNameFontWeight !== null && (
              <button type="button" onClick={() => { setFirstNameFontWeight(null); saveThemeField({ first_name_font_weight: null }); }} className="text-[10px] text-primary hover:underline mt-0.5">Reset</button>
            )}
          </div>

          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-muted-foreground">Letter spacing</label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{nameLetterSpacing > 0 ? `+${nameLetterSpacing}` : nameLetterSpacing}px</span>
            </div>
            <Slider min={-2} max={12} step={0.5} value={[nameLetterSpacing]} onValueChange={([v]) => { setNameLetterSpacing(v); saveThemeField({ name_letter_spacing: v }); }} className="w-full" />
          </div>

          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-muted-foreground">Line spacing</label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{nameLineHeight != null ? `${nameLineHeight}` : "Auto"}</span>
            </div>
            <Slider min={0.8} max={3} step={0.1} value={[nameLineHeight ?? 1.4]} onValueChange={([v]) => { setNameLineHeight(v); saveThemeField({ name_line_height: v }); }} className="w-full" />
            {nameLineHeight !== null && (
              <button type="button" onClick={() => { setNameLineHeight(null); saveThemeField({ name_line_height: null }); }} className="text-[10px] text-primary hover:underline mt-0.5">Reset</button>
            )}
          </div>

          {/* Subtitle styling */}
          <div className="h-px bg-border/30 my-2" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Subtitle</span>

          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-muted-foreground">Subtitle size</label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{subtitleFontSize ?? "Auto"}</span>
            </div>
            <Slider min={10} max={24} step={1} value={[subtitleFontSize ?? 14]} onValueChange={([v]) => { setSubtitleFontSize(v); saveThemeField({ subtitle_font_size: v }); }} className="w-full" />
            {subtitleFontSize !== null && (
              <button type="button" onClick={() => { setSubtitleFontSize(null); saveThemeField({ subtitle_font_size: null }); }} className="text-[10px] text-primary hover:underline mt-0.5">Reset</button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Italic subtitle</label>
            <Switch checked={subtitleItalic} onCheckedChange={(v) => { setSubtitleItalic(v); saveThemeField({ subtitle_italic: v }); }} className="scale-75 origin-right" />
          </div>

          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-muted-foreground">Title–company gap</label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{subtitleSpacing ?? "Auto"}</span>
            </div>
            <Slider min={0} max={24} step={1} value={[subtitleSpacing ?? 4]} onValueChange={([v]) => { setSubtitleSpacing(v); saveThemeField({ subtitle_spacing: v }); }} className="w-full" />
            {subtitleSpacing !== null && (
              <button type="button" onClick={() => { setSubtitleSpacing(null); saveThemeField({ subtitle_spacing: null }); }} className="text-[10px] text-primary hover:underline mt-0.5">Reset</button>
            )}
          </div>

          {showCompany && (
            <div className="flex items-center justify-between mt-1">
              <label className="text-[11px] text-muted-foreground">Company color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={companyColor || "#888888"}
                  onChange={(e) => { setCompanyColor(e.target.value); saveThemeField({ company_color: e.target.value }); }}
                  className="w-6 h-6 rounded border border-border cursor-pointer p-0"
                  style={{ WebkitAppearance: "none", appearance: "none", background: "none" }}
                />
                {companyColor && (
                  <button type="button" onClick={() => { setCompanyColor(null); saveThemeField({ company_color: null }); }} className="text-[10px] text-primary hover:underline">Reset</button>
                )}
              </div>
            </div>
          )}

          {/* Text stroke */}
          <div className="h-px bg-border/30 my-2" />
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Text outline</label>
            <Switch checked={nameTextStroke} onCheckedChange={(v) => { setNameTextStroke(v); saveThemeField({ name_text_stroke: v }); }} className="scale-75 origin-right" />
          </div>
          {nameTextStroke && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-muted-foreground">Outline weight</label>
                <span className="text-[10px] text-muted-foreground tabular-nums">{nameTextStrokeWidth}px</span>
              </div>
              <Slider min={0.5} max={4} step={0.5} value={[nameTextStrokeWidth]} onValueChange={([v]) => { setNameTextStrokeWidth(v); saveThemeField({ name_text_stroke_width: v }); }} className="w-full" />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
