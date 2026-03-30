import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Copy, Check, ExternalLink, MessageSquare, Mail,
  QrCode, Download, Smartphone, Eye, Users, CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface ShareCardModalProps {
  open: boolean;
  onClose: () => void;
  businessName: string;
  slug: string;
  /** Mock stats — replace with real data */
  stats?: { views: number; leads: number; bookings: number };
}

export default function ShareCardModal({
  open,
  onClose,
  businessName,
  slug,
  stats = { views: 0, leads: 0, bookings: 0 },
}: ShareCardModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const cardUrl = `${window.location.origin}/marketplace/${slug}`;
  const shortUrl = `guzzl.pro/marketplace/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    toast.success("Link copied — start sending it to customers");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `Check out ${businessName} on guzzl`,
          url: cardUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleSMS = () => {
    const body = encodeURIComponent(`Check out my business on guzzl: ${cardUrl}`);
    window.open(`sms:?body=${body}`, "_self");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${businessName} — Book a service`);
    const body = encodeURIComponent(
      `Hi!\n\nCheck out my services and book online:\n${cardUrl}\n\n— ${businessName}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("share-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `${slug}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR code downloaded!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="h-1 bg-gradient-to-r from-primary to-accent" />

              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6 space-y-5">
                {/* Header */}
                <div>
                  <h2 className="text-lg font-bold text-foreground">Share Your Card</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Send your guzzl link to start getting leads
                  </p>
                </div>

                {/* Card URL */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <code className="flex-1 text-sm text-foreground truncate">{shortUrl}</code>
                  <Button size="sm" variant="ghost" className="h-8 flex-shrink-0" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Share actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start gap-2" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    Copy Link
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={() => window.open(cardUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                    Open Card
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={handleSMS}>
                    <MessageSquare className="h-4 w-4" />
                    Share via Text
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={handleEmail}>
                    <Mail className="h-4 w-4" />
                    Share via Email
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={handleNativeShare}>
                    <Smartphone className="h-4 w-4" />
                    More Options
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="h-4 w-4" />
                    {showQR ? "Hide QR" : "Show QR Code"}
                  </Button>
                </div>

                {/* QR Code */}
                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-background">
                        <QRCodeSVG
                          id="share-qr-code"
                          value={cardUrl}
                          size={180}
                          level="M"
                          className="rounded-lg"
                        />
                        <Button size="sm" variant="outline" onClick={handleDownloadQR}>
                          <Download className="h-4 w-4 mr-1.5" /> Download QR
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Add this to your truck, business card, or invoice
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Share tracking stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Eye, label: "Views", value: stats.views },
                    { icon: Users, label: "Leads", value: stats.leads },
                    { icon: CalendarCheck, label: "Bookings", value: stats.bookings },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-2.5 rounded-lg bg-muted/30">
                      <s.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {stats.views > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Your card has been viewed <span className="font-semibold text-foreground">{stats.views}</span> times
                  </p>
                )}

                {/* Primary CTA */}
                <Button size="lg" className="w-full font-semibold" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" /> Copy Link & Share
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
