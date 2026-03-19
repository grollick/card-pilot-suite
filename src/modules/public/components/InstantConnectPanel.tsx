import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OnDutyProfessional } from "@/hooks/useOnDutyMap";
import {
  X, MessageSquare, Phone, FileText, Eye, Star, Clock, Zap,
  Radio, Shield, ChevronDown,
} from "lucide-react";
import QuickQuoteForm from "./QuickQuoteForm";

function formatResponseTime(min: number | null) {
  if (!min) return null;
  if (min < 60) return `${Math.round(min)}m`;
  return `${Math.round(min / 60)}h`;
}

interface Props {
  professional: OnDutyProfessional | null;
  onClose: () => void;
}

type PanelTab = "actions" | "quote";

export default function InstantConnectPanel({ professional, onClose }: Props) {
  const [tab, setTab] = useState<PanelTab>("actions");

  if (!professional) return null;
  const pro = professional;

  const initials = pro.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  const prefilledMessage = encodeURIComponent(
    `Hi ${pro.name.split(" ")[0]}, I saw you're available on CardPilot. I need help with a project — are you free to chat?`
  );

  return (
    <AnimatePresence>
      <motion.div
        key="instant-connect-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        key="instant-connect-panel"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[1200] bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto md:left-auto md:right-4 md:bottom-4 md:w-[420px] md:rounded-2xl md:border md:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-4 pt-2 pb-3 flex items-start gap-3">
          <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-offset-background ring-success/50 shrink-0">
            <AvatarImage src={pro.avatar_url ?? undefined} />
            <AvatarFallback className="text-sm font-bold bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base truncate">{pro.name}</h3>
              {pro.status === "available" && (
                <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse shrink-0" />
              )}
              {pro.status === "recent" && (
                <span className="h-2.5 w-2.5 rounded-full bg-warning shrink-0" />
              )}
            </div>
            {pro.profession_name && (
              <p className="text-sm text-muted-foreground truncate">{pro.profession_name}</p>
            )}
            {pro.company && (
              <p className="text-xs text-muted-foreground truncate">{pro.company}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Trust badges */}
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {pro.status === "available" && (
            <Badge className="bg-success/10 text-success border-success/20 gap-1 text-xs">
              <Radio className="h-3 w-3" /> Available Now
            </Badge>
          )}
          {pro.status === "recent" && (
            <Badge className="bg-warning/10 text-warning border-warning/20 gap-1 text-xs">
              <Clock className="h-3 w-3" /> Recently Active
            </Badge>
          )}
          {pro.avg_rating && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Star className="h-3 w-3 text-warning fill-warning" />
              {pro.avg_rating} ({pro.review_count})
            </Badge>
          )}
          {pro.avg_response_minutes && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Zap className="h-3 w-3 text-warning" />
              {formatResponseTime(pro.avg_response_minutes)} avg response
            </Badge>
          )}
          {pro.badges.filter(b => b !== "On Duty").map(b => (
            <Badge key={b} variant="outline" className="gap-1 text-xs">
              {b === "Fast Responder" && <Zap className="h-3 w-3 text-warning" />}
              {b === "Highly Rated" && <Star className="h-3 w-3 text-warning" />}
              {b}
            </Badge>
          ))}
        </div>

        <div className="border-t border-border" />

        {/* Tab bar */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("actions")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
              tab === "actions"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Quick Actions
          </button>
          <button
            onClick={() => setTab("quote")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
              tab === "quote"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Get a Quote
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {tab === "actions" ? (
            <div className="space-y-2.5">
              {/* Message */}
              <Button
                asChild
                className="w-full h-12 text-sm gap-2.5 justify-start bg-primary hover:bg-primary/90"
              >
                <Link to={`/${pro.handle}?quote=1&msg=${prefilledMessage}`}>
                  <MessageSquare className="h-4.5 w-4.5" />
                  <div className="text-left">
                    <span className="block font-semibold">Send a Message</span>
                    <span className="block text-[10px] opacity-80">Pre-filled intro — just hit send</span>
                  </div>
                </Link>
              </Button>

              {/* Call */}
              <Button
                variant="outline"
                className="w-full h-12 text-sm gap-2.5 justify-start"
                onClick={() => {
                  // Track call click via analytics if handle available
                  window.open(`tel:`, "_self");
                }}
                asChild
              >
                <Link to={`/${pro.handle}?action=call`}>
                  <Phone className="h-4.5 w-4.5 text-success" />
                  <div className="text-left">
                    <span className="block font-semibold">Call Now</span>
                    <span className="block text-[10px] text-muted-foreground">Connect directly by phone</span>
                  </div>
                </Link>
              </Button>

              {/* Get Quote */}
              <Button
                variant="outline"
                className="w-full h-12 text-sm gap-2.5 justify-start"
                onClick={() => setTab("quote")}
              >
                <FileText className="h-4.5 w-4.5 text-primary" />
                <div className="text-left">
                  <span className="block font-semibold">Get a Quote</span>
                  <span className="block text-[10px] text-muted-foreground">Quick form — takes 30 seconds</span>
                </div>
              </Button>

              {/* View Profile */}
              <Button
                asChild
                variant="ghost"
                className="w-full h-12 text-sm gap-2.5 justify-start"
              >
                <Link to={`/${pro.handle}`}>
                  <Eye className="h-4.5 w-4.5 text-muted-foreground" />
                  <div className="text-left">
                    <span className="block font-semibold">View Full Profile</span>
                    <span className="block text-[10px] text-muted-foreground">Reviews, portfolio & more</span>
                  </div>
                </Link>
              </Button>

              {/* Privacy note */}
              <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3 shrink-0" />
                <span>Location is approximate for privacy. Contact the professional for exact details.</span>
              </div>
            </div>
          ) : (
            <QuickQuoteForm professional={pro} onSuccess={() => setTab("actions")} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
