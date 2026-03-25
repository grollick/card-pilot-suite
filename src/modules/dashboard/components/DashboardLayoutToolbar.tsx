import { motion, AnimatePresence } from "framer-motion";
import { Settings2, RotateCcw, X, Eye, EyeOff, ArrowUp, ArrowDown, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { WidgetConfig, WidgetSize } from "../hooks/useDashboardLayout";

const SIZE_LABELS: Record<WidgetSize, string> = {
  full: "Full",
  half: "½",
  third: "⅓",
  "two-thirds": "⅔",
  "three-fifths": "⅗",
  "two-fifths": "⅖",
};

interface Props {
  widgets: WidgetConfig[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleVisibility: (id: string) => void;
  onCycleSize: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onReset: () => void;
}

export default function DashboardLayoutToolbar({
  widgets,
  isEditing,
  onToggleEdit,
  onToggleVisibility,
  onCycleSize,
  onMove,
  onReset,
}: Props) {
  return (
    <>
      {/* Edit mode toggle button */}
      <div className="flex items-center justify-end gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl h-8 text-xs font-medium border-border/60 hover:border-primary/40 transition-all"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Customize Layout
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0">
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/50">
              <SheetTitle className="text-base flex items-center justify-between">
                Dashboard Layout
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={onReset}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                Show, hide, resize, and reorder your dashboard widgets
              </p>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-3 space-y-1">
                {widgets.map((widget, idx) => (
                  <motion.div
                    key={widget.id}
                    layout
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {/* Visibility toggle */}
                    <Switch
                      checked={widget.visible}
                      onCheckedChange={() => onToggleVisibility(widget.id)}
                      disabled={widget.locked}
                      className="scale-75"
                    />

                    {/* Label */}
                    <span className={`flex-1 text-sm font-medium truncate ${!widget.visible ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>
                      {widget.label}
                    </span>

                    {/* Size badge */}
                    <button
                      onClick={() => onCycleSize(widget.id)}
                      className="shrink-0"
                      title="Click to cycle size"
                    >
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {SIZE_LABELS[widget.size]}
                      </Badge>
                    </button>

                    {/* Reorder buttons */}
                    <div className="flex flex-col -space-y-0.5 shrink-0">
                      <button
                        onClick={() => onMove(widget.id, "up")}
                        disabled={idx === 0}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onMove(widget.id, "down")}
                        disabled={idx === widgets.length - 1}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
