import { useState, useEffect } from "react";
import { Calendar, FileText, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SmartEngagementPopupProps {
  handle: string;
  profileName: string;
  palette: { primary: string; secondary: string; background: string };
  fonts: { primary: string; secondary: string };
  delaySeconds?: number;
  onAction: (action: "quote" | "book" | "ask") => void;
}

export default function SmartEngagementPopup({
  handle,
  profileName,
  palette,
  fonts,
  delaySeconds = 8,
  onAction,
}: SmartEngagementPopupProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `popup-dismissed-${handle}`;
    if (sessionStorage.getItem(key)) {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delaySeconds * 1000);
    return () => clearTimeout(timer);
  }, [handle, delaySeconds]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(`popup-dismissed-${handle}`, "1");
  };

  if (dismissed) return null;

  const actions = [
    { key: "quote" as const, label: "Request Quote", icon: FileText },
    { key: "book" as const, label: "Book Appointment", icon: Calendar },
    { key: "ask" as const, label: "Ask a Question", icon: MessageSquare },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            position: "fixed",
            bottom: 20,
            left: 16,
            right: 16,
            maxWidth: 360,
            margin: "0 auto",
            background: palette.background,
            borderRadius: 16,
            padding: "20px 16px 16px",
            boxShadow: "0 12px 40px -8px rgba(0,0,0,0.25)",
            border: `1px solid ${palette.primary}20`,
            zIndex: 9999,
            fontFamily: `'${fonts.secondary}', sans-serif`,
          }}
        >
          <button
            onClick={dismiss}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: palette.secondary,
              opacity: 0.5,
              padding: 4,
            }}
          >
            <X size={16} />
          </button>

          <p style={{
            fontSize: 15,
            fontWeight: 600,
            color: palette.primary,
            marginBottom: 4,
            fontFamily: `'${fonts.primary}', sans-serif`,
          }}>
            Need help with something?
          </p>
          <p style={{ fontSize: 12, color: palette.secondary, opacity: 0.7, marginBottom: 14 }}>
            {profileName} is ready to assist you
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.map(a => (
              <button
                key={a.key}
                onClick={() => {
                  onAction(a.key);
                  dismiss();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${palette.primary}20`,
                  background: `${palette.primary}08`,
                  color: palette.primary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: `'${fonts.secondary}', sans-serif`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${palette.primary}15`;
                  e.currentTarget.style.borderColor = `${palette.primary}40`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${palette.primary}08`;
                  e.currentTarget.style.borderColor = `${palette.primary}20`;
                }}
              >
                <a.icon size={16} />
                {a.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
