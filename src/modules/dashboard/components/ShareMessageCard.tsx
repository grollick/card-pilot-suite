import { useState } from "react";
import { Copy, Check, MessageSquare, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CHANNELS = [
  { key: "text", label: "Text", icon: Smartphone },
  { key: "email", label: "Email", icon: Mail },
  { key: "social", label: "Social", icon: MessageSquare },
] as const;

type Channel = (typeof CHANNELS)[number]["key"];

export default function ShareMessageCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [channel, setChannel] = useState<Channel>("text");

  const { data: profile } = useQuery({
    queryKey: ["profile-share-msg"],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("handle, name, company")
        .eq("id", user!.id)
        .single();
      return data as { handle: string | null; name: string | null; company: string | null } | null;
    },
  });

  if (!profile?.handle) return null;

  const cardUrl = `${window.location.origin}/${profile.handle}`;
  const firstName = profile.name?.split(" ")[0] || "there";
  const business = profile.company || "my business";
  const profession = profile.profession || "services";

  const messages: Record<Channel, string> = {
    text: `Hey! I just set up a digital business card for ${business}. Check it out and let me know if you or anyone you know needs ${profession} work done! 👇\n\n${cardUrl}`,
    email: `Hi,\n\nI wanted to share my new digital business card with you. It has all my services, reviews, and you can even book directly from it.\n\nCheck it out here: ${cardUrl}\n\nFeel free to share it with anyone who might need ${profession} services!\n\nBest,\n${firstName}`,
    social: `🚀 I just launched my digital business card! Check out my ${profession} services, see my work, and book directly — all from one link 👇\n\n${cardUrl}\n\n#SmallBusiness #${profession.replace(/\s+/g, "")}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messages[channel]);
    setCopied(true);
    toast.success("Message copied! Paste it and send.");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-accent-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Ready-to-Send Message</h3>
          <p className="text-2xs text-muted-foreground">Copy and send to start getting leads</p>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 mb-3 bg-muted/50 rounded-lg p-1">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          const active = channel === ch.key;
          return (
            <button
              key={ch.key}
              onClick={() => setChannel(ch.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Message preview */}
      <div className="rounded-lg bg-muted/30 border border-border p-3 mb-3 max-h-32 overflow-y-auto">
        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {messages[channel]}
        </p>
      </div>

      {/* Copy button */}
      <Button
        onClick={handleCopy}
        size="sm"
        className="w-full gap-2"
        variant={copied ? "outline" : "default"}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-success" />
            Copied! Now send it
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy Message
          </>
        )}
      </Button>
    </motion.div>
  );
}
