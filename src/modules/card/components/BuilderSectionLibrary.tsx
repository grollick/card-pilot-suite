import {
  Star, Image, Briefcase, MessageSquare, CalendarCheck, FileText,
  Megaphone, Share2, Phone, MapPin, Type, Layout,
  GripVertical, Pencil, Copy, Trash2, Eye, EyeOff, MoreHorizontal,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const hasContent = section.content && Object.keys(section.content).length > 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // Match what the customer sees on the card.
  const rowLabel = section.id === "quote_calculator" ? "Instant Quote" : section.label;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-1.5 py-2 px-2 min-w-0 w-full rounded-xl transition-all duration-200 ${
          section.enabled
            ? "hover:bg-accent/30 hover:shadow-sm"
            : "bg-muted/30"
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

        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => onEdit(section.id)}
          title={`Edit ${rowLabel}`}
        >
          <span className={`text-[13px] font-medium block truncate whitespace-nowrap ${section.enabled ? "text-foreground" : "text-muted-foreground"}`}>
            {rowLabel}
          </span>
        </button>

        <button
          onClick={() => onEdit(section.id)}
          className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={`Edit ${rowLabel}`}
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {(onDuplicate || (onDelete && !["hero", "contact", "social"].includes(section.id))) && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="h-7 w-6 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label={`More options for ${rowLabel}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(section.id)}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && !["hero", "contact", "social"].includes(section.id) && (
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(section.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Switch
          checked={section.enabled}
          onCheckedChange={() => onToggle(section.id)}
          className="scale-[0.8] shrink-0"
          aria-label={section.enabled ? `Hide ${rowLabel}` : `Show ${rowLabel}`}
        />
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
