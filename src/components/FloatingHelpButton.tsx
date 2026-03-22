import { useState } from "react";
import { HelpCircle, X, PlayCircle, BookOpen, Lightbulb, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HelpItem {
  icon: typeof HelpCircle;
  label: string;
  description: string;
  action: () => void;
}

const contextualHelp: Record<string, { title: string; tips: string[] }> = {
  "/app": {
    title: "Dashboard",
    tips: [
      "Check 'Next Actions' daily for the most impactful tasks.",
      "Share your card link to start capturing leads.",
      "The Business Health Score shows your overall performance.",
    ],
  },
  "/app/card": {
    title: "Card Builder",
    tips: [
      "Add a compelling headline and clear call-to-action.",
      "Upload a professional photo to build trust.",
      "Publish your card and share the link to capture leads.",
    ],
  },
  "/app/contacts": {
    title: "Contacts & Leads",
    tips: [
      "All lead form submissions appear here automatically.",
      "Use pipeline stages to track lead progress.",
      "Set follow-up tasks to never miss an opportunity.",
    ],
  },
  "/app/bookings": {
    title: "Bookings",
    tips: [
      "Set your availability so customers can book online.",
      "Add services with descriptions and pricing.",
      "Booking confirmations are sent automatically.",
    ],
  },
  "/app/analytics": {
    title: "Analytics",
    tips: [
      "Track card views to see who's interested.",
      "Monitor lead sources to focus your marketing.",
      "Check conversion rates to optimize your card.",
    ],
  },
};

export default function FloatingHelpButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const help = contextualHelp[currentPath] || contextualHelp["/app"];

  const items: HelpItem[] = [
    {
      icon: BookOpen,
      label: "Help Center",
      description: "Guides, FAQs & tutorials",
      action: () => { navigate("/app/help"); setOpen(false); },
    },
    {
      icon: PlayCircle,
      label: "Video Tutorials",
      description: "Watch step-by-step guides",
      action: () => { navigate("/app/help"); setOpen(false); },
    },
    {
      icon: Rocket,
      label: "Getting Started",
      description: "Setup checklist & tips",
      action: () => { navigate("/app/help#getting-started"); setOpen(false); },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-14 right-0 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden mb-2 pointer-events-auto"
          >
            {/* Header */}
            <div className="bg-primary/5 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{help?.title || "Help"} Tips</span>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-3 space-y-2 border-b border-border">
              {(help?.tips || []).map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-2">
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-2xs text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center transition-colors hover:bg-primary/90"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div key="help" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <HelpCircle className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
