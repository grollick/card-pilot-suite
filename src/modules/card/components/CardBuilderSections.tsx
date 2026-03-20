import { Paintbrush, Sparkles, Loader2, MousePointerClick, Globe } from "lucide-react";
import BuilderAISuggestions from "./BuilderAISuggestions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import SortableSectionItem from "./SortableSectionItem";
import CtaEditor, { type CtaItem } from "./CtaEditor";
import type { CardSection } from "@/hooks/useCard";

interface Props {
  sections: CardSection[];
  setSections: React.Dispatch<React.SetStateAction<CardSection[]>>;
  toggleSection: (id: string) => void;
  setEditingSection: (id: string | null) => void;
  showSectionIcons: boolean;
  setShowSectionIcons: (v: boolean) => void;
  saveThemeField: (fields: Record<string, any>) => void;
  saveSections: (s: CardSection[], immediate?: boolean) => void;
  // AI
  isGenerating: boolean;
  aiContent: any;
  onAIGenerate: () => void;
  // CTA
  ctaConfig: CtaItem[];
  ctaIconsOnly: boolean;
  setCtaIconsOnly: (v: boolean) => void;
  onCtaConfigChange: (c: CtaItem[]) => void;
  // Social
  socialIconsOnly: boolean;
  setSocialIconsOnly: (v: boolean) => void;
  socialBtnColor: string;
  setSocialBtnColor: (v: string) => void;
  socialBtnStyle: "auto" | "filled" | "outline";
  setSocialBtnStyle: (v: "auto" | "filled" | "outline") => void;
  hideWrapper?: boolean;
}

export default function CardBuilderSections({
  sections, setSections, toggleSection, setEditingSection,
  showSectionIcons, setShowSectionIcons, saveThemeField, saveSections,
  isGenerating, aiContent, onAIGenerate,
  ctaConfig, ctaIconsOnly, setCtaIconsOnly, onCtaConfigChange,
  socialIconsOnly, setSocialIconsOnly, socialBtnColor, setSocialBtnColor,
  socialBtnStyle, setSocialBtnStyle, hideWrapper,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      saveSections(next);
      return next;
    });
  };

  return (
    <div className={hideWrapper ? "space-y-3" : "rounded-xl border border-border bg-card p-4 space-y-3"}>
      {!hideWrapper && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Sections</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Icons</span>
          <Switch checked={showSectionIcons} onCheckedChange={(val) => { setShowSectionIcons(val); saveThemeField({ section_icons: val }); }} className="scale-[0.7]" />
          </div>
        </div>
      )}
      {hideWrapper && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Icons</span>
          <Switch checked={showSectionIcons} onCheckedChange={(val) => { setShowSectionIcons(val); saveThemeField({ section_icons: val }); }} />
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSectionItem key={section.id} section={section} onEdit={setEditingSection} onToggle={toggleSection} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* AI Suggestions */}
      <BuilderAISuggestions sections={sections} />
      {/* AI Generate */}
      <div className="pt-3 border-t border-border/50">
        <Button variant="outline" className="w-full" onClick={onAIGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {isGenerating ? "Generating..." : "AI Write My Card"}
        </Button>
        {aiContent && (
          <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">AI Tagline</p>
            <p className="text-xs">{aiContent.tagline}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-2 mb-1">AI Bio</p>
            <p className="text-xs">{aiContent.bio}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="pt-2 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium flex items-center gap-1.5">
            <MousePointerClick className="h-3.5 w-3.5 text-primary" /> CTA Buttons
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Icons only</span>
            <Switch checked={ctaIconsOnly} onCheckedChange={(v) => { setCtaIconsOnly(v); saveThemeField({ cta_icons_only: v }); }} className="scale-75" />
          </div>
        </div>
        <CtaEditor ctas={ctaConfig} onChange={onCtaConfigChange} />
      </div>

      {/* Social */}
      <div className="space-y-2 mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" /> Social Links
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Icons only</span>
            <Switch checked={socialIconsOnly} onCheckedChange={(v) => { setSocialIconsOnly(v); saveThemeField({ social_icons_only: v }); }} className="scale-75" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Style</span>
          <div className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
            {(["auto", "filled", "outline"] as const).map((s) => (
              <button key={s} onClick={() => { setSocialBtnStyle(s); saveThemeField({ social_btn_style: s }); }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${socialBtnStyle === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Color</span>
          <div className="flex items-center gap-1.5">
            <input type="color" value={socialBtnColor || "#4361ee"}
              onChange={(e) => { setSocialBtnColor(e.target.value); saveThemeField({ social_btn_color: e.target.value }); }}
              className="h-6 w-6 rounded border border-border cursor-pointer bg-transparent p-0"
            />
            {socialBtnColor && (
              <button onClick={() => { setSocialBtnColor(""); saveThemeField({ social_btn_color: "" }); }}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Reset</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
