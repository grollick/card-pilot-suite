import { useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Download,
  Globe,
  GripVertical,
  Plus,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CTA_ICON_MAP: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  text: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  book: <Calendar className="h-4 w-4" />,
  quote: <FileText className="h-4 w-4" />,
  vcard: <Download className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
};

const DEFAULT_LABELS: Record<string, string> = {
  call: "Call",
  text: "Text",
  email: "Email",
  book: "Book Now",
  quote: "Get Quote",
  vcard: "Save Contact",
  website: "Website",
};

export interface CtaItem {
  id: string;
  label: string;
  enabled: boolean;
  isPrimary: boolean;
}

export const DEFAULT_CTA_CONFIG: CtaItem[] = [
  { id: "call", label: "Call", enabled: true, isPrimary: true },
  { id: "text", label: "Text", enabled: true, isPrimary: false },
  { id: "email", label: "Email", enabled: true, isPrimary: false },
  { id: "vcard", label: "Save Contact", enabled: true, isPrimary: false },
];

export const ALL_CTA_OPTIONS = ["call", "text", "email", "book", "quote", "vcard", "website"];

interface CtaEditorProps {
  ctas: CtaItem[];
  onChange: (ctas: CtaItem[]) => void;
}

function SortableCtaRow({
  cta,
  onToggle,
  onSetPrimary,
  onLabelChange,
}: {
  cta: CtaItem;
  onToggle: () => void;
  onSetPrimary: () => void;
  onLabelChange: (label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(cta.label);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cta.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveLabel = () => {
    onLabelChange(editLabel.trim() || DEFAULT_LABELS[cta.id] || cta.id);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${
        cta.isPrimary ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      } ${!cta.enabled ? "opacity-50" : ""}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="text-muted-foreground">{CTA_ICON_MAP[cta.id]}</span>

      {editing ? (
        <div className="flex-1 flex gap-1">
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="h-6 text-xs px-1.5"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
          />
          <button onClick={handleSaveLabel} className="text-primary hover:text-primary/80">
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          className="flex-1 text-left text-xs font-medium flex items-center gap-1 group"
          onClick={() => { setEditLabel(cta.label); setEditing(true); }}
        >
          {cta.label}
          <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {cta.isPrimary ? (
        <span className="text-[9px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
          Primary
        </span>
      ) : (
        <button
          onClick={onSetPrimary}
          className="text-[9px] text-muted-foreground hover:text-primary transition-colors shrink-0"
          title="Make primary"
        >
          Set primary
        </button>
      )}

      <Switch checked={cta.enabled} onCheckedChange={onToggle} className="scale-75" />
    </div>
  );
}

export default function CtaEditor({ ctas, onChange }: CtaEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ctas.findIndex((c) => c.id === active.id);
    const newIndex = ctas.findIndex((c) => c.id === over.id);
    onChange(arrayMove(ctas, oldIndex, newIndex));
  };

  const toggle = (id: string) => {
    onChange(ctas.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const setPrimary = (id: string) => {
    onChange(ctas.map((c) => ({ ...c, isPrimary: c.id === id, enabled: c.id === id ? true : c.enabled })));
  };

  const updateLabel = (id: string, label: string) => {
    onChange(ctas.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  const unusedCtas = ALL_CTA_OPTIONS.filter((id) => !ctas.some((c) => c.id === id));

  const addCta = (id: string) => {
    onChange([...ctas, { id, label: DEFAULT_LABELS[id] || id, enabled: true, isPrimary: false }]);
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ctas.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {ctas.map((cta) => (
              <SortableCtaRow
                key={cta.id}
                cta={cta}
                onToggle={() => toggle(cta.id)}
                onSetPrimary={() => setPrimary(cta.id)}
                onLabelChange={(label) => updateLabel(cta.id, label)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {unusedCtas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {unusedCtas.map((id) => (
            <Button key={id} variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => addCta(id)}>
              <Plus className="h-3 w-3" />
              {DEFAULT_LABELS[id]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
