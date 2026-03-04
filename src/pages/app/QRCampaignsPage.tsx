import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Plus, Trash2, Eye, EyeOff, Download, Copy, Check, Smartphone, Monitor, Tablet, TrendingUp, Users, MousePointer, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { QRCodeSVG } from "qrcode.react";
import KPICard from "@/components/KPICard";
import { useAllCampaignStats, useCreateQRCampaign, useToggleQRCampaign, useDeleteQRCampaign, useQRCampaignStats } from "@/hooks/useQRCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRef, useCallback } from "react";

const PLACEMENTS = [
  { value: "truck", label: "Truck / Vehicle" },
  { value: "flyer", label: "Flyer" },
  { value: "yard_sign", label: "Yard Sign" },
  { value: "business_card", label: "Business Card" },
  { value: "poster", label: "Poster" },
  { value: "storefront", label: "Storefront" },
  { value: "mailer", label: "Direct Mail" },
  { value: "other", label: "Other" },
];

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Mobile: <Smartphone className="h-3.5 w-3.5" />,
  Desktop: <Monitor className="h-3.5 w-3.5" />,
  Tablet: <Tablet className="h-3.5 w-3.5" />,
};

export default function QRCampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState("other");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useAllCampaignStats();
  const { data: stats } = useQRCampaignStats(selectedCampaign);
  const createMutation = useCreateQRCampaign();
  const toggleMutation = useToggleQRCampaign();
  const deleteMutation = useDeleteQRCampaign();

  const totalScans = campaigns?.reduce((s, c) => s + c.scans, 0) ?? 0;
  const totalLeads = campaigns?.reduce((s, c) => s + c.leads, 0) ?? 0;
  const overallConversion = totalScans > 0 ? Math.round((totalLeads / totalScans) * 1000) / 10 : 0;

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim(), placement });
    setName("");
    setPlacement("other");
    setShowCreate(false);
  };

  const getQRUrl = (code: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/qr-redirect?code=${code}`;
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(getQRUrl(code));
    setCopied(code);
    toast.success("QR link copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QR Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Track where your leads come from with smart QR codes</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create QR Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Campaign Name</label>
                <Input placeholder="e.g. Spring Yard Signs" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Placement</label>
                <Select value={placement} onValueChange={setPlacement}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!name.trim() || createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating…" : "Create Campaign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={QrCode} title="Total Scans" value={totalScans} change={`${campaigns?.length ?? 0} campaigns`} changeType="neutral" />
        <KPICard icon={Users} title="Leads Generated" value={totalLeads} change="from QR" changeType="neutral" />
        <KPICard icon={TrendingUp} title="Conversion Rate" value={`${overallConversion}%`} change="scans → leads" changeType="neutral" />
        <KPICard icon={BarChart3} title="Active Campaigns" value={campaigns?.filter(c => c.active).length ?? 0} change={`of ${campaigns?.length ?? 0}`} changeType="neutral" />
      </div>

      {/* Campaign list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : !campaigns?.length ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl border border-dashed border-border p-12 text-center">
          <QrCode className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-1">No QR campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a campaign for each physical placement — trucks, flyers, yard signs, and more.</p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create First Campaign
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <CampaignRow
              key={c.id}
              campaign={c}
              index={i}
              isSelected={selectedCampaign === c.id}
              onSelect={() => setSelectedCampaign(selectedCampaign === c.id ? null : c.id)}
              onToggle={(active) => toggleMutation.mutate({ id: c.id, active })}
              onDelete={() => {
                if (selectedCampaign === c.id) setSelectedCampaign(null);
                deleteMutation.mutate(c.id);
              }}
              onCopy={() => handleCopy(c.code)}
              copied={copied === c.code}
              qrUrl={getQRUrl(c.code)}
            />
          ))}
        </div>
      )}

      {/* Campaign detail panel */}
      <AnimatePresence>
        {selectedCampaign && stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <h2 className="font-semibold">Campaign Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">{stats.totalScans}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Scans</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">{stats.leadsGenerated}</p>
                <p className="text-xs text-muted-foreground mt-1">Leads Generated</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Conversion Rate</p>
              </div>
            </div>

            {/* Device breakdown */}
            {stats.devices.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Device Breakdown</h3>
                <div className="space-y-2">
                  {stats.devices.map(d => (
                    <div key={d.device} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                        {DEVICE_ICONS[d.device] ?? <Monitor className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{d.device}</span>
                          <span className="text-muted-foreground text-xs">{d.count} ({d.pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${d.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent scans */}
            {stats.recentScans.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Scans</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {stats.recentScans.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        {DEVICE_ICONS[s.device ?? "Desktop"] ?? <Monitor className="h-3 w-3" />}
                        <span className="text-muted-foreground">{s.device}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(s.created_at), "MMM d, h:mm a")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Campaign Row ──
function CampaignRow({
  campaign, index, isSelected, onSelect, onToggle, onDelete, onCopy, copied, qrUrl,
}: {
  campaign: any;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
  onCopy: () => void;
  copied: boolean;
  qrUrl: string;
}) {
  const svgRef = useRef<HTMLDivElement>(null);
  const placementLabel = PLACEMENTS.find(p => p.value === campaign.placement)?.label ?? campaign.placement;

  const handleDownload = useCallback(() => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 600;
    canvas.height = 600;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 600, 600);
      const link = document.createElement("a");
      link.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }, [campaign.name]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-xl border bg-card p-4 transition-all ${isSelected ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/30"}`}
    >
      <div className="flex items-center gap-4">
        {/* QR preview */}
        <div ref={svgRef} className="shrink-0 p-2 bg-white rounded-lg cursor-pointer" onClick={onSelect}>
          <QRCodeSVG value={qrUrl} size={56} level="M" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm truncate">{campaign.name}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">{placementLabel}</Badge>
            {!campaign.active && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{campaign.scans} scans</span>
            <span>{campaign.leads} leads</span>
            <span>{campaign.conversionRate}% conv.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Switch checked={campaign.active} onCheckedChange={onToggle} />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
