import { useState, useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import DesktopGuidanceNotice from "@/components/DesktopGuidanceNotice";
import { ArrowLeft, Download, Send, Sparkles, Wand2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import TemplatePicker from "../components/postdesigner/TemplatePicker";
import CanvasRenderer from "../components/postdesigner/CanvasRenderer";
import type { CanvasRendererHandle } from "../components/postdesigner/CanvasRenderer";
import StyleControls from "../components/postdesigner/StyleControls";
import AiSuggestionsPanel from "../components/postdesigner/AiSuggestionsPanel";
import type { CanvasElement, PostFormat, PostTemplate } from "../data/postTemplates";
import { POST_TEMPLATES, FORMAT_DIMENSIONS } from "../data/postTemplates";

const uid = () => Math.random().toString(36).slice(2, 10);

export default function PostDesigner() {
  const navigate = useNavigate();
  const canvasRendererRef = useRef<CanvasRendererHandle>(null);
  const [elements, setElements] = useState<CanvasElement[]>(POST_TEMPLATES[0].elements);
  const [bgColor, setBgColor] = useState(POST_TEMPLATES[0].bgColor);
  const [format, setFormat] = useState<PostFormat>(POST_TEMPLATES[0].format);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<PostTemplate | null>(POST_TEMPLATES[0]);
  const [showAi, setShowAi] = useState(true);
  const [exporting, setExporting] = useState(false);

  const selectedElement = elements.find((e) => e.id === selectedId) ?? null;

  const loadTemplate = useCallback((t: PostTemplate) => {
    setElements(t.elements.map((el) => ({ ...el, id: uid() })));
    setBgColor(t.bgColor);
    setFormat(t.format);
    setSelectedId(null);
    setCurrentTemplate(t);
    toast.success(`Loaded "${t.name}" template`);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  }, []);

  const moveElement = useCallback((id: string, x: number, y: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x: Math.max(-10, Math.min(110, x)), y: Math.max(-10, Math.min(110, y)) } : el)));
  }, []);

  const resizeElement = useCallback((id: string, w: number, h: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, width: w, height: h } : el)));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const duplicateElement = useCallback((id: string) => {
    setElements((prev) => {
      const source = prev.find((el) => el.id === id);
      if (!source) return prev;
      const copy = { ...source, id: uid(), x: source.x + 3, y: source.y + 3 };
      return [...prev, copy];
    });
  }, []);

  const addElement = useCallback((type: CanvasElement["type"]) => {
    const maxZ = Math.max(0, ...elements.map((e) => e.zIndex));
    const base: CanvasElement = {
      id: uid(), type, x: 20, y: 20, width: 40, height: 15, rotation: 0, zIndex: maxZ + 1,
    };
    if (type === "text") {
      Object.assign(base, { text: "New Text", fontSize: 24, fontWeight: "600", color: "#FFFFFF", textAlign: "center" });
    } else if (type === "shape") {
      Object.assign(base, { fill: "#ffffff22", borderRadius: 8 });
    } else if (type === "image") {
      Object.assign(base, { fill: "#ffffff11", borderRadius: 12 });
    } else if (type === "badge") {
      Object.assign(base, { badgeText: "CTA Button", badgeColor: "#3b82f6", borderRadius: 8, height: 8 });
    }
    setElements((prev) => [...prev, base]);
    setSelectedId(base.id);
  }, [elements]);

  const bringForward = useCallback((id: string) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, zIndex: el.zIndex + 1 } : el)));
  }, []);

  const sendBackward = useCallback((id: string) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, zIndex: Math.max(0, el.zIndex - 1) } : el)));
  }, []);

  const handleExport = useCallback(async () => {
    const el = canvasRendererRef.current?.getCanvasElement();
    if (!el) { toast.error("Canvas not ready"); return; }
    setExporting(true);
    try {
      // Deselect before capturing
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 100));
      const dim = FORMAT_DIMENSIONS[format];
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: dim.w / el.offsetWidth,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `post-${format}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG downloaded! You can now paste it into Canva.");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }, [format]);

  // AI application handlers
  const applyHeadline = useCallback((text: string) => {
    setElements((prev) => {
      const headline = prev.find((e) => e.type === "text" && (e.fontWeight === "800" || e.fontWeight === "700") && (e.fontSize ?? 16) >= 28);
      if (headline) {
        toast.success("Headline updated!");
        return prev.map((el) => (el.id === headline.id ? { ...el, text } : el));
      }
      toast.info("No headline element found — add a text element first");
      return prev;
    });
  }, []);

  const applySubheadline = useCallback((text: string) => {
    setElements((prev) => {
      const sub = prev.find((e) => e.type === "text" && (e.fontWeight === "400" || e.fontWeight === "500") && (e.fontSize ?? 16) < 28);
      if (sub) {
        toast.success("Subheadline updated!");
        return prev.map((el) => (el.id === sub.id ? { ...el, text } : el));
      }
      toast.info("No subheadline element found");
      return prev;
    });
  }, []);

  const applyCta = useCallback((text: string) => {
    setElements((prev) => {
      const badge = prev.find((e) => e.type === "badge");
      if (badge) {
        toast.success("CTA updated!");
        return prev.map((el) => (el.id === badge.id ? { ...el, badgeText: text } : el));
      }
      toast.info("No CTA badge element found");
      return prev;
    });
  }, []);

  const applyImage = useCallback((url: string, elementId?: string) => {
    setElements((prev) => {
      const target = elementId
        ? prev.find((e) => e.id === elementId)
        : prev.find((e) => e.type === "image");
      if (target) {
        toast.success("Image applied!");
        return prev.map((el) => (el.id === target.id ? { ...el, imageUrl: url } : el));
      }
      // Add a new image element
      const maxZ = Math.max(0, ...prev.map((e) => e.zIndex));
      const newEl: CanvasElement = {
        id: uid(), type: "image", x: 5, y: 30, width: 90, height: 40, rotation: 0, zIndex: maxZ + 1,
        fill: "#00000022", borderRadius: 12, imageUrl: url,
      };
      toast.success("Image added to canvas!");
      return [...prev, newEl];
    });
  }, []);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <DesktopGuidanceNotice toolKey="post-designer" />
      {/* Top toolbar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/app/social")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold text-sm">Post Designer</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAi ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowAi(!showAi)}
          >
            <Sparkles className="h-3 w-3" /> AI Assist
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Download className="h-3 w-3" /> Export
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 shadow-glow">
            <Send className="h-3 w-3" /> Publish
          </Button>
        </div>
      </div>

      {/* Four-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Template picker */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-64 border-r border-border bg-card shrink-0 overflow-hidden"
        >
          <TemplatePicker onSelect={loadTemplate} />
        </motion.div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-muted/30 overflow-hidden">
          <CanvasRenderer
            elements={elements}
            format={format}
            bgColor={bgColor}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMoveElement={moveElement}
            onResizeElement={resizeElement}
            ref={canvasRendererRef}
          />
        </div>

        {/* Right: Style controls */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-72 border-l border-border bg-card shrink-0 overflow-hidden"
        >
          <StyleControls
            selectedElement={selectedElement}
            bgColor={bgColor}
            format={format}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
            onDuplicateElement={duplicateElement}
            onAddElement={addElement}
            onChangeBg={setBgColor}
            onChangeFormat={setFormat}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
          />
        </motion.div>

        {/* Far right: AI panel */}
        <AnimatePresence>
          {showAi && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-card shrink-0 overflow-hidden"
            >
              <AiSuggestionsPanel
                currentTemplate={currentTemplate}
                elements={elements}
                onApplyHeadline={applyHeadline}
                onApplySubheadline={applySubheadline}
                onApplyCta={applyCta}
                onApplyImage={applyImage}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
