import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import { useQuery } from "@tanstack/react-query";
import { useProfileCache } from "@/hooks/useProfileCache";
import {
  Share2, Send, Copy, MessageSquare, Linkedin, Twitter,
  Mail, Phone, ExternalLink, Sparkles, CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ─── Share Links ───
const SITE_URL = "https://guzzl.pro";

function getShareUrl(referralCode?: string) {
  return referralCode ? `${SITE_URL}/ref/${referralCode}` : `${SITE_URL}/get-started`;
}

// ─── Social Templates ───
const socialTemplates = [
  {
    platform: "LinkedIn",
    icon: Linkedin,
    color: "text-[#0077B5]",
    templates: [
      {
        title: "Professional intro",
        text: `🚀 Just discovered something game-changing for local professionals.\n\nguzzl.pro gives you a free digital business card with built-in CRM, booking, and lead capture.\n\nIf you're a contractor, barber, realtor, trainer, or any local pro — check it out 👇\n\n{{LINK}}\n\n#SmallBusiness #DigitalMarketing #LocalBusiness`,
      },
      {
        title: "Success story angle",
        text: `💡 The smartest local pros I know stopped printing business cards.\n\nThey use guzzl.pro instead — one link that lets customers book, call, message, and review.\n\nFree. Takes 2 minutes to set up.\n\n{{LINK}}`,
      },
    ],
  },
  {
    platform: "Twitter/X",
    icon: Twitter,
    color: "text-foreground",
    templates: [
      {
        title: "Short & punchy",
        text: `If you're a local pro still handing out paper cards… you're leaving money on the table.\n\nguzzl.pro = free digital biz card + CRM + booking.\n\n2 min setup. No credit card. 🔥\n\n{{LINK}}`,
      },
      {
        title: "Thread starter",
        text: `🧵 The #1 tool every local professional needs in 2024 (and it's free):\n\nguzzl.pro turns your phone into a complete business command center.\n\n→ Digital card your clients actually keep\n→ Built-in booking & CRM\n→ AI social posts\n→ QR codes for everything\n\n{{LINK}}`,
      },
    ],
  },
  {
    platform: "WhatsApp/SMS",
    icon: Phone,
    color: "text-[hsl(var(--success))]",
    templates: [
      {
        title: "Personal invite",
        text: `Hey! 👋 I found this awesome free tool for local businesses. It's called guzzl.pro — gives you a digital business card with booking, CRM, and everything. Takes 2 mins to set up. Check it out: {{LINK}}`,
      },
      {
        title: "Group share",
        text: `🔥 Free tool alert for anyone running a local business!\n\nguzzl.pro = digital business card + CRM + booking system\n\nNo cost. No catch. Just pick your profession and go: {{LINK}}`,
      },
    ],
  },
  {
    platform: "Facebook/IG",
    icon: MessageSquare,
    color: "text-[#1877F2]",
    templates: [
      {
        title: "Community post",
        text: `🎯 Calling all local professionals!\n\nJust set up my free digital business card on guzzl.pro and WOW — it comes with booking, CRM, QR codes, and even AI-generated social posts.\n\nPerfect for contractors, barbers, realtors, trainers, and anyone serving local customers.\n\nFree. 2 minutes. No credit card.\n\n{{LINK}}\n\nWho's trying it? 👇`,
      },
    ],
  },
];

// ─── 1:1 Invite Email Panel ───
function InvitePanel({ referralCode }: { referralCode?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { data: profile } = useProfileCache();

  const handleSend = async () => {
    if (!email) return toast.error("Enter a recipient email");
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "platform-invite",
          recipientEmail: email,
          idempotencyKey: `invite-${email}-${Date.now()}`,
          templateData: {
            recipientName: name || undefined,
            senderName: profile?.name || undefined,
            personalMessage: message || undefined,
            referralCode: referralCode || undefined,
          },
        },
      });
      if (error) throw error;
      toast.success(`Invite sent to ${email}!`);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      toast.error("Failed to send invite", { description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Send a personal 1-on-1 invite email to someone you think would benefit from guzzl.pro.
        {referralCode && (
          <Badge variant="outline" className="ml-2 text-[10px]">
            Your referral code: {referralCode}
          </Badge>
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Their name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Their email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Textarea
        placeholder="Add a personal note (optional) — e.g. 'Hey Marcus, I've been using this and it's great for getting new clients!'"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
      />
      <Button onClick={handleSend} disabled={sending} className="gap-2">
        <Mail className="h-4 w-4" />
        {sending ? "Sending…" : "Send Personal Invite"}
      </Button>
    </div>
  );
}

// ─── Quick Share Links ───
function QuickSharePanel({ referralCode }: { referralCode?: string }) {
  const link = getShareUrl(referralCode);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const openShare = (url: string) => window.open(url, "_blank");

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Quick-share your guzzl.pro link across channels</p>
      <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
        <span className="text-sm text-foreground truncate flex-1">{link}</span>
        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(link, "Link")} className="shrink-0 gap-1">
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
          onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`Check out guzzl.pro — free digital business card for local pros! ${link}`)}`)}>
          <Phone className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> WhatsApp
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
          onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`)}>
          <Linkedin className="h-3.5 w-3.5 text-[#0077B5]" /> LinkedIn
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
          onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just discovered guzzl.pro — free digital business card with CRM & booking for local pros 🔥`)}&url=${encodeURIComponent(link)}`)}>
          <Twitter className="h-3.5 w-3.5" /> X/Twitter
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
          onClick={() => openShare(`sms:?body=${encodeURIComponent(`Hey! Check out guzzl.pro — free digital business card for local professionals. ${link}`)}`)}>
          <MessageSquare className="h-3.5 w-3.5" /> SMS
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
          onClick={() => openShare(`mailto:?subject=${encodeURIComponent("Check out guzzl.pro")}&body=${encodeURIComponent(`Hey!\n\nI found this awesome free tool for local businesses called guzzl.pro. It gives you a digital business card with CRM, booking, and more.\n\nCheck it out: ${link}`)}`)}>
          <Mail className="h-3.5 w-3.5" /> Email
        </Button>
      </div>
    </div>
  );
}

