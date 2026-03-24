import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface WalletPassDialogProps {
  handle: string;
  name?: string;
}

export default function WalletPassDialog({ handle, name = "Card" }: WalletPassDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleGeneratePass = async (platform: "apple" | "google") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-wallet-pass", {
        body: { handle, platform },
      });
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        toast.info("Wallet pass generation is being set up. Check back soon!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate wallet pass");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog modal={false}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" title="Add to Wallet">
          <Wallet className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">Add to Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Save your digital business card to your phone's wallet for instant sharing.
          </p>
          <Button
            onClick={() => handleGeneratePass("apple")}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Apple Wallet
          </Button>
          <Button
            onClick={() => handleGeneratePass("google")}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5H12v6h6v12.5c0 .83-.67 1.5-1.5 1.5h-12C3.67 22 3 21.33 3 20.5zM14 2l6 6h-6V2z" />
            </svg>
            Google Wallet
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            When someone taps your card, they'll see your full guzzl.pro profile.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
