import { useState, useRef, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useProfile } from "@/hooks/useCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQRCampaigns, useQRCampaignStats } from "@/hooks/useQRCampaigns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Download, Copy, Check, Share2, QrCode, Mail, Image,
  FileText, Truck, Flag, Receipt, Palette, ScanLine,
  TrendingUp, Users, Calendar, BarChart3, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ── Style presets ──
const QR_STYLES = [
  { key: "classic", label: "Classic", cornerRadius: 0, dotStyle: "square" },
  { key: "rounded", label: "Rounded", cornerRadius: 8, dotStyle: "rounded" },
  { key: "dots", label: "Dots", cornerRadius: 50, dotStyle: "dots" },
] as const;

// ── Print template definitions ──
const PRINT_TEMPLATES = [
  { key: "business-card", label: "Business Card", icon: QrCode, size: "3.5\" × 2\"", desc: "Standard business card with QR" },
  { key: "flyer", label: "Flyer", icon: FileText, size: "8.5\" × 11\"", desc: "Full-page flyer with QR footer" },
  { key: "yard-sign", label: "Yard Sign", icon: Flag, size: "24\" × 18\"", desc: "Large outdoor sign" },
  { key: "vehicle", label: "Vehicle Decal", icon: Truck, size: "12\" × 12\"", desc: "Vehicle-ready sticker" },
  { key: "invoice", label: "Invoice Footer", icon: Receipt, size: "Custom", desc: "Add to invoices & receipts" },
];