// ─── Social Content Templates ───
function SocialTemplatesPanel({ referralCode }: { referralCode?: string }) {
  const link = getShareUrl(referralCode);

  const copyTemplate = (text: string) => {
    const finalText = text.replace(/\{\{LINK\}\}/g, link);
    navigator.clipboard.writeText(finalText);
    toast.success("Copied to clipboard — ready to paste!");
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Pre-written posts for each platform. Click to copy, then paste wherever you want.
      </p>
      {socialTemplates.map((platform) => (
        <div key={platform.platform}>
          <div className="flex items-center gap-2 mb-2">
            <platform.icon className={`h-4 w-4 ${platform.color}`} />
            <span className="text-sm font-medium">{platform.platform}</span>
          </div>
          <div className="grid gap-2">
            {platform.templates.map((t, i) => (
              <div key={i}
                className="group relative rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => copyTemplate(t.text)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="outline" className="text-[10px]">{t.title}</Badge>
                  <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">
                  {t.text.replace(/\{\{LINK\}\}/g, link)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───
export default function GuzzlPromoToolkit() {
  const { data: profile } = useProfileCache();
  const referralCode = profile?.referral_code;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Promote guzzl.pro</h3>
            <p className="text-xs text-muted-foreground">Share, invite, and grow the platform</p>
          </div>
        </div>

        <Tabs defaultValue="share">
          <TabsList className="mb-4">
            <TabsTrigger value="share" className="text-xs gap-1"><Share2 className="h-3 w-3" /> Quick Share</TabsTrigger>
            <TabsTrigger value="invite" className="text-xs gap-1"><Mail className="h-3 w-3" /> 1:1 Invite</TabsTrigger>
            <TabsTrigger value="social" className="text-xs gap-1"><MessageSquare className="h-3 w-3" /> Social Posts</TabsTrigger>
          </TabsList>
          <TabsContent value="share"><QuickSharePanel referralCode={referralCode} /></TabsContent>
          <TabsContent value="invite"><InvitePanel referralCode={referralCode} /></TabsContent>
          <TabsContent value="social"><SocialTemplatesPanel referralCode={referralCode} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
