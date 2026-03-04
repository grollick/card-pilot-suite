import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { CardSection } from "@/hooks/useCard";

interface Props {
  section: CardSection;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
}

export default function SortableSectionItem({ section, onEdit, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors bg-card"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          className="flex items-center gap-2 text-sm font-medium text-left flex-1 min-w-0"
          onClick={() => onEdit(section.id)}
        >
          <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate">{section.label}</span>
          {section.content && Object.keys(section.content).length > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          )}
        </button>
      </div>
      <Switch checked={section.enabled} onCheckedChange={() => onToggle(section.id)} />
    </div>
  );
}
