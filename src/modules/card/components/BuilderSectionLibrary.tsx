import {
  Star, Image, Briefcase, MessageSquare, CalendarCheck, FileText,
  Megaphone, Share2, Phone, MapPin, Type, Layout,
  GripVertical, Pencil, Copy, Trash2, Eye, EyeOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
        section.enabled
          ? "hover:bg-muted/50"
          : "opacity-40 hover:opacity-60"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <button
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
        onClick={() => onEdit(section.id)}
      >
        <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
          section.enabled ? "bg-primary/8 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          <Icon className="h-3 w-3" />
        </div>
        <span className={`text-[11px] font-medium truncate ${section.enabled ? "text-foreground" : "text-muted-foreground"}`}>
          {section.label}
        </span>
        {hasContent && <span className="h-1 w-1 rounded-full bg-primary shrink-0" />}
      </button>

      {/* Hover controls */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(section.id)}
          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Edit"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(section.id)}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Duplicate"
          >
            <Copy className="h-2.5 w-2.5" />
          </button>
        )}
        {onDelete && !["hero", "contact", "social"].includes(section.id) && (
          <button
            onClick={() => onDelete(section.id)}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remove"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      <Switch
        checked={section.enabled}
        onCheckedChange={() => onToggle(section.id)}
        className="scale-[0.6] shrink-0"
      />
    </div>
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
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sections
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {enabledCount} active
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onEdit={setEditingSection}
                onToggle={toggleSection}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
