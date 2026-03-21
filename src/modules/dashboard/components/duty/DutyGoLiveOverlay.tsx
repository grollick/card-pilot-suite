import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Radio, Users } from "lucide-react";

interface DutyGoLiveOverlayProps {
  show: boolean;
  onComplete: () => void;
}

export default function DutyGoLiveOverlay({ show, onComplete }: DutyGoLiveOverlayProps) {
  const [phase, setPhase] = useState<"enter" | "pulse" | "exit">("enter");

  useEffect(() => {
    if (!show) {
      setPhase("enter");
      return;
    }
    // Phase timeline: enter → pulse → exit
    const t1 = setTimeout(() => setPhase("pulse"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2800);
    const t3 = setTimeout(() => onComplete(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--success)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Expanding pulse rings */}
          {phase !== "enter" && [0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-success/30 pointer-events-none"
              initial={{ width: 40, height: 40, opacity: 0.6 }}
              animate={{
                width: [40, 300 + i * 80],
                height: [40, 300 + i * 80],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 1.8,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Center content */}
          <div className="relative flex flex-col items-center gap-5 z-10">
            {/* Pin marker with glow */}
            <motion.div
              className="relative"
              initial={{ scale: 0, y: -40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
            >
              {/* Glow behind pin */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, hsl(var(--success) / 0.5), transparent 70%)",
                  filter: "blur(20px)",
                  width: 120,
                  height: 120,
                  left: -30,
                  top: -30,
                }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Pin icon */}
              <div className="h-16 w-16 rounded-full bg-success/20 border-2 border-success flex items-center justify-center relative">
                <MapPin className="h-7 w-7 text-success" />
                {/* Live dot */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-success border-2 border-background" />
                </span>
              </div>
            </motion.div>

            {/* Text content */}
            <motion.div
              className="text-center space-y-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 justify-center">
                <Radio className="h-5 w-5 text-success" />
                You are now live
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Customers can now find you nearby
              </p>
            </motion.div>

            {/* Nearby indicator */}
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <Users className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-medium text-success">
                Active on the marketplace map
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
