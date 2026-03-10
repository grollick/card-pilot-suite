import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageSquare, Calendar, FileText, Mail, MoreHorizontal, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ── Action definitions ──
const ACTION_META: Record<string, { icon: typeof Phone; label: string }> = {
  call: { icon: Phone, label: "Call" },
  text: { icon: MessageSquare, label: "Text" },
  book: { icon: Calendar, label: "Book" },
  quote: { icon: FileText, label: "Quote" },
  email: { icon: Mail, label: "Email" },
};

// ── Profession-aware default ordering ──
const PROFESSION_ACTIONS: Record<string, string[]> = {
  trade: ["call", "quote", "book"],
  beauty: ["book", "call", "text"],
  sales: ["call", "text", "book"],
  creative: ["book", "quote", "email"],
};

function getProfessionCategory(professionName?: string): string | null {
  if (!professionName) return null;
  const lower = professionName.toLowerCase();
  if (["contractor", "plumber", "electrician", "hvac", "roofer", "painter", "handyman", "landscaper", "carpenter", "mason", "welder", "mechanic", "cleaner", "pressure wash"].some(k => lower.includes(k))) return "trade";
  if (["barber", "stylist", "salon", "spa", "esthetician", "nail", "beauty", "massage", "wellness", "fitness", "trainer", "yoga", "therapist"].some(k => lower.includes(k))) return "beauty";
  if (["realtor", "real estate", "insurance", "financial", "sales", "consultant", "advisor", "broker"].some(k => lower.includes(k))) return "sales";
  if (["photographer", "videographer", "designer", "artist", "dj", "musician", "event", "wedding", "florist", "baker", "caterer", "chef"].some(k => lower.includes(k))) return "creative";
  return null;
}

interface StickyActionBarProps {
  profileId: string;
  handle: string;
  phone?: string | null;
  email?: string | null;
  professionName?: string;
  palette: { primary: string; secondary: string; accent?: string; background: string };
  enabledCtaIds?: string[];
  onCtaClick: (cta: string) => void;
  isOwner?: boolean;
}

export default function StickyActionBar({
  profileId, handle, phone, email, professionName,
  palette, enabledCtaIds, onCtaClick, isOwner,
}: StickyActionBarProps) {
  const [visible, setVisible] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Determine actions ──
  const profCat = getProfessionCategory(professionName);
  const defaultOrder = profCat ? PROFESSION_ACTIONS[profCat] : ["call", "book", "quote"];

  // Filter to available actions (has phone for call/text, has email for email)
  const available = (enabledCtaIds ?? defaultOrder).filter(id => {
    if (id === "call" || id === "text") return !!phone;
    if (id === "email") return !!email;
    return ["book", "quote"].includes(id);
  });

  // If enabledCtaIds not provided, use profession defaults filtered by availability
  const orderedActions = enabledCtaIds
    ? available
    : defaultOrder.filter(id => available.includes(id));

  // Split into visible (max 3) and overflow
  const visibleActions = orderedActions.slice(0, 3);
  const overflowActions = orderedActions.slice(3);

  // ── Intersection Observer: show after hero ──
  useEffect(() => {
    // Create a sentinel div at top of page if not existing
    let sentinel = document.getElementById("sticky-bar-sentinel");
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "sticky-bar-sentinel";
      sentinel.style.position = "absolute";
      sentinel.style.top = "300px"; // trigger after hero area
      sentinel.style.height = "1px";
      sentinel.style.width = "1px";
      sentinel.style.pointerEvents = "none";
      document.body.appendChild(sentinel);
    }
    sentinelRef.current = sentinel;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      sentinel?.remove();
    };
  }, []);

  const trackAndClick = (actionId: string) => {
    // Track sticky bar click
    supabase.from("analytics_events").insert({
      user_id: profileId,
      handle,
      event_type: "button_click" as const,
      meta_json: { cta: actionId, source: "sticky_bar" },
    }).then();
    onCtaClick(actionId);
    setMoreOpen(false);
  };

  if (isOwner || visibleActions.length === 0) return null;

  // ── Contrast color for text on primary ──
  const textOnPrimary = "#ffffff";

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* ── Mobile: Bottom bar ── */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              padding: "8px 12px calc(env(safe-area-inset-bottom, 8px) + 8px) 12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 20,
                background: palette.primary,
                boxShadow: `0 -4px 24px -4px ${palette.primary}60, 0 8px 32px -8px rgba(0,0,0,0.3)`,
                backdropFilter: "blur(16px)",
              }}
            >
              {visibleActions.map(id => {
                const meta = ACTION_META[id];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <button
                    key={id}
                    onClick={() => trackAndClick(id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      flex: 1,
                      padding: "8px 4px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      cursor: "pointer",
                      color: textOnPrimary,
                      transition: "background 0.15s",
                      minWidth: 0,
                    }}
                    onMouseDown={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                    onMouseUp={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                  >
                    <Icon style={{ width: 20, height: 20 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.01em" }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}

              {overflowActions.length > 0 && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      padding: "8px 12px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      cursor: "pointer",
                      color: textOnPrimary,
                    }}
                  >
                    {moreOpen ? <X style={{ width: 20, height: 20 }} /> : <MoreHorizontal style={{ width: 20, height: 20 }} />}
                    <span style={{ fontSize: 11, fontWeight: 600 }}>More</span>
                  </button>

                  <AnimatePresence>
                    {moreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          right: 0,
                          marginBottom: 8,
                          background: palette.background,
                          borderRadius: 14,
                          boxShadow: "0 8px 32px -8px rgba(0,0,0,0.25)",
                          overflow: "hidden",
                          minWidth: 140,
                        }}
                      >
                        {overflowActions.map(id => {
                          const meta = ACTION_META[id];
                          if (!meta) return null;
                          const Icon = meta.icon;
                          return (
                            <button
                              key={id}
                              onClick={() => trackAndClick(id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                width: "100%",
                                padding: "12px 16px",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: palette.primary,
                                fontSize: 14,
                                fontWeight: 500,
                              }}
                            >
                              <Icon style={{ width: 18, height: 18 }} />
                              {meta.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Desktop: Floating side panel ── */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:flex"
            style={{
              position: "fixed",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 9999,
              flexDirection: "column",
              gap: 8,
              padding: 8,
              borderRadius: 18,
              background: `${palette.background}F0`,
              boxShadow: `0 8px 32px -8px rgba(0,0,0,0.15), 0 0 0 1px ${palette.secondary}15`,
              backdropFilter: "blur(16px)",
            }}
          >
            {[...visibleActions, ...overflowActions].map(id => {
              const meta = ACTION_META[id];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <button
                  key={id}
                  onClick={() => trackAndClick(id)}
                  title={meta.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: palette.primary,
                    color: textOnPrimary,
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: `0 2px 8px -2px ${palette.primary}50`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = `0 4px 16px -2px ${palette.primary}70`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 2px 8px -2px ${palette.primary}50`; }}
                >
                  <Icon style={{ width: 20, height: 20 }} />
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
