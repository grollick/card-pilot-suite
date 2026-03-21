import { useState } from "react";
import {
  Mail, Send, Copy, Eye, ChevronDown, ChevronUp, Loader2,
  Hammer, Paintbrush, Wrench, Home, Scissors, Camera, Utensils,
  Car, Sparkles, Briefcase, Shield, Heart, Zap, Users, Edit3, Check,
  MessageCircle, Phone, Share2, ExternalLink, Linkedin, Facebook, Instagram
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// ─── Cold Email Template Data ───
interface ColdTemplate {
  id: string;
  name: string;
  profession: string;
  icon: any;
  subject: string;
  body: string;
  followUp1: string;
  followUp2: string;
  tags: string[];
}

const COLD_TEMPLATES: ColdTemplate[] = [
  {
    id: "contractor",
    name: "General Contractor",
    profession: "contractor",
    icon: Hammer,
    subject: "A free digital business card for your contracting business",
    body: `Hi {{name}},

I came across {{business}} and wanted to reach out. We built a free tool specifically for contractors like you — a professional digital business card that helps you get found by local homeowners looking for reliable contractors.

Here's what it does:
• Instant online presence — no website needed
• Clients can book estimates directly from your card
• Show off your work with a before/after gallery
• Get discovered on our local professional marketplace

It takes about 2 minutes to set up and it's completely free to start.

Would you like me to set one up for you? I can have it ready in minutes.

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Just following up — I'd love to get your digital business card set up for {{business}}. Local homeowners are actively searching for contractors in your area.

It only takes 2 minutes and you'll be live immediately. Want me to help?`,
    followUp2: `Hi {{name}},

Last note from me — we've helped dozens of contractors get new leads through their guzzl.pro card. I'd hate for {{business}} to miss out.

Here's your free link to get started: https://guzzl.pro

No pressure — just wanted to make sure you saw this.`,
    tags: ["construction", "renovation", "building"],
  },
  {
    id: "plumber",
    name: "Plumber",
    profession: "plumber",
    icon: Wrench,
    subject: "Free tool to get more plumbing jobs in your area",
    body: `Hi {{name}},

I noticed {{business}} serves the local area and wanted to share something that could help you land more jobs — completely free.

guzzl.pro gives plumbers like you a professional digital business card that:
• Shows up when locals search for plumbers nearby
• Lets customers book you directly — no back-and-forth calls
• Displays your reviews and services clearly
• Works like a mini-website on any phone

Most plumbers we work with set it up in under 2 minutes and start getting enquiries the same week.

Want me to create yours for you?

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Quick follow-up — plumbers in your area are already using guzzl.pro to get found by local customers. Would love to help {{business}} do the same.

Takes 2 minutes. Completely free. Want me to set it up?`,
    followUp2: `Hi {{name}},

Final note — just wanted to make sure you didn't miss this. A free digital business card for {{business}} is waiting. Local customers are searching for plumbers right now.

Get started here: https://guzzl.pro`,
    tags: ["plumbing", "emergency", "repairs"],
  },
  {
    id: "electrician",
    name: "Electrician",
    profession: "electrician",
    icon: Zap,
    subject: "Get more electrical jobs — free digital card for {{business}}",
    body: `Hi {{name}},

I came across {{business}} and thought you'd benefit from a tool we built for electricians — a free digital business card that helps local customers find and book you instantly.

What you get:
• Professional online card — share via QR code, text, or link
• Booking system built in — customers pick a time, you get notified
• Marketplace visibility — get discovered by people searching locally
• Reviews display — build trust before they even call

It's free to start and takes under 2 minutes. Several electricians in your area are already using it.

Want me to create yours?

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Just circling back — would love to help {{business}} get set up on guzzl.pro. Electricians using the platform are averaging 3-5 new enquiries per week.

It's free and takes 2 minutes. Interested?`,
    followUp2: `Hi {{name}},

Last follow-up from me. Your free digital business card for {{business}} is ready to be created at https://guzzl.pro

No cost, no commitment — just more visibility for your electrical business.`,
    tags: ["electrical", "wiring", "installations"],
  },
  {
    id: "painter",
    name: "Painter / Decorator",
    profession: "painter",
    icon: Paintbrush,
    subject: "Show off your painting work & get more clients — free tool",
    body: `Hi {{name}},

I found {{business}} and thought you'd love this — a free digital business card designed for painters and decorators that helps you showcase your work and get hired by local clients.

Here's what makes it perfect for painters:
• Before/after photo gallery — show transformations that sell
• Instant booking — clients pick a time for an estimate
• Professional card you can share via text, email, or QR code
• Get discovered on our local services marketplace

Your work speaks for itself — this just makes it easier for people to see it and hire you.

Takes 2 minutes to set up. Completely free.

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Following up on my note about guzzl.pro for {{business}}. The before/after gallery feature is perfect for painters — it's your best sales tool.

Want me to help set it up? 2 minutes and you're live.`,
    followUp2: `Hi {{name}},

Last note — just wanted to make sure {{business}} doesn't miss out on free local visibility. Get your card at https://guzzl.pro`,
    tags: ["painting", "decorating", "interiors"],
  },
  {
    id: "realtor",
    name: "Real Estate Agent",
    profession: "realtor",
    icon: Home,
    subject: "A smarter business card for real estate — free for {{business}}",
    body: `Hi {{name}},

Real estate is all about first impressions and staying top-of-mind. That's why we built guzzl.pro — a free digital business card that helps agents like you stand out and capture leads effortlessly.

Why realtors love it:
• Tap-to-share NFC & QR code support — perfect for open houses
• Instant lead capture — visitors fill out a form, you get notified
• Professional card with your listings, reviews, and contact info
• Share via text after every showing

Several agents are already using it to stay connected with buyers and sellers.

Want me to create yours? It takes under 2 minutes.

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Quick follow-up — agents using guzzl.pro are capturing leads at open houses with a single tap. Would love to help {{business}} do the same.

Free and fast to set up. Interested?`,
    followUp2: `Hi {{name}},

Final note — your free digital business card for {{business}} is ready at https://guzzl.pro. Perfect for networking, open houses, and staying top-of-mind.`,
    tags: ["real estate", "property", "agent"],
  },
  {
    id: "barber",
    name: "Barber / Hair Stylist",
    profession: "barber",
    icon: Scissors,
    subject: "Fill your chair — free booking card for {{business}}",
    body: `Hi {{name}},

I came across {{business}} and wanted to share something that could help you fill more appointments — a free digital business card with built-in booking.

Here's why barbers and stylists love it:
• Clients book directly from your card — no DMs or calls needed
• Share your card link on Instagram, WhatsApp, or via QR code
• Show your work with a photo gallery
• Get found by new clients in your area

Most stylists set it up in about 2 minutes and start getting bookings the same day.

Want me to help create yours?

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Just following up — would love to help {{business}} get more bookings with a free digital card. Clients can book you directly — no more back-and-forth DMs.

2 minutes to set up. Interested?`,
    followUp2: `Hi {{name}},

Last note — barbers and stylists in your area are already using guzzl.pro to fill their chairs. Your free card is waiting at https://guzzl.pro`,
    tags: ["barbershop", "hair", "grooming"],
  },
  {
    id: "photographer",
    name: "Photographer",
    profession: "photographer",
    icon: Camera,
    subject: "A stunning portfolio card for {{business}} — completely free",
    body: `Hi {{name}},

Your photography deserves to be seen. We built guzzl.pro to help photographers like you showcase your work and get booked — with a free digital business card.

What you get:
• Beautiful photo gallery — your portfolio, front and centre
• Instant booking — clients pick a session type and time
• Share via link, QR code, or social media
• Get discovered by couples, businesses, and families locally

It's the easiest way to look professional and get hired — no website needed.

Takes 2 minutes. Want me to set it up for you?

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Following up — the portfolio gallery feature on guzzl.pro is perfect for photographers. Would love to help {{business}} showcase your best work and get more bookings.

Free and takes 2 minutes. Interested?`,
    followUp2: `Hi {{name}},

Final reminder — your free photography portfolio card is ready to be created at https://guzzl.pro. Let your work do the talking.`,
    tags: ["photography", "portraits", "events"],
  },
  {
    id: "personal_trainer",
    name: "Personal Trainer / Fitness",
    profession: "personal_trainer",
    icon: Heart,
    subject: "Get more clients for {{business}} — free digital card",
    body: `Hi {{name}},

I found {{business}} and thought you'd benefit from a tool we built for fitness professionals — a free digital business card that helps you get discovered and booked by local clients.

Perfect for trainers:
• Clients book sessions directly from your card
• Show your certifications, specialities, and testimonials
• Share your card after every session or on social media
• Get found on our local services marketplace

Most trainers set it up in 2 minutes and see enquiries within the first week.

Want me to create yours?

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Quick follow-up — would love to help {{business}} get more fitness clients with a free digital card. Direct booking, reviews, and local visibility — all in one link.

Interested?`,
    followUp2: `Hi {{name}},

Last note — trainers in your area are using guzzl.pro to fill their schedules. Get your free card at https://guzzl.pro`,
    tags: ["fitness", "training", "wellness"],
  },
  {
    id: "auto_mechanic",
    name: "Auto Mechanic",
    profession: "auto_mechanic",
    icon: Car,
    subject: "More local car repair customers — free tool for {{business}}",
    body: `Hi {{name}},

I came across {{business}} and wanted to share a free tool that helps mechanics get more local customers — a professional digital business card.

Here's what it does:
• Customers find you when searching for mechanics nearby
• They can book appointments directly from your card
• Display your services, reviews, and contact info in one place
• Share via QR code at your shop or via text

It's like having a website and booking system in one — but free and takes 2 minutes to set up.

Want me to help create yours?

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Following up — mechanics using guzzl.pro are getting found by more local car owners. Would love to help {{business}} do the same.

Free, fast, and easy. Want me to set it up?`,
    followUp2: `Hi {{name}},

Final note — your free digital business card for {{business}} is ready at https://guzzl.pro. More visibility, more bookings.`,
    tags: ["automotive", "mechanic", "repair"],
  },
  {
    id: "cleaner",
    name: "Cleaning Service",
    profession: "cleaner",
    icon: Sparkles,
    subject: "Get more cleaning clients in your area — free digital card",
    body: `Hi {{name}},

I noticed {{business}} provides cleaning services locally and wanted to share something that could help you get more regular clients — completely free.

guzzl.pro gives cleaning professionals a digital business card that:
• Gets you found by homeowners searching for cleaners nearby
• Lets clients book recurring or one-off cleans directly
• Shows your services, pricing, and customer reviews
• Works as a shareable link — perfect for WhatsApp groups and flyers

Most cleaning businesses set up in under 2 minutes and start seeing enquiries quickly.

Want me to create yours?

Best,
{{sender}}`,
    followUp1: `Hi {{name}},

Quick follow-up — cleaning businesses using guzzl.pro are filling their schedules with local clients. Would love to help {{business}} do the same.

Free and takes 2 minutes. Interested?`,
    followUp2: `Hi {{name}},

Last note — get your free digital business card for {{business}} at https://guzzl.pro. More visibility means more bookings.`,
    tags: ["cleaning", "domestic", "commercial"],
  },
];

// ─── Component ───
export default function ColdOutreachTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<ColdTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBusiness, setRecipientBusiness] = useState("");
  const [sending, setSending] = useState(false);
  const [emailStep, setEmailStep] = useState<"initial" | "followup1" | "followup2">("initial");
  const [searchFilter, setSearchFilter] = useState("");
  const [sendChannel, setSendChannel] = useState<"email" | "whatsapp" | "sms" | "facebook" | "linkedin" | "instagram">("email");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Fetch sender (logged-in user) name
  const { data: senderName } = useQuery({
    queryKey: ["sender-profile-name"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "The guzzl.pro Team";
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();
      return data?.name || "The guzzl.pro Team";
    },
    staleTime: 60_000,
  });

  const filtered = searchFilter
    ? COLD_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : COLD_TEMPLATES;

  const getEmailContent = (template: ColdTemplate, step: string) => {
    switch (step) {
      case "followup1": return template.followUp1;
      case "followup2": return template.followUp2;
      default: return template.body;
    }
  };

  const getSubject = (template: ColdTemplate, step: string) => {
    switch (step) {
      case "followup1": return `Re: ${template.subject}`;
      case "followup2": return `Re: ${template.subject}`;
      default: return template.subject;
    }
  };

  const personalizeText = (text: string) => {
    return text
      .replace(/{{name}}/g, recipientName || "there")
      .replace(/{{business}}/g, recipientBusiness || "your business")
      .replace(/{{sender}}/g, senderName || "The guzzl.pro Team");
  };

  const openSendDialog = (template: ColdTemplate) => {
    setSelectedTemplate(template);
    setEmailStep("initial");
    setEditedSubject(template.subject);
    setEditedBody(template.body);
    setEditMode(false);
    setSendChannel("email");
    setShowSendDialog(true);
  };

  const getPersonalizedBody = () => {
    if (!selectedTemplate) return "";
    return personalizeText(editMode ? editedBody : getEmailContent(selectedTemplate, emailStep));
  };

  const handleSocialSend = (channel: string) => {
    const body = getPersonalizedBody();
    const logContact = async (via: string) => {
      await supabase.from("outreach_contacts").insert({
        name: recipientName || recipientEmail || recipientPhone || "Unknown",
        business: recipientBusiness || null,
        status: "contacted",
        last_contact_at: new Date().toISOString(),
        notes: `Cold outreach via ${via}: ${selectedTemplate?.name} (${emailStep})`,
      } as any);
    };

    switch (channel) {
      case "whatsapp": {
        const phone = recipientPhone.replace(/\D/g, "");
        if (!phone) { toast.error("Phone number is required for WhatsApp"); return; }
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
        logContact("WhatsApp");
        toast.success("WhatsApp opened");
        break;
      }
      case "sms": {
        const phone = recipientPhone.replace(/\D/g, "");
        if (!phone) { toast.error("Phone number is required for SMS"); return; }
        const url = `sms:${phone}?body=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
        logContact("SMS");
        toast.success("SMS app opened");
        break;
      }
      case "facebook": {
        navigator.clipboard.writeText(body);
        window.open("https://www.facebook.com/messages/", "_blank");
        logContact("Facebook");
        toast.success("Message copied — paste it in Facebook Messenger");
        break;
      }
      case "linkedin": {
        navigator.clipboard.writeText(body);
        window.open("https://www.linkedin.com/messaging/", "_blank");
        logContact("LinkedIn");
        toast.success("Message copied — paste it in LinkedIn Messages");
        break;
      }
      case "instagram": {
        navigator.clipboard.writeText(body);
        window.open("https://www.instagram.com/direct/inbox/", "_blank");
        logContact("Instagram");
        toast.success("Message copied — paste it in Instagram DMs");
        break;
      }
    }
  };

  const handleSend = async () => {
    if (sendChannel !== "email") {
      handleSocialSend(sendChannel);
      return;
    }

    if (!recipientEmail.trim()) {
      toast.error("Recipient email is required");
      return;
    }
    if (!selectedTemplate) return;

    setSending(true);
    try {
      const subject = personalizeText(editMode ? editedSubject : getSubject(selectedTemplate, emailStep));
      const bodyText = getPersonalizedBody();
      const html = bodyText.replace(/\n/g, "<br />");

      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail.trim(),
          subject,
          html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333;">${html}</div>`,
          email_type: "cold_outreach",
        },
      });

      if (error) throw error;

      await supabase.from("outreach_contacts").insert({
        name: recipientName || recipientEmail,
        business: recipientBusiness || null,
        status: "contacted",
        last_contact_at: new Date().toISOString(),
        notes: `Cold email sent: ${selectedTemplate.name} (${emailStep})`,
      } as any);

      toast.success(`Email sent to ${recipientEmail}`);
      setRecipientEmail("");
      setRecipientName("");
      setRecipientBusiness("");
      setRecipientPhone("");
      setShowSendDialog(false);
    } catch (err: any) {
      console.error("Cold email send error:", err);
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Cold Outreach Emails
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-written profession-specific emails to acquire new card holders
          </p>
        </div>
        <Input
          placeholder="Search professions..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="w-48 h-8 text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(template => (
          <Card key={template.id} className="group hover:shadow-card transition-shadow">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <template.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{template.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{template.subject}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-7 gap-1"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setEmailStep("initial");
                    setShowPreview(true);
                  }}
                >
                  <Eye className="h-3 w-3" /> Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs h-7 gap-1"
                  onClick={() => openSendDialog(template)}
                >
                  <Send className="h-3 w-3" /> Send
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(template.body);
                    toast.success("Email body copied");
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">
          No templates match "{searchFilter}"
        </p>
      )}

      {/* ── Preview Dialog ── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && <selectedTemplate.icon className="h-4 w-4 text-primary" />}
              {selectedTemplate?.name} — Email Preview
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <Tabs value={emailStep} onValueChange={v => setEmailStep(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="initial" className="flex-1 text-xs">Initial Email</TabsTrigger>
                  <TabsTrigger value="followup1" className="flex-1 text-xs">Follow-Up Day 2</TabsTrigger>
                  <TabsTrigger value="followup2" className="flex-1 text-xs">Follow-Up Day 4</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm font-semibold">{getSubject(selectedTemplate, emailStep)}</p>
                </div>
                <hr className="border-border" />
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {getEmailContent(selectedTemplate, emailStep)}
                </div>
              </div>

              <Button
                className="w-full gap-1"
                onClick={() => {
                  setShowPreview(false);
                  openSendDialog(selectedTemplate);
                }}
              >
                <Send className="h-3.5 w-3.5" /> Use This Template
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Send Dialog ── */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send Cold Outreach
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Recipient info */}
              <div className="space-y-2">
                <Input
                  placeholder="Recipient email *"
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Contact name"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                  />
                  <Input
                    placeholder="Business name"
                    value={recipientBusiness}
                    onChange={e => setRecipientBusiness(e.target.value)}
                  />
                </div>
              </div>

              {/* Email step selector */}
              <Tabs value={emailStep} onValueChange={v => setEmailStep(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="initial" className="flex-1 text-xs">Initial</TabsTrigger>
                  <TabsTrigger value="followup1" className="flex-1 text-xs">Day 2</TabsTrigger>
                  <TabsTrigger value="followup2" className="flex-1 text-xs">Day 4</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Edit toggle */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs gap-1">
                  {selectedTemplate.icon && <selectedTemplate.icon className="h-3 w-3" />}
                  {selectedTemplate.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-7"
                  onClick={() => {
                    if (!editMode) {
                      setEditedSubject(getSubject(selectedTemplate, emailStep));
                      setEditedBody(getEmailContent(selectedTemplate, emailStep));
                    }
                    setEditMode(!editMode);
                  }}
                >
                  {editMode ? <Check className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                  {editMode ? "Done Editing" : "Customise"}
                </Button>
              </div>

              {/* Email preview / edit */}
              <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                {editMode ? (
                  <>
                    <Input
                      value={editedSubject}
                      onChange={e => setEditedSubject(e.target.value)}
                      className="text-sm font-semibold"
                    />
                    <Textarea
                      value={editedBody}
                      onChange={e => setEditedBody(e.target.value)}
                      rows={12}
                      className="text-sm"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subject</p>
                    <p className="text-sm font-semibold">
                      {personalizeText(getSubject(selectedTemplate, emailStep))}
                    </p>
                    <hr className="border-border" />
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {personalizeText(getEmailContent(selectedTemplate, emailStep))}
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full gap-1"
                onClick={handleSend}
                disabled={sending || !recipientEmail.trim()}
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
