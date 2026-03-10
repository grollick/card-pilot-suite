import { Smartphone, Nfc, Share2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface NFCShareDialogProps {
  url: string;
  name?: string;
}

export default function NFCShareDialog({ url, name = "Card" }: NFCShareDialogProps) {
  const nfcSupported = typeof window !== "undefined" && "NDEFReader" in window;

  const handleNFCWrite = async () => {
    if (!nfcSupported) return;
    try {
      // @ts-ignore - NDEFReader is not in TS types yet
      const ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: "url", data: url }] });
    } catch (err) {
      console.error("NFC write failed:", err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" title="Write NFC tag">
          <Nfc className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">NFC Business Card</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>

          {nfcSupported ? (
            <>
              <p className="text-sm text-muted-foreground">
                Hold an NFC tag or card near your device to write your CardPilot profile URL.
              </p>
              <Button onClick={handleNFCWrite} className="w-full shadow-glow">
                <Nfc className="h-4 w-4 mr-1.5" /> Write to NFC Tag
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                NFC writing is not supported on this device. You can still use NFC-enabled cards by programming them with your card URL:
              </p>
              <div className="w-full rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-mono break-all text-foreground">{url}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Use an NFC writing app (like NFC Tools) to program this URL onto any NFC tag or business card.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
