import { Pencil, Loader2, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  professionName, identitySaveTimers, identitySaveState, setIdentitySaveState,
  saveThemeField, qc, hideWrapper,
}: Props) {
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Display Name</label>
          <SaveIndicator state={identitySaveState.name ?? null} />
        </div>
        <Input value={editName ?? profile?.name ?? ""} onChange={makeHandler("name", "name", setEditName)} placeholder="Your Name" className="text-sm" />
        <div className="flex items-center justify-between mt-1">
          <label className="text-[11px] text-muted-foreground">Bold last name</label>
          <Switch
            checked={boldLastName}
            onCheckedChange={(v) => { setBoldLastName(v); saveThemeField({ bold_last_name: v }); }}
            className="scale-75 origin-right"
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <label className="text-[11px] text-muted-foreground">Uppercase name</label>
          <Switch
            checked={uppercaseName}
            onCheckedChange={(v) => { setUppercaseName(v); saveThemeField({ uppercase_name: v }); }}
            className="scale-75 origin-right"
          />
        </div>
        <div className="mt-1.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-muted-foreground">Letter spacing</label>
            <span className="text-[10px] text-muted-foreground tabular-nums">{nameLetterSpacing > 0 ? `+${nameLetterSpacing}` : nameLetterSpacing}px</span>
          </div>
          <Slider
            min={-2}
            max={12}
            step={0.5}
            value={[nameLetterSpacing]}
            onValueChange={([v]) => { setNameLetterSpacing(v); saveThemeField({ name_letter_spacing: v }); }}
            className="w-full"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Company / Title</label>
          <SaveIndicator state={identitySaveState.company ?? null} />
        </div>
        <Input value={editCompany ?? profile?.company ?? ""} onChange={makeHandler("company", "company", setEditCompany)} placeholder="Your Company" className="text-sm" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Job Title</label>
          <SaveIndicator state={identitySaveState.jobTitle ?? null} />
        </div>
        <Input value={editJobTitle ?? jobTitle ?? ""} onChange={makeHandler("jobTitle", "job_title", setEditJobTitle)} placeholder={professionName} className="text-sm" />
        {jobTitle && <p className="text-[10px] text-muted-foreground">Clear to use default: {professionName}</p>}
      </div>
    </div>
  );
}
