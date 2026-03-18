import {
  Star, Image, Briefcase, MessageSquare, CalendarCheck, FileText,
  Megaphone, Share2, Phone, MapPin, Sparkles, Crown, GripVertical,
  Pencil, Type, Layout,
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

// ── Section icon map ──
const SECTION_ICONS: Record<string, typeof Star> = {
  hero: Type,
  about: FileText,
  services: Briefcase,
  gallery: Image,
  projects: Layout,
  testimonials: Star,
  booking: CalendarCheck,
  contact: Phone,
  lead_form: FileText,
  promo: Megaphone,
  social: Share2,
  map: MapPin,
};

// ── Sortable section item ──
function SortableSection({ section, onEdit, onToggle }: {
  section: CardSection;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const Icon = SECTION_ICONS[section.id] || FileText;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const hasContent = section.content && Object.keys(section.content).length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
        section.enabled
          ? "border-border bg-card hover:border-primary/30 hover:shadow-sm"
          : "border-border/40 bg-muted/30 opacity-60 hover:opacity-80"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
        onClick={() => onEdit(section.id)}
      >
        <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
          section.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{section.label}</span>
            {hasContent && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
          </div>
        </div>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      <Switch
        checked={section.enabled}
        onCheckedChange={() => onToggle(section.id)}
        className="scale-75 shrink-0"
      />
    </div>
  );
}

// ── Main component ──
interface Props {
  sections: CardSection[];
  setSections: React.Dispatch<React.SetStateAction<CardSection[]>>;
  toggleSection: (id: string) => void;
  setEditingSection: (id: string | null) => void;
  saveSections: (s: CardSection[], immediate?: boolean) => void;
}

export default function BuilderSectionLibrary({
  sections, setSections, toggleSection, setEditingSection, saveSections,
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
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Card Sections
        </span>
        <span className="text-[10px] text-muted-foreground">
          {enabledCount} active
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onEdit={setEditingSection}
                onToggle={toggleSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
