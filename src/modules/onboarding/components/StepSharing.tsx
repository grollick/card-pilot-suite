import { ArrowRight, Share2, Copy, QrCode, MessageSquare, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  cardUrl: string;
  shareMessage: string;
  onNext: () => void;
}

export default function StepSharing({ cardUrl, shareMessage, onNext }: Props) {
  const [copied, setCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    toast.success("Card link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setMessageCopied(true);
    toast.success("Share message copied!");
    setTimeout(() => setMessageCopied(false), 2000);
  };

  const textShare = () => {
    if (navigator.share) {
      navigator.share({ title: "My Business Card", text: shareMessage, url: cardUrl });
    } else {
      copyMessage();
    }
  };

  return (
    <OnboardingStepWrapper stepKey="sharing">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Share your card
        </h2>
        <p className="text-sm text-muted-foreground">Get your card in front of potential customers</p>
      </div>

      {/* Share actions */}
      <div className="space-y-2">
        <Button onClick={copyLink} variant="outline" className="w-full justify-start gap-3 h-12">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          <div className="text-left">
            <p className="text-sm font-medium">{copied ? "Copied!" : "Copy card link"}</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[250px]">{cardUrl}</p>
          </div>
        </Button>

        <Button onClick={textShare} variant="outline" className="w-full justify-start gap-3 h-12">
          <MessageSquare className="h-4 w-4" />
          <div className="text-left">
            <p className="text-sm font-medium">Text your card to someone</p>
            <p className="text-[11px] text-muted-foreground">Pre-written message ready to send</p>
          </div>
        </Button>

        <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => {
          toast.info("QR code available on your dashboard!");
        }}>
          <QrCode className="h-4 w-4" />
          <div className="text-left">
            <p className="text-sm font-medium">QR code</p>
            <p className="text-[11px] text-muted-foreground">Print it on business cards or flyers</p>
          </div>
        </Button>
      </div>

      {/* Pre-written message */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">💬 Pre-written share message:</p>
        <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground leading-relaxed">
          {shareMessage}
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5" onClick={copyMessage}>
          {messageCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {messageCopied ? "Copied!" : "Copy Message"}
        </Button>
      </div>

      <Button onClick={onNext} className="w-full gap-2">
        Continue to Dashboard <ArrowRight className="h-4 w-4" />
      </Button>
    </OnboardingStepWrapper>
  );
}
