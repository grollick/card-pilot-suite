import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, QrCode, Share2, ArrowUpRight, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const socials = [
  { name: "Facebook", color: "bg-[hsl(220,46%,48%)]", share: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: "LinkedIn", color: "bg-[hsl(210,80%,38%)]", share: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { name: "X", color: "bg-foreground", share: (url: string, text: string) => `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
];

export default function ShareCardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-handle-share"],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("handle, name, company")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const cardUrl = profile?.handle ? `${window.location.origin}/${profile.handle}` : "";
  const shareText = `Check out my digital business card${profile?.company ? ` for ${profile.company}` : ""}!`;

  const copyLink = () => {
    if (!cardUrl) return;
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    toast.success("Card link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile?.handle) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Share2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Share Your Card</h2>
            <p className="text-2xs text-muted-foreground">Get more leads by sharing everywhere</p>
          </div>
        </div>
      </div>

      <div className="dash-card-body space-y-3">
        {/* Card URL + Copy */}
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground truncate font-mono">
            {cardUrl.replace(/^https?:\/\//, "")}
          </div>
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate("/app/card/qr")}
          >
            <QrCode className="h-3.5 w-3.5" />
            Download QR
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate("/app/card")}
          >
            Edit Card
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Social share */}
        <div className="flex items-center gap-2">
          <span className="text-2xs text-muted-foreground font-medium">Share to:</span>
          <div className="flex gap-1.5">
            {socials.map(s => (
              <button
                key={s.name}
                onClick={() => window.open(s.share(cardUrl, shareText), "_blank")}
                className={`h-7 px-2.5 rounded-md text-[11px] font-medium text-white transition-opacity hover:opacity-80 ${s.color}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
