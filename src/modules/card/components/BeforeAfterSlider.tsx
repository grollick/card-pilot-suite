import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Border radius CSS value */
  radius?: string;
  /** Height in px (default 240) */
  height?: number;
  /** Palette for handle styling */
  accentColor?: string;
}

/**
 * Interactive Before/After image comparison slider.
 * Supports mouse drag, touch swipe, and tap-to-toggle.
 * Uses GPU-accelerated clip-path for smooth 60fps performance.
 */
export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
  radius = "12px",
  height = 240,
  accentColor = "#4361ee",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const [loaded, setLoaded] = useState({ before: false, after: false });

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, updatePosition]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    updatePosition(e.touches[0].clientX);
  }, [isDragging, updatePosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Tap to toggle
  const handleTap = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tapPct = (x / rect.width) * 100;
    // If tap is near the handle (±8%), treat as drag start, not toggle
    if (Math.abs(tapPct - position) < 8) return;
    setPosition(tapPct < position ? 15 : 85);
  }, [position, isDragging]);

  const allLoaded = loaded.before && loaded.after;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: radius,
        overflow: "hidden",
        cursor: isDragging ? "ew-resize" : "pointer",
        userSelect: "none",
        touchAction: "pan-y",
        background: `${accentColor}10`,
      }}
    >
      {/* After image (full background) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        loading="lazy"
        onLoad={() => setLoaded(l => ({ ...l, after: true }))}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: allLoaded ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />

      {/* Before image (clipped) */}
      <img
        src={beforeSrc}
        alt={beforeLabel}
        loading="lazy"
        onLoad={() => setLoaded(l => ({ ...l, before: true }))}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          opacity: allLoaded ? 1 : 0,
          transition: isDragging ? "none" : "clip-path 0.3s ease, opacity 0.3s",
        }}
      />

      {/* Loading skeleton */}
      {!allLoaded && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${accentColor}08`,
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: `2px solid ${accentColor}30`,
            borderTopColor: accentColor,
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {/* Slider handle */}
      {allLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${position}%`,
            transform: "translateX(-50%)",
            width: 3,
            background: "#FFFFFF",
            boxShadow: "0 0 8px rgba(0,0,0,0.3)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          {/* Handle grip */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#FFFFFF",
              boxShadow: `0 2px 12px rgba(0,0,0,0.25), 0 0 0 2px ${accentColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 3L2 8L5 13" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 3L14 8L11 13" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Labels */}
      {allLoaded && (
        <>
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#FFFFFF",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              padding: "3px 8px",
              borderRadius: 6,
              zIndex: 2,
              opacity: position > 12 ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            {beforeLabel}
          </span>
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#FFFFFF",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              padding: "3px 8px",
              borderRadius: 6,
              zIndex: 2,
              opacity: position < 88 ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            {afterLabel}
          </span>
        </>
      )}

      {/* CSS keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
