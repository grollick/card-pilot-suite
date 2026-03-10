import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
  url: string;
  caption?: string;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  radii: string;
  palette: { primary: string; secondary: string; background: string };
}

export default function GalleryLightbox({ images, radii, palette }: GalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() => setActiveIndex(i => i !== null ? (i - 1 + images.length) % images.length : null), [images.length]);
  const next = useCallback(() => setActiveIndex(i => i !== null ? (i + 1) % images.length : null), [images.length]);

  // Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prev() : next();
    }
    setTouchStart(null);
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {images.map((img, i) => (
          <motion.div
            key={i}
            style={{ borderRadius: radii, overflow: "hidden", cursor: "pointer" }}
            whileHover={{ scale: 1.03, boxShadow: `0 8px 24px -8px ${palette.primary}30` }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setActiveIndex(i)}
          >
            <motion.img
              src={img.url}
              alt={img.caption || ""}
              loading="lazy"
              style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.3 }}
            />
            {img.caption && (
              <p style={{ fontSize: 11, color: palette.secondary, padding: "4px 0", margin: 0, textAlign: "center" }}>
                {img.caption}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            {/* Close */}
            <button
              onClick={close}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: "50%", width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff", zIndex: 2,
              }}
            >
              <X size={20} />
            </button>

            {/* Nav buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="hidden md:flex"
                  style={{
                    position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.15)", border: "none",
                    borderRadius: "50%", width: 44, height: 44,
                    alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#fff", zIndex: 2,
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="hidden md:flex"
                  style={{
                    position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.15)", border: "none",
                    borderRadius: "50%", width: 44, height: 44,
                    alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#fff", zIndex: 2,
                  }}
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={activeIndex}
              src={images[activeIndex].url}
              alt={images[activeIndex].caption || ""}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 12,
              }}
            />

            {/* Caption + counter */}
            <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center" }}>
              {images[activeIndex].caption && (
                <p style={{ color: "#fff", fontSize: 14, margin: "0 0 4px" }}>{images[activeIndex].caption}</p>
              )}
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0 }}>
                {activeIndex + 1} / {images.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
