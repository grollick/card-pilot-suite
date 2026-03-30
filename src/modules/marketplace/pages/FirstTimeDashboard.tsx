import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Share2, ExternalLink, Plus,
  MapPin, CalendarCheck, CheckCircle2, Circle, Eye,
  Users, Star, TrendingUp, Rocket, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import ShareCardModal from "../components/ShareCardModal";
import ShareCtaWidget from "../components/ShareCtaWidget";

/* ─── Mock state (replace with real queries) ─── */
const MOCK_BUSINESS = {
  name: "North Shore Landscaping",
  slug: "north-shore-landscaping",
  headline: "Professional Landscaping & Lawn Care",
  city: "Thunder Bay",
};

const INITIAL_CHECKLIST = [
  { key: "service", label: "Add your first service", done: false, action: "Add Now", route: "/app/marketplace-hub" },
  { key: "area", label: "Set your service area", done: false, action: "Set Area", route: "/app/marketplace-hub" },
  { key: "booking", label: "Enable booking", done: false, action: "Enable", route: "/app/marketplace-hub" },
  { key: "share", label: "Share your card", done: false, action: "Share", route: null },
];

const stagger = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function FirstTimeDashboard() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [checklist] = useState(INITIAL_CHECKLIST);
  const [shareOpen, setShareOpen] = useState(false);

  const completedCount = checklist.filter((c) => c.done).length;
  const progressPercent = (completedCount / checklist.length) * 100;

  const cardUrl = `${window.location.origin}/marketplace/${MOCK_BUSINESS.slug}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: MOCK_BUSINESS.name, url: cardUrl });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Welcome | guzzl.pro</title></Helmet>

      {/* ─── WELCOME HERO ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center"
                >
                  <Sparkles className="h-5 w-5 text-success" />
                </motion.div>
                <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">
                  Live on guzzl
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Your guzzl card is live 🎉
              </h1>
              <p className="text-muted-foreground">
                Let's get you your first customer.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => window.open(cardUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-1.5" /> View Your Card
              </Button>
              <Button onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4 mr-1.5" /> Share Your Card
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── SECTION 1: PROGRESS CHECKLIST ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              Get your first lead
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedCount} of {checklist.length} completed
            </p>
          </div>
          <span className="text-sm font-bold text-primary">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2 mb-5" />

        <div className="space-y-2.5">
          {checklist.map((item, i) => (
            <motion.div
              key={item.key}
              custom={i}
              initial="hidden"
              animate="show"
              variants={stagger}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                  {item.label}
                </span>
              </div>
              {!item.done && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 text-xs"
                  onClick={() => {
                    if (item.key === "share") {
                      handleShare();
                    } else if (item.route) {
                      navigate(item.route);
                    }
                  }}
                >
                  {item.action}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ─── SECTION 2: QUICK ACTION CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            icon: Plus,
            title: "Add a Service",
            desc: "Tell customers what you offer",
            cta: "Add Service",
            color: "bg-primary/10 text-primary",
            onClick: () => navigate("/app/marketplace-hub"),
          },
          {
            icon: MapPin,
            title: "Set Your Service Area",
            desc: "Let customers know where you work",
            cta: "Set Area",
            color: "bg-accent/10 text-accent",
            onClick: () => navigate("/app/marketplace-hub"),
          },
          {
            icon: CalendarCheck,
            title: "Enable Booking",
            desc: "Allow customers to book instantly",
            cta: "Enable Booking",
            color: "bg-success/10 text-success",
            onClick: () => navigate("/app/marketplace-hub"),
          },
          {
            icon: Share2,
            title: "Share Your Card",
            desc: "Send your link to start getting leads",
            cta: "Share",
            color: "bg-warning/10 text-warning",
            onClick: handleShare,
          },
        ].map((card, i) => (
          <motion.button
            key={card.title}
            custom={i}
            initial="hidden"
            animate="show"
            variants={stagger}
            onClick={card.onClick}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {card.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              <span className="inline-flex items-center text-xs text-primary font-medium mt-2 gap-1">
                {card.cta} <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ─── SECTION 3: CARD PREVIEW ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Your Card Preview</h2>
          <Button size="sm" variant="outline" onClick={() => window.open(cardUrl, "_blank")}>
            Open Full Card <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="p-6 flex flex-col items-center">
          {/* Mini card preview */}
          <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-lg overflow-hidden">
            {/* Cover */}
            <div className="h-24 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 relative">
              <div className="absolute -bottom-6 left-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border-2 border-background flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {MOCK_BUSINESS.name.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-9 px-5 pb-5">
              <h3 className="font-bold text-foreground">{MOCK_BUSINESS.name}</h3>
              <p className="text-xs text-muted-foreground">{MOCK_BUSINESS.headline}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {MOCK_BUSINESS.city}
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1 text-xs h-8">Book</Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8">Get Quote</Button>
              </div>
            </div>
          </div>

          {/* Share link */}
          <div className="mt-4 w-full max-w-sm flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
            <code className="flex-1 text-xs text-muted-foreground truncate pl-2">{cardUrl}</code>
            <Button size="sm" variant="ghost" className="flex-shrink-0 h-7 text-xs" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── SECTION 4: PERFORMANCE (EMPTY STATE) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Your Activity
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Leads", value: "0", icon: Users },
            { label: "Bookings", value: "0", icon: CalendarCheck },
            { label: "Views", value: "0", icon: Eye },
          ].map((metric) => (
            <div key={metric.label} className="text-center p-3 rounded-lg bg-muted/30">
              <metric.icon className="h-4 w-4 text-muted-foreground/50 mx-auto mb-1" />
              <p className="text-2xl font-bold text-muted-foreground/40">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Once you start sharing your card, your activity will appear here.
        </p>
      </motion.div>

      {/* ─── SHARE CTA WIDGET ─── */}
      <ShareCtaWidget views={0} onShare={() => setShareOpen(true)} />

      {/* ─── SECTION 5: SOFT UPGRADE PROMPT ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Star className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Want more visibility?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to appear higher in marketplace results and get more customers.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => navigate("/pricing")}>
            Explore Plans
          </Button>
        </div>
      </motion.div>

      {/* Share Modal */}
      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        businessName={MOCK_BUSINESS.name}
        slug={MOCK_BUSINESS.slug}
      />
    </div>
  );
}
