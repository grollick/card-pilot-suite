import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { CanvasElement, PostFormat } from "../../data/postTemplates";
import { FORMAT_DIMENSIONS } from "../../data/postTemplates";

interface Props {
  elements: CanvasElement[];
  format: PostFormat;
  bgColor: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onResizeElement: (id: string, w: number, h: number) => void;
}

export default function CanvasRenderer({
  elements, format, bgColor, selectedId, onSelect, onMoveElement, onResizeElement,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number; elX: number; elY: number }>({ x: 0, y: 0, elX: 0, elY: 0 });

  const dim = FORMAT_DIMENSIONS[format];
  const aspect = dim.w / dim.h;

  const getCanvasRect = useCallback(() => canvasRef.current?.getBoundingClientRect(), []);

  const handlePointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(el.id);
    setDragging(el.id);
    dragStart.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const rect = getCanvasRect();
    if (!rect) return;
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
    onMoveElement(dragging, dragStart.current.elX + dx, dragStart.current.elY + dy);
  };

  const handlePointerUp = () => setDragging(null);

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 cursor-crosshair"
        style={{
          aspectRatio: `${dim.w} / ${dim.h}`,
          backgroundColor: bgColor,
          maxHeight: "100%",
          maxWidth: "100%",
          width: aspect >= 1 ? "100%" : "auto",
          height: aspect < 1 ? "100%" : "auto",
        }}
        onClick={() => onSelect(null)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {sorted.map((el) => (
          <CanvasItem
            key={el.id}
            el={el}
            selected={selectedId === el.id}
            onPointerDown={(e) => handlePointerDown(e, el)}
          />
        ))}
      </div>
    </div>
  );
}

function CanvasItem({ el, selected, onPointerDown }: {
  el: CanvasElement; selected: boolean; onPointerDown: (e: React.PointerEvent) => void;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.width}%`,
    height: `${el.height}%`,
    zIndex: el.zIndex,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity ?? 1,
    cursor: el.locked ? "default" : "grab",
    touchAction: "none",
  };

  const selectionRing = selected
    ? "ring-2 ring-primary ring-offset-1 ring-offset-transparent"
    : "hover:ring-1 hover:ring-white/30";

  if (el.type === "text") {
    return (
      <div
        style={{
          ...base,
          fontSize: `clamp(8px, ${(el.fontSize ?? 16) / 10}vw, ${el.fontSize}px)`,
          fontWeight: el.fontWeight ?? "400",
          fontFamily: el.fontFamily ?? "Inter, sans-serif",
          color: el.color ?? "#FFFFFF",
          textAlign: el.textAlign ?? "left",
          lineHeight: 1.15,
          display: "flex",
          alignItems: "flex-start",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          userSelect: "none",
        }}
        className={selectionRing}
        onPointerDown={onPointerDown}
      >
        {el.text}
      </div>
    );
  }

  if (el.type === "shape") {
    return (
      <div
        style={{
          ...base,
          backgroundColor: el.fill ?? "#00000033",
          borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
        }}
        className={selectionRing}
        onPointerDown={onPointerDown}
      />
    );
  }

  if (el.type === "image") {
    return (
      <div
        style={{
          ...base,
          backgroundColor: el.fill ?? "#00000022",
          borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
          backgroundImage: el.imageUrl ? `url(${el.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className={`${selectionRing} flex items-center justify-center`}
        onPointerDown={onPointerDown}
      >
        {!el.imageUrl && (
          <span className="text-white/30 text-xs font-medium">Drop Image</span>
        )}
      </div>
    );
  }

  if (el.type === "badge") {
    return (
      <div
        style={{
          ...base,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        className={selectionRing}
        onPointerDown={onPointerDown}
      >
        <span
          className="px-4 py-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap"
          style={{
            backgroundColor: el.badgeColor ?? "#3b82f6",
            color: isLightColor(el.badgeColor ?? "#3b82f6") ? "#000" : "#FFF",
            borderRadius: el.borderRadius ? `${el.borderRadius}px` : "8px",
          }}
        >
          {el.badgeText}
        </span>
      </div>
    );
  }

  return null;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
