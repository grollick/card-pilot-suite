import {
  Globe, Loader2, Cloud, CloudOff, Link2, Undo2, Redo2,
  Eye, Smartphone, Tablet, Monitor, Send, ChevronLeft, Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import QRShareDialog from "./QRShareDialog";
import NFCShareDialog from "./NFCShareDialog";
import WalletPassDialog from "./WalletPassDialog";
import NetworkingModeDialog from "./NetworkingModeDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  globalSaveState: "idle" | "saving" | "saved" | "error";
  published: boolean;
  onPublishToggle: (val: boolean) => void;
  handle?: string | null;
  name?: string | null;
  // Preview device
  previewDevice: "phone" | "tablet";
  onPreviewDeviceChange: (d: "phone" | "tablet") => void;
}

export default function CardBuilderHeader({
  globalSaveState, published, onPublishToggle, handle, name,
  previewDevice, onPreviewDeviceChange,
}: Props) {
  const navigate = useNavigate();
  const [networkingOpen, setNetworkingOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-card shrink-0">
        {/* ── Left: Back + Card name ── */}
        <div className="flex items-center gap-2 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/app")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Dashboard</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold truncate max-w-[180px]">
              {name || "Untitled Card"}
            </h1>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
              globalSaveState === "saving" ? "bg-primary/10 text-primary"
              : globalSaveState === "saved" ? "bg-emerald-500/10 text-emerald-600"
              : globalSaveState === "error" ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
            }`}>
              {globalSaveState === "saving" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              {globalSaveState === "saved" && <Cloud className="h-2.5 w-2.5" />}
              {globalSaveState === "error" && <CloudOff className="h-2.5 w-2.5" />}
              {globalSaveState === "idle" && <Cloud className="h-2.5 w-2.5" />}
              {globalSaveState === "saving" ? "Saving" : globalSaveState === "saved" ? "Saved" : globalSaveState === "error" ? "Error" : "Synced"}
            </span>
          </div>
        </div>

        {/* ── Center: Device preview toggle ── */}
        <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5">
          {([
            { id: "phone" as const, icon: Smartphone, label: "Mobile" },
            { id: "tablet" as const, icon: Tablet, label: "Tablet" },
          ]).map((d) => (
            <Tooltip key={d.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPreviewDeviceChange(d.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    previewDevice === d.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <d.icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{d.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{d.label} preview</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-1.5">
          {handle && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`/${handle}`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Preview as visitor</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${handle}`); toast.success("Link copied!"); }}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy link</TooltipContent>
              </Tooltip>

              <QRShareDialog url={`${window.location.origin}/${handle}`} name={name || "Card"} />
              <NFCShareDialog url={`${window.location.origin}/${handle}`} name={name || "Card"} />
              <WalletPassDialog handle={handle} name={name || "Card"} />
            </>
          )}

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Publish toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1">
            <Badge variant={published ? "default" : "secondary"} className={`text-[10px] px-1.5 py-0 font-semibold uppercase ${published ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" : ""}`}>
              {published ? "Live" : "Draft"}
            </Badge>
            <Switch checked={published} onCheckedChange={onPublishToggle} className="scale-90" />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
