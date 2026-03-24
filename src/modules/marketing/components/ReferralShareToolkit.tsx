import { useState } from "react";
import { Copy, Phone, MessageSquare, Linkedin, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Share2, Sparkles } from "lucide-react";

const SITE_URL = "https://guzzl.pro";

function getShareUrl(referralCode?: string | null) {
  return referralCode ? `${SITE_URL}/ref/${referralCode}` : `${SITE_URL}/get-started`;
}

const socialTemplates = [
  {
    platform: "WhatsApp/SMS",
    icon: Phone,
    color: "text-[hsl(var(--success))]",
    templates: [
      {
        title: "Personal invite",
        text: `Hey! 👋 I found this awesome free tool for local businesses called guzzl.pro — gives you a digital business card with booking & CRM built in. Takes 2 mins to set up. Check it out: {{LINK}}`,
      },
      {
        title: "Group share",
        text: `🔥 Free tool alert for anyone running a local business!\n\nguzzl.pro = digital business card + CRM + booking system\n\nNo cost. No catch: {{LINK}}`,
      },
    ],
  },
  {
    platform: "LinkedIn",
    icon: Linkedin,
    color: "text-[#0077B5]",
    templates: [
      {
        title: "Professional post",
        text: `🚀 Just discovered something game-changing for local professionals.\n\nguzzl.pro gives you a free digital business card with CRM, booking, and lead capture built in.\n\nIf you're a contractor, barber, realtor, or any local pro — check it out 👇\n\n{{LINK}}\n\n#SmallBusiness #LocalBusiness`,
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
        text: `If you're a local pro still handing out paper cards… you're leaving money on the table.\n\nguzzl.pro = free digital biz card + CRM + booking. 🔥\n\n{{LINK}}`,
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
        text: `🎯 Calling all local professionals!\n\nJust set up my free digital business card on guzzl.pro and WOW — it comes with booking, CRM, QR codes, and AI social posts.\n\nFree. 2 minutes. No credit card.\n\n{{LINK}}\n\nWho's trying it? 👇`,
      },
    ],
  },
];

interface Props {
  referralCode?: string | null;
}

export default function ReferralShareToolkit({ referralCode }: Props) {
  const link = getShareUrl(referralCode);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const openShare = (url: string) => window.open(url, "_blank");

  const copyTemplate = (text: string) => {
    const finalText = text.replace(/\{\{LINK\}\}/g, link);
    navigator.clipboard.writeText(finalText);
    toast.success("Copied to clipboard — ready to paste!");
  };

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Share & Promote</h2>
          <p className="text-xs text-muted-foreground">Quick-share or use ready-made social posts</p>
        </div>
      </div>

      <Tabs defaultValue="quick">
        <TabsList className="mb-3">
          <TabsTrigger value="quick" className="text-xs gap-1"><Share2 className="h-3 w-3" /> Quick Share</TabsTrigger>
          <TabsTrigger value="social" className="text-xs gap-1"><MessageSquare className="h-3 w-3" /> Social Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-xs text-foreground truncate flex-1">{link}</span>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(link, "Link")} className="shrink-0 gap-1 text-xs">
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
                <Twitter className="h-3.5 w-3.5" /> X
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
        </TabsContent>

        <TabsContent value="social">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Pre-written posts — click to copy, then paste on any platform.
            </p>
            {socialTemplates.map((platform) => (
              <div key={platform.platform}>
                <div className="flex items-center gap-2 mb-2">
                  <platform.icon className={`h-3.5 w-3.5 ${platform.color}`} />
                  <span className="text-xs font-medium">{platform.platform}</span>
                </div>
                <div className="grid gap-2">
                  {platform.templates.map((t, i) => (
                    <div key={i}
                      className="group relative rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => copyTemplate(t.text)}
                    >
                      <div className="flex items-center justify-between mb-1">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
