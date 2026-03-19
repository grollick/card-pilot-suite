import {
  Globe, Loader2, Cloud, CloudOff, Link2, Eye, ChevronLeft, Wifi,
  Smartphone, Tablet, Save,
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
  previewDevice: "phone" | "tablet";
  onPreviewDeviceChange: (d: "phone" | "tablet") => void;
}

export default function CardBuilderHeader({
  globalSaveState, published, onPublishToggle, handle, name,
  previewDevice, onPreviewDeviceChange,
}: Props) {
  const navigate = useNavigate();
  const [networkingOpen, setNetworkingOpen] = useState(false);

  const saveLabel = globalSaveState === "saving" ? "Saving…" : globalSaveState === "saved" ? "Saved" : globalSaveState === "error" ? "Error" : "Synced";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-11 flex items-center justify-between px-3 border-b border-border/60 bg-card/95 backdrop-blur-sm shrink-0">
        {/* ── Left: Back + Card name + Save status ── */}
        <div className="flex items-center gap-2 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate("/app")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Dashboard</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold truncate max-w-[160px] text-foreground">
              {name || "Untitled Card"}
            </h1>
            <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 transition-colors ${
              globalSaveState === "saving" ? "text-primary"
              : globalSaveState === "saved" ? "text-muted-foreground"
              : globalSaveState === "error" ? "text-destructive"
              : "text-muted-foreground"
            }`}>
              {globalSaveState === "saving" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              {globalSaveState === "saved" && <Cloud className="h-2.5 w-2.5" />}
              {globalSaveState === "error" && <CloudOff className="h-2.5 w-2.5" />}
              {globalSaveState === "idle" && <Cloud className="h-2.5 w-2.5" />}
              <span className="hidden sm:inline">{saveLabel}</span>
            </div>
          </div>
        </div>

        {/* ── Center: Device preview toggle ── */}
        <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5">
          {([
            { id: "phone" as const, icon: Smartphone, label: "Phone" },
            { id: "tablet" as const, icon: Tablet, label: "Tablet" },
          ]).map((d) => (
            <Tooltip key={d.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPreviewDeviceChange(d.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
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

        {/* ── Right: Preview + Share + Publish ── */}
        <div className="flex items-center gap-1">
          {handle && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <a href={`/${handle}`} target="_blank" rel="noreferrer">
                      <Eye className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Preview</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${handle}`); toast.success("Link copied!"); }}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy link</TooltipContent>
              </Tooltip>

              <QRShareDialog url={`${window.location.origin}/${handle}`} name={name || "Card"} />
              <NFCShareDialog url={`${window.location.origin}/${handle}`} name={name || "Card"} />
              <WalletPassDialog handle={handle} name={name || "Card"} />
            </>
          )}

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Publish */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2 py-1">
            <Badge variant={published ? "default" : "secondary"} className={`text-[10px] px-1.5 py-0 font-semibold uppercase ${published ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" : ""}`}>
              {published ? "Live" : "Draft"}
            </Badge>
            <Switch checked={published} onCheckedChange={onPublishToggle} className="scale-[0.8]" />
          </div>

          {handle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1 text-[11px] ml-1"
                  onClick={() => setNetworkingOpen(true)}
                >
                  <Wifi className="h-3 w-3" /> Share
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open Networking Mode</TooltipContent>
            </Tooltip>
          )}

          <NetworkingModeDialog open={networkingOpen} onOpenChange={setNetworkingOpen} />
        </div>
      </div>
    </TooltipProvider>
  );
}
