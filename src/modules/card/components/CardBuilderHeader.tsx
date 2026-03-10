import { Globe, Loader2, Cloud, CloudOff, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import QRShareDialog from "./QRShareDialog";
import NFCShareDialog from "./NFCShareDialog";
import WalletPassDialog from "./WalletPassDialog";

interface Props {
  globalSaveState: "idle" | "saving" | "saved" | "error";
  published: boolean;
  onPublishToggle: (val: boolean) => void;
  handle?: string | null;
  name?: string | null;
}

export default function CardBuilderHeader({ globalSaveState, published, onPublishToggle, handle, name }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div className="space-y-0.5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Card Builder</h1>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
            globalSaveState === "saving" ? "bg-primary/10 text-primary"
            : globalSaveState === "saved" ? "bg-emerald-500/10 text-emerald-600"
            : globalSaveState === "error" ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
          }`}>
            {globalSaveState === "saving" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            {globalSaveState === "saved" && <Cloud className="h-2.5 w-2.5" />}
            {globalSaveState === "error" && <CloudOff className="h-2.5 w-2.5" />}
            {globalSaveState === "idle" && <Cloud className="h-2.5 w-2.5" />}
            {globalSaveState === "saving" ? "Saving…" : globalSaveState === "saved" ? "Saved" : globalSaveState === "error" ? "Error" : "Synced"}
          </span>
        </div>
        {handle && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            cardpilot.com/{handle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${published ? "text-emerald-600" : "text-muted-foreground"}`}>
            {published ? "Live" : "Draft"}
          </span>
          <Switch checked={published} onCheckedChange={onPublishToggle} className="scale-90" />
        </div>
        {handle && (
          <div className="flex items-center gap-1 ml-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Copy card link"
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${handle}`); toast.success("Link copied!"); }}
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
            <QRShareDialog url={`${window.location.origin}/${handle}`} name={name || "Card"} />
            <NFCShareDialog url={`${window.location.origin}/${handle}`} name={name || "Card"} />
            <WalletPassDialog handle={handle} name={name || "Card"} />
          </div>
        )}
      </div>
    </div>
  );
}