export default function QRBusinessCard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: campaigns } = useQRCampaigns();

  // ── QR customization state ──
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(280);
  const [styleKey, setStyleKey] = useState<string>("classic");
  const [showLogo, setShowLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // ── Analytics ──
  const firstCampaign = campaigns?.[0] ?? null;
  const { data: stats } = useQRCampaignStats(firstCampaign?.id ?? null);

  const handle = profile?.handle;
  const cardUrl = handle ? `${window.location.origin}/${handle}` : "";
  const logoUrl = profile?.avatar_url || undefined;

  // ── Download helpers ──
  const getSvgElement = () => qrRef.current?.querySelector("svg");

  const downloadPNG = useCallback((scale = 2) => {
    const svg = getSvgElement();
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = qrSize * scale;
    canvas.height = qrSize * scale;
    const ctx = canvas.getContext("2d")!;
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = `${handle || "card"}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG downloaded!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [qrSize, bgColor, handle]);

  const downloadSVG = useCallback(() => {
    const svg = getSvgElement();
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `${handle || "card"}-qr.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("SVG downloaded!");
  }, [handle]);

  const downloadPDF = useCallback(() => {
    // Generate a high-res PNG and open print dialog as PDF workaround
    const svg = getSvgElement();
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const scale = 4;
    canvas.width = qrSize * scale;
    canvas.height = qrSize * scale;
    const ctx = canvas.getContext("2d")!;
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      const win = window.open();
      if (win) {
        win.document.write(`
          <html><head><title>QR Code - ${handle}</title>
          <style>@media print { body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; } img { max-width: 80vmin; } }</style>
          </head><body><img src="${dataUrl}" /><script>setTimeout(()=>window.print(),300)<\/script></body></html>
        `);
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    toast.success("Print dialog opening…");
  }, [qrSize, bgColor, handle]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [cardUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${profile?.name}'s Card`, url: cardUrl }); } catch {}
    } else {
      handleCopy();
    }
  }, [profile?.name, cardUrl, handleCopy]);

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(`Check out my digital business card`);
    const body = encodeURIComponent(`Hi,\n\nHere's my digital business card: ${cardUrl}\n\nScan the QR code or click the link to view it.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [cardUrl]);

  // ── Scan analytics data ──
  const scansByDay = useMemo(() => {
    if (!stats?.recentScans) return [];
    const byDay: Record<string, number> = {};
    stats.recentScans.forEach((s: any) => {
      const day = new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay[day] = (byDay[day] || 0) + 1;
    });
    return Object.entries(byDay).map(([day, scans]) => ({ day, scans }));
  }, [stats]);

  if (!handle) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Set up your card first</h2>
        <p className="text-muted-foreground">Complete your card in the Card Editor to generate your QR code.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            QR Business Card
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share your digital card anywhere with a scannable QR code
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <ScanLine className="h-3 w-3 mr-1" />
          {stats?.totalScans ?? 0} total scans
        </Badge>
      </div>

      <Tabs defaultValue="customize" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="customize">
            <Palette className="h-4 w-4 mr-1.5" /> Customize
          </TabsTrigger>
          <TabsTrigger value="download">
            <Download className="h-4 w-4 mr-1.5" /> Download
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Image className="h-4 w-4 mr-1.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ═══ CUSTOMIZE TAB ═══ */}
        <TabsContent value="customize">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview */}
            <Card className="dash-card">
              <CardContent className="pt-6 flex flex-col items-center gap-4">
                <div
                  ref={qrRef}
                  className="p-6 rounded-2xl shadow-sm transition-all"
                  style={{ backgroundColor: bgColor }}
                >
                  <QRCodeSVG
                    value={cardUrl}
                    size={qrSize}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    level="H"
                    includeMargin={false}
                    imageSettings={showLogo && logoUrl ? {
                      src: logoUrl,
                      height: qrSize * 0.2,
                      width: qrSize * 0.2,
                      excavate: true,
                    } : undefined}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center break-all max-w-[280px]">
                  {cardUrl}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-1" /> Share
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleEmailShare}>
                    <Mail className="h-4 w-4 mr-1" /> Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="dash-card">
              <CardHeader>
                <CardTitle className="text-base">Customize QR Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Style */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Style</Label>
                  <Select value={styleKey} onValueChange={setStyleKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QR_STYLES.map(s => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Foreground</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="h-9 w-9 rounded-md border border-input cursor-pointer"
                      />
                      <Input
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Background</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-9 w-9 rounded-md border border-input cursor-pointer"
                      />
                      <Input
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label className="text-sm">Size: {qrSize}px</Label>
                  <Slider
                    value={[qrSize]}
                    onValueChange={([v]) => setQrSize(v)}
                    min={160}
                    max={400}
                    step={8}
                  />
                </div>

                {/* Logo */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Center Logo</Label>
                    <p className="text-xs text-muted-foreground">Add your profile photo to the center</p>
                  </div>
                  <Switch checked={showLogo} onCheckedChange={setShowLogo} disabled={!logoUrl} />
                </div>

                {/* Contrast warning */}
                {fgColor === bgColor && (
                  <p className="text-xs text-destructive">⚠ Foreground and background colors are the same — QR won't scan.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ DOWNLOAD TAB ═══ */}
        <TabsContent value="download">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="dash-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => downloadPNG(2)}>
              <CardContent className="pt-6 text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Image className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">PNG</h3>
                <p className="text-xs text-muted-foreground">High-resolution raster image. Best for screens & social media.</p>
                <Button size="sm" className="w-full"><Download className="h-4 w-4 mr-1" /> Download PNG</Button>
              </CardContent>
            </Card>

            <Card className="dash-card cursor-pointer hover:border-primary/40 transition-colors" onClick={downloadSVG}>
              <CardContent className="pt-6 text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">SVG</h3>
                <p className="text-xs text-muted-foreground">Scalable vector. Perfect for print materials at any size.</p>
                <Button size="sm" variant="outline" className="w-full"><Download className="h-4 w-4 mr-1" /> Download SVG</Button>
              </CardContent>
            </Card>

            <Card className="dash-card cursor-pointer hover:border-primary/40 transition-colors" onClick={downloadPDF}>
              <CardContent className="pt-6 text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-semibold">PDF</h3>
                <p className="text-xs text-muted-foreground">Print-ready PDF. Ideal for professional printing.</p>
                <Button size="sm" variant="outline" className="w-full"><Download className="h-4 w-4 mr-1" /> Print / PDF</Button>
              </CardContent>
            </Card>
          </div>

          {/* High-res option */}
          <Card className="dash-card mt-4">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">High-Resolution PNG (4×)</h3>
                <p className="text-xs text-muted-foreground">Extra-large image for large format printing (signs, banners)</p>
              </div>
              <Button variant="outline" onClick={() => downloadPNG(4)}>
                <Download className="h-4 w-4 mr-1" /> Download 4× PNG
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TEMPLATES TAB ═══ */}
        <TabsContent value="templates">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRINT_TEMPLATES.map((tpl) => (
              <Card key={tpl.key} className="dash-card hover:border-primary/40 transition-colors">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <tpl.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tpl.label}</h3>
                      <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">{tpl.size}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <QRCodeSVG value={cardUrl} size={80} bgColor="#fff" fgColor={fgColor} level="M" />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      downloadPNG(4);
                      toast.success(`Download your QR and add it to your ${tpl.label.toLowerCase()}`);
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" /> Get QR for {tpl.label}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Instructions card */}
            <Card className="dash-card border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">How to use</h3>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Download your QR code in PNG or SVG</li>
                  <li>Add it to your print material design</li>
                  <li>When scanned, it links directly to your card</li>
                  <li>Track scans in the Analytics tab</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ ANALYTICS TAB ═══ */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Scans", value: stats?.totalScans ?? 0, icon: ScanLine },
                { label: "Conversion Rate", value: `${stats?.conversionRate ?? 0}%`, icon: Users },
                { label: "Leads Generated", value: stats?.leadsGenerated ?? 0, icon: TrendingUp },
                { label: "Devices Tracked", value: stats?.devices?.length ?? 0, icon: Calendar },
              ].map((kpi) => (
                <Card key={kpi.label} className="dash-card">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <kpi.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">{kpi.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Scans chart */}
            <Card className="dash-card">
              <CardHeader>
                <CardTitle className="text-base">Scans Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {scansByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={scansByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ScanLine className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No scan data yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Share your QR code and scans will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversion funnel */}
            <Card className="dash-card">
              <CardHeader>
                <CardTitle className="text-base">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {[
                    { label: "Scans", value: stats?.totalScans ?? 0 },
                    { label: "Card Views", value: stats?.uniqueVisitors ?? 0 },
                    { label: "Leads", value: stats?.leadsGenerated ?? 0 },
                    { label: "Bookings", value: stats?.bookingsFromScans ?? 0 },
                  ].map((step, idx, arr) => (
                    <div key={step.label} className="flex items-center gap-2 flex-1">
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold">{step.value}</p>
                        <p className="text-xs text-muted-foreground">{step.label}</p>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="text-muted-foreground text-xs">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
