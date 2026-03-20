import {
  Star, Image, Briefcase, MessageSquare, CalendarCheck, FileText,
  Megaphone, Share2, Phone, MapPin, Type, Layout,
  GripVertical, Pencil, Copy, Trash2, Eye, EyeOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import Tip from "@/components/Tip";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardSection } from "@/hooks/useCard";
import { motion, AnimatePresence } from "framer-motion";

const SECTION_ICONS: Record<string, typeof Star> = {
  hero: Type, about: FileText, services: Briefcase, gallery: Image,
  projects: Layout, testimonials: Star, booking: CalendarCheck,
  contact: Phone, lead_form: FileText, promo: Megaphone,
  social: Share2, map: MapPin,
};

function SortableSection({ section, onEdit, onToggle, onDuplicate, onDelete }: {
  section: CardSection;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const Icon = SECTION_ICONS[section.id] || FileText;
  const hasContent = section.content && Object.keys(section.content).length > 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all duration-200 ${
          section.enabled
            ? "hover:bg-accent/50"
            : "opacity-35 hover:opacity-55"
        }`}
      >
        <Tip label="Drag to reorder" side="left">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 touch-none shrink-0 transition-colors"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </Tip>

        <Tip label={`Edit ${section.label}`} side="top">
          <button
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
            onClick={() => onEdit(section.id)}
          >
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
              section.enabled ? "bg-primary/8 text-primary" : "bg-muted/60 text-muted-foreground/60"
            }`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`text-[12px] font-medium block truncate ${section.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                {section.label}
              </span>
            </div>
          </button>
        </Tip>

        {/* Hover controls */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Tip label="Edit section" side="top">
            <button
              onClick={() => onEdit(section.id)}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </Tip>
          {onDuplicate && (
            <Tip label="Duplicate section" side="top">
              <button
                onClick={() => onDuplicate(section.id)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors"
              >
                <Copy className="h-3 w-3" />
              </button>
            </Tip>
          )}
          {onDelete && !["hero", "contact", "social"].includes(section.id) && (
            <Tip label="Remove section" side="top">
              <button
                onClick={() => onDelete(section.id)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Tip>
          )}
        </div>

        <Tip label={section.enabled ? "Hide section" : "Show section"}>
          <Switch
            checked={section.enabled}
            onCheckedChange={() => onToggle(section.id)}
            className="scale-[0.65] shrink-0"
          />
        </Tip>
      </div>
    </TooltipProvider>
  );
}

interface Props {
  sections: CardSection[];
  setSections: React.Dispatch<React.SetStateAction<CardSection[]>>;
  toggleSection: (id: string) => void;
  setEditingSection: (id: string | null) => void;
  saveSections: (s: CardSection[], immediate?: boolean) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function BuilderSectionLibrary({
  sections, setSections, toggleSection, setEditingSection, saveSections,
  onDuplicate, onDelete,
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

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Sections
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/40 tabular-nums">
          {enabledCount} active
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {sections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SortableSection
                    section={section}
                    onEdit={setEditingSection}
                    onToggle={toggleSection}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
