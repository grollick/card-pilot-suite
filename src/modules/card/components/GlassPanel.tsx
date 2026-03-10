import React from "react";
import { motion } from "framer-motion";

interface GlassPanelProps {
  children: React.ReactNode;
  /** Background opacity hex suffix (default "1A" = ~10%) */
  bgOpacity?: string;
  /** Blur intensity in px (default 20) */
  blur?: number;
  /** Base color for background tint (default "#ffffff") */
  tint?: string;
  /** Border color with alpha (default "rgba(255,255,255,0.15)") */
  borderColor?: string;
  /** Border radius in px or CSS string (default 16) */
  radius?: number | string;
  /** Additional padding (default 16) */
  padding?: number;
  /** Extra inline styles */
  style?: React.CSSProperties;
  className?: string;
  /** Animate entrance */
  animate?: boolean;
  /** Stagger index for entrance delay */
  index?: number;
}

/**
 * Reusable glassmorphism panel component for card sections.
 * Renders a translucent, blurred container with subtle border and shadow.
 * GPU-accelerated via backdrop-filter for smooth mobile performance.
 */
export default function GlassPanel({
  children,
  bgOpacity = "1A",
  blur = 20,
  tint = "#ffffff",
  borderColor = "rgba(255,255,255,0.15)",
  radius = 16,
  padding = 16,
  style,
  className = "",
  animate = true,
  index = 0,
}: GlassPanelProps) {
  const panelStyle: React.CSSProperties = {
    background: `${tint}${bgOpacity}`,
    backdropFilter: `blur(${blur}px) saturate(1.4)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
    border: `1px solid ${borderColor}`,
    borderRadius: typeof radius === "number" ? `${radius}px` : radius,
    padding,
    boxShadow: `0 8px 32px -8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)`,
    position: "relative" as const,
    overflow: "hidden" as const,
    ...style,
  };

  if (!animate) {
    return (
      <div style={panelStyle} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      style={panelStyle}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -2,
        boxShadow: "0 12px 40px -8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
}
