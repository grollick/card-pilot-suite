import { useState } from "react";
import {
  Type, Palette, Image, Square, AlignLeft, AlignCenter, AlignRight,
  Bold, ChevronUp, ChevronDown, Trash2, Copy, Lock, Unlock, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CanvasElement, PostFormat } from "../../data/postTemplates";
import { FORMAT_DIMENSIONS } from "../../data/postTemplates";

interface Props {
  selectedElement: CanvasElement | null;
  bgColor: string;
  format: PostFormat;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddElement: (type: CanvasElement["type"]) => void;
  onChangeBg: (color: string) => void;
  onChangeFormat: (format: PostFormat) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}

const FONT_FAMILIES = ["Inter", "Georgia", "Courier New", "Arial Black", "Impact", "Trebuchet MS"];
const QUICK_COLORS = ["#FFFFFF", "#000000", "#e94560", "#3b82f6", "#22c55e", "#f59e0b", "#a78bfa", "#f43f5e", "#14b8a6", "#d4af37"];

export default function StyleControls({
  selectedElement: el, bgColor, format,
  onUpdateElement, onDeleteElement, onDuplicateElement, onAddElement,
  onChangeBg, onChangeFormat, onBringForward, onSendBackward,
}: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Design Controls</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Canvas settings */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Canvas</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(FORMAT_DIMENSIONS) as PostFormat[]).map((f) => (
                <Button
                  key={f}
                  variant={format === f ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => onChangeFormat(f)}
                >
                  {FORMAT_DIMENSIONS[f].label.split(" ")[0]}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-[10px] text-muted-foreground shrink-0">Background</Label>
              <Input
                type="color"
                value={bgColor}
                onChange={(e) => onChangeBg(e.target.value)}
                className="h-7 w-10 p-0.5 cursor-pointer"
              />
              <Input
                value={bgColor}
                onChange={(e) => onChangeBg(e.target.value)}
                className="h-7 text-xs flex-1 font-mono"
              />
            </div>
          </div>

          {/* Add elements */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Add Element</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => onAddElement("text")}>
                <Type className="h-3 w-3" /> Text
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => onAddElement("image")}>
                <Image className="h-3 w-3" /> Image
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => onAddElement("shape")}>
                <Square className="h-3 w-3" /> Shape
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => onAddElement("badge")}>
                <Plus className="h-3 w-3" /> Badge
              </Button>
            </div>
          </div>

          {/* Selected element controls */}
          {el && (
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Selected: {el.type}
                </Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onBringForward(el.id)}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSendBackward(el.id)}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDuplicateElement(el.id)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDeleteElement(el.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">X (%)</Label>
                  <Input type="number" value={Math.round(el.x)} onChange={(e) => onUpdateElement(el.id, { x: Number(e.target.value) })} className="h-7 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Y (%)</Label>
                  <Input type="number" value={Math.round(el.y)} onChange={(e) => onUpdateElement(el.id, { y: Number(e.target.value) })} className="h-7 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Width (%)</Label>
                  <Input type="number" value={Math.round(el.width)} onChange={(e) => onUpdateElement(el.id, { width: Number(e.target.value) })} className="h-7 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Height (%)</Label>
                  <Input type="number" value={Math.round(el.height)} onChange={(e) => onUpdateElement(el.id, { height: Number(e.target.value) })} className="h-7 text-xs" />
                </div>
              </div>

              {/* Text-specific */}
              {(el.type === "text") && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px]">Text</Label>
                    <Textarea
                      value={el.text ?? ""}
                      onChange={(e) => onUpdateElement(el.id, { text: e.target.value })}
                      className="text-xs min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Font Size</Label>
                      <Input type="number" value={el.fontSize ?? 16} onChange={(e) => onUpdateElement(el.id, { fontSize: Number(e.target.value) })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Font</Label>
                      <Select value={el.fontFamily ?? "Inter"} onValueChange={(v) => onUpdateElement(el.id, { fontFamily: v })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILIES.map((f) => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Label className="text-[10px] shrink-0">Color</Label>
                    <Input type="color" value={el.color ?? "#FFFFFF"} onChange={(e) => onUpdateElement(el.id, { color: e.target.value })} className="h-7 w-8 p-0.5" />
                    <div className="flex gap-0.5 flex-wrap">
                      {QUICK_COLORS.slice(0, 6).map((c) => (
                        <button key={c} className="h-5 w-5 rounded border border-border/50" style={{ backgroundColor: c }} onClick={() => onUpdateElement(el.id, { color: c })} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant={el.textAlign === "left" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => onUpdateElement(el.id, { textAlign: "left" })}><AlignLeft className="h-3 w-3" /></Button>
                    <Button variant={el.textAlign === "center" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => onUpdateElement(el.id, { textAlign: "center" })}><AlignCenter className="h-3 w-3" /></Button>
                    <Button variant={el.textAlign === "right" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => onUpdateElement(el.id, { textAlign: "right" })}><AlignRight className="h-3 w-3" /></Button>
                    <Button variant={el.fontWeight === "700" || el.fontWeight === "800" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => onUpdateElement(el.id, { fontWeight: el.fontWeight === "700" || el.fontWeight === "800" ? "400" : "700" })}><Bold className="h-3 w-3" /></Button>
                  </div>
                </div>
              )}

              {/* Badge-specific */}
              {el.type === "badge" && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px]">Badge Text</Label>
                    <Input value={el.badgeText ?? ""} onChange={(e) => onUpdateElement(el.id, { badgeText: e.target.value })} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] shrink-0">Color</Label>
                    <Input type="color" value={el.badgeColor ?? "#3b82f6"} onChange={(e) => onUpdateElement(el.id, { badgeColor: e.target.value })} className="h-7 w-8 p-0.5" />
                    <div className="flex gap-0.5">
                      {QUICK_COLORS.map((c) => (
                        <button key={c} className="h-5 w-5 rounded border border-border/50" style={{ backgroundColor: c }} onClick={() => onUpdateElement(el.id, { badgeColor: c })} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Shape/Image fill */}
              {(el.type === "shape" || el.type === "image") && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] shrink-0">Fill</Label>
                    <Input type="color" value={(el.fill ?? "#00000033").slice(0, 7)} onChange={(e) => onUpdateElement(el.id, { fill: e.target.value })} className="h-7 w-8 p-0.5" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Opacity</Label>
                    <Slider value={[(el.opacity ?? 1) * 100]} min={0} max={100} step={5} onValueChange={([v]) => onUpdateElement(el.id, { opacity: v / 100 })} />
                  </div>
                  <div>
                    <Label className="text-[10px]">Border Radius</Label>
                    <Slider value={[el.borderRadius ?? 0]} min={0} max={50} step={2} onValueChange={([v]) => onUpdateElement(el.id, { borderRadius: v })} />
                  </div>
                  {el.type === "image" && (
                    <div>
                      <Label className="text-[10px]">Image URL</Label>
                      <Input value={el.imageUrl ?? ""} onChange={(e) => onUpdateElement(el.id, { imageUrl: e.target.value })} placeholder="https://..." className="h-7 text-xs" />
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-[10px]">Rotation (°)</Label>
                <Slider value={[el.rotation]} min={-180} max={180} step={5} onValueChange={([v]) => onUpdateElement(el.id, { rotation: v })} />
              </div>
            </div>
          )}

          {!el && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Select an element on the canvas to edit it
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
