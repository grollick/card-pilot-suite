import { motion } from "framer-motion";
import { Phone, MessageSquare, Mail, Calendar, Star, MapPin, Camera, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DemoData } from "./CardDemoBuilder";

const STYLE_THEMES: Record<string, { bg: string; accent: string; headerGrad: string }> = {
  Modern: {
    bg: "bg-gradient-to-b from-slate-50 to-white",
    accent: "bg-primary text-primary-foreground",
    headerGrad: "from-primary to-accent",
  },
  Elegant: {
    bg: "bg-gradient-to-b from-amber-50/60 to-white",
    accent: "bg-amber-700 text-white",
    headerGrad: "from-amber-700 to-yellow-600",
  },
  Bold: {
    bg: "bg-gradient-to-b from-rose-50/60 to-white",
    accent: "bg-rose-600 text-white",
    headerGrad: "from-rose-600 to-orange-500",
  },
};

const SERVICE_MAP: Record<string, string[]> = {
  Contractor: ["Renovations", "New Construction", "Kitchen Remodels", "Bathroom Upgrades"],
  Realtor: ["Home Buying", "Home Selling", "Market Analysis", "Investment Properties"],
  Barber: ["Classic Cuts", "Beard Trim", "Hot Towel Shave", "Kids Cuts"],
  Photographer: ["Portraits", "Events", "Commercial", "Headshots"],
  Landscaper: ["Lawn Care", "Garden Design", "Hardscaping", "Tree Trimming"],
  Cleaner: ["Deep Clean", "Regular Clean", "Move-In/Out", "Office Cleaning"],
  Consultant: ["Strategy", "Operations", "Growth Planning", "Market Research"],
  "Personal Trainer": ["1-on-1 Training", "Group Classes", "Nutrition Plans", "Online Coaching"],
};

interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  accent: string;
}

function ActionBtn({ icon, label, tooltip, accent }: ActionBtnProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.04] active:scale-95 ${accent}`}>
            {icon}
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px] text-center">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DemoCardPreview({ data }: { data: DemoData }) {
  const theme = STYLE_THEMES[data.style] || STYLE_THEMES.Modern;
  const services = SERVICE_MAP[data.profession] || ["Service 1", "Service 2", "Service 3", "Service 4"];
  const initials = data.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-[360px]"
    >
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border border-border bg-card shadow-xl overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-1 bg-card">
          <div className="w-28 h-5 bg-foreground/10 rounded-full" />
        </div>

        {/* Card content */}
        <div className={`${theme.bg} pb-6`}>
          {/* Cover */}
          <div className={`h-28 bg-gradient-to-r ${theme.headerGrad} relative`}>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="h-20 w-20 rounded-full bg-card border-4 border-card shadow-lg flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">{initials || "CP"}</span>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="text-center mt-12 px-5">
            <h3 className="text-lg font-bold text-foreground">{data.name || "Your Name"}</h3>
            {data.company && (
              <p className="text-sm text-muted-foreground font-medium">{data.company}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{data.profession}</p>
            {data.city && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {data.city}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 px-5 mt-5">
            <ActionBtn
              icon={<Phone className="h-4 w-4" />}
              label="Call"
              tooltip="Customers tap to call you directly."
              accent={theme.accent}
            />
            <ActionBtn
              icon={<MessageSquare className="h-4 w-4" />}
              label="Text"
              tooltip="One-tap texting so leads reach you instantly."
              accent={theme.accent}
            />
            <ActionBtn
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              tooltip="Visitors can email you right from your card."
              accent={theme.accent}
            />
          </div>

          {/* Services */}
          <div className="px-5 mt-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Services</h4>
            <div className="grid grid-cols-2 gap-2">
              {services.map((s) => (
                <div key={s} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Booking CTA */}
          <div className="px-5 mt-5">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 ${theme.accent}`}>
                    <Calendar className="h-4 w-4" />
                    Book Appointment
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Customers can book appointments directly from your card.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Gallery placeholder */}
          <div className="px-5 mt-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Gallery</h4>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <Camera className="h-5 w-5 text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="px-5 mt-5">
            <div className="flex items-center gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-xs text-muted-foreground ml-1">5.0 (24 reviews)</span>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2 bg-card">
          <div className="w-32 h-1 bg-foreground/15 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}
