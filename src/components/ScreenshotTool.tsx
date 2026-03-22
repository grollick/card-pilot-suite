import { useState, useRef, useCallback } from "react";
import { Camera, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function ScreenshotTool() {
  const [active, setActive] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [rect, setRect] = useState<SelectionRect | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const startCapture = useCallback(() => {
    setActive(true);
    setRect(null);
    setPreview(null);
  }, []);

  const cancel = useCallback(() => {
    setActive(false);
    setSelecting(false);
    setRect(null);
    setPreview(null);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setSelecting(true);
    setRect({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!selecting) return;
    setRect((prev) => prev ? { ...prev, endX: e.clientX, endY: e.clientY } : null);
  }, [selecting]);

  const handlePointerUp = useCallback(async () => {
    if (!selecting || !rect) return;
    setSelecting(false);

    const x = Math.min(rect.startX, rect.endX);
    const y = Math.min(rect.startY, rect.endY);
    const w = Math.abs(rect.endX - rect.startX);
    const h = Math.abs(rect.endY - rect.startY);

    if (w < 20 || h < 20) {
      toast.error("Selection too small — drag a larger area");
      setRect(null);
      return;
    }

    // Hide overlay before capturing
    setActive(false);

    try {
      await new Promise((r) => setTimeout(r, 250));

      const dpr = window.devicePixelRatio || 1;
      const canvas = await html2canvas(document.body, {
        x, y, width: w, height: h,
        scale: dpr,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        ignoreElements: (el) => {
          if (el.tagName === 'CANVAS' && (el as HTMLCanvasElement).width === 0) return true;
          if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') return true;
          return false;
        },
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
          clonedDoc.head.appendChild(style);
        },
      });

      const dataUrl = canvas.toDataURL("image/png");
      setPreview(dataUrl);
    } catch (err) {
      console.error("Screenshot capture failed, trying fallback:", err);
      try {
        const canvas = await html2canvas(document.body, {
          x, y, width: w, height: h,
          scale: 1,
          useCORS: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          ignoreElements: (el) => el.tagName === 'CANVAS' || el.tagName === 'VIDEO' || el.tagName === 'IFRAME',
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement('style');
            style.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; background-image: none !important; }';
            clonedDoc.head.appendChild(style);
          },
        });
        setPreview(canvas.toDataURL("image/png"));
        toast.info("Captured in simplified mode");
      } catch {
        toast.error("Capture failed — try a different area");
      }
      setRect(null);
    }
  }, [selecting, rect]);

  const downloadScreenshot = useCallback(() => {
    if (!preview) return;
    const link = document.createElement("a");
    link.download = `screenshot-${Date.now()}.png`;
    link.href = preview;
    link.click();
    toast.success("Screenshot downloaded! Drag it into Canva to use.");
    setPreview(null);
    setRect(null);
  }, [preview]);

  const normalizedRect = rect ? {
    left: Math.min(rect.startX, rect.endX),
    top: Math.min(rect.startY, rect.endY),
    width: Math.abs(rect.endX - rect.startX),
    height: Math.abs(rect.endY - rect.startY),
  } : null;

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={startCapture}
        size="icon"
        variant="outline"
        className="fixed bottom-20 right-4 z-[998] h-10 w-10 rounded-full shadow-lg bg-card border-border hover:bg-primary hover:text-primary-foreground transition-colors"
        title="Screenshot capture"
      >
        <Camera className="h-4 w-4" />
      </Button>

      {/* Selection overlay */}
      {active && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] cursor-crosshair"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Instructions */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card text-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-3">
            <Camera className="h-4 w-4 text-primary" />
            Drag to select area
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Selection rectangle */}
          {normalizedRect && normalizedRect.width > 2 && (
            <div
              className="absolute border-2 border-primary bg-primary/10 rounded"
              style={{
                left: normalizedRect.left,
                top: normalizedRect.top,
                width: normalizedRect.width,
                height: normalizedRect.height,
              }}
            />
          )}
        </div>
      )}

      {/* Preview dialog */}
      {preview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl p-4 max-w-[80vw] max-h-[80vh] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Screenshot Preview</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPreview(null); setRect(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-auto flex-1 rounded-lg border border-border">
              <img src={preview} alt="Screenshot" className="max-w-full" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setPreview(null); setRect(null); }}>
                Cancel
              </Button>
              <Button size="sm" className="gap-1.5" onClick={downloadScreenshot}>
                <Download className="h-3.5 w-3.5" /> Download PNG
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
