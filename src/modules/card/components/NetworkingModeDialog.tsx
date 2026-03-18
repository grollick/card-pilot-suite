import { useState, useRef, useCallback, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  QrCode, Download, Copy, Check, Share2, Nfc, X,
  Smartphone, Users, Eye, UserPlus, Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useCard";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { downloadVCard } from "@/lib/vcard";

interface NetworkingModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NetworkingModeDialog({ open, onOpenChange }: NetworkingModeDialogProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { planKey } = usePlanLimits();
  const isPro = planKey !== "starter";
  const isProPlus = planKey === "pro" || planKey === "agency";
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);
  const nfcSupported = typeof window !== "undefined" && "NDEFReader" in window;

  const handle = profile?.handle;
  const cardUrl = handle ? `${window.location.origin}/${handle}` : "";
  const name = profile?.name || "My Card";

  // Fetch networking metrics (last 30 days)
  const { data: metrics } = useQuery({
    queryKey: ["networking-metrics", user?.id],
    enabled: !!user && open,
    staleTime: 60_000,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [viewsRes, leadsRes, scansRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("event_type", "card_view")
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("event_type", "form_submit")
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("event_type", "contact_saved")
          .gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      return {
        views: viewsRes.count ?? 0,
        leads: leadsRes.count ?? 0,
        saves: scansRes.count ?? 0,
      };
    },
  });

  const handleCopy = useCallback(async () => {
    if (!cardUrl) return;
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    toast.success("Card link copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [cardUrl]);

  const handleDownloadQR = useCallback(() => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-networking-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }, [name]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name}'s Digital Card`, url: cardUrl });
      } catch {}
    }
  }, [name, cardUrl]);

  const handleNFCWrite = useCallback(async () => {
    if (!nfcSupported || !cardUrl) return;
    try {
      // @ts-ignore
      const ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: "url", data: cardUrl }] });
      toast.success("Card URL written to NFC tag!");
    } catch (err) {
      toast.error("NFC write failed. Hold the tag closer.");
    }
  }, [nfcSupported, cardUrl]);

  const handlePrint = useCallback(() => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Print QR Code</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui}
      h2{margin-bottom:8px}p{color:#666;font-size:14px;margin-top:4px}</style></head>
      <body><h2>${name}</h2>${svgData}<p>${cardUrl}</p>
      <script>setTimeout(()=>{window.print();window.close()},300)</script></body></html>
    `);
    printWindow.document.close();
  }, [name, cardUrl]);

  const handleDownloadVCard = useCallback(() => {
    downloadVCard({
      name: profile?.name,
      email: profile?.email,
      phone: profile?.phone,
      company: profile?.company,
      handle: profile?.handle,
      avatarUrl: profile?.avatar_url,
    });
  }, [profile]);

  if (!handle) return null;

  const statItems = [
    { icon: Eye, label: "Card Views", value: metrics?.views ?? 0 },
    { icon: UserPlus, label: "Leads", value: metrics?.leads ?? 0 },
    { icon: Users, label: "Saves", value: metrics?.saves ?? 0 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full h-full max-h-full m-0 p-0 border-none rounded-none bg-gradient-to-br from-background via-background to-muted/30 [&>button]:hidden">
        <div className="relative flex flex-col items-center justify-center min-h-screen p-6">
          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-muted/50 hover:bg-muted z-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col items-center gap-6 max-w-sm w-full"
          >
            {/* Title */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                <Wifi className="h-3.5 w-3.5" />
                Networking Mode
              </div>
              <h1 className="text-2xl font-bold text-foreground">{name}</h1>
              {profile?.company && (
                <p className="text-sm text-muted-foreground">{profile.company}</p>
              )}
            </div>

            {/* QR Code */}
            <motion.div
              ref={svgRef}
              className="p-6 bg-white rounded-3xl shadow-lg ring-1 ring-border/50"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <QRCodeSVG
                value={cardUrl}
                size={240}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={false}
              />
            </motion.div>

            <p className="text-xs text-muted-foreground text-center">
              Scan to view my digital business card
            </p>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1.5">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button onClick={handleDownloadQR} variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" /> Save QR
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5">
                <QrCode className="h-4 w-4" /> Print
              </Button>
              {typeof navigator.share === "function" ? (
                <Button onClick={handleNativeShare} variant="outline" size="sm" className="gap-1.5">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              ) : (
                <Button onClick={handleDownloadVCard} variant="outline" size="sm" className="gap-1.5">
                  <Smartphone className="h-4 w-4" /> vCard
                </Button>
              )}
            </div>

            {/* NFC Section */}
            {isProPlus && nfcSupported && (
              <Button onClick={handleNFCWrite} className="w-full shadow-glow gap-2" size="default">
                <Nfc className="h-4 w-4" /> Tap to Share via NFC
              </Button>
            )}
            {isProPlus && !nfcSupported && (
              <div className="w-full rounded-xl border border-border bg-muted/30 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Nfc className="h-3.5 w-3.5" />
                  NFC not available on this device
                </div>
              </div>
            )}
            {!isProPlus && (
              <div className="w-full rounded-xl border border-dashed border-border bg-muted/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  <Nfc className="h-3.5 w-3.5 inline mr-1" />
                  NFC tap-to-share available on <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pro Plus</Badge>
                </p>
              </div>
            )}

            {/* Analytics strip */}
            {isPro && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full grid grid-cols-3 gap-2"
              >
                {statItems.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 border border-border/50 p-3">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold text-foreground">{s.value}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {!isPro && (
              <p className="text-xs text-muted-foreground text-center">
                Upgrade to Pro to see networking analytics
              </p>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
