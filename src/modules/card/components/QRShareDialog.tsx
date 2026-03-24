import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Copy, Check, Share2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface QRShareDialogProps {
  url: string;
  name?: string;
  size?: number;
}

export default function QRShareDialog({ url, name = "Card", size = 200 }: QRShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const handleDownload = useCallback(() => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = size * 2;
    canvas.height = size * 2;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, size * 2, size * 2);
      const link = document.createElement("a");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }, [name, size]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name}'s Card`, url });
      } catch {}
    }
  }, [name, url]);

  return (
    <Dialog modal={false}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" title="QR Code">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">Share {name}'s Card</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={svgRef} className="p-4 bg-white rounded-2xl shadow-sm">
            <QRCodeSVG
              value={url}
              size={size}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center break-all max-w-[200px]">{url}</p>
          <div className="flex gap-2 w-full">
            <Button onClick={handleCopy} variant="outline" className="flex-1" size="sm">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1" size="sm">
              <Download className="h-4 w-4 mr-1" /> Save QR
            </Button>
          </div>
          {typeof navigator.share === "function" && (
            <Button onClick={handleNativeShare} className="w-full shadow-glow" size="sm">
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
