import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Check, Trash2, ListTodo, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDailyNotes, useCreateNote, useToggleNote, useDeleteNote } from "@/hooks/useDailyNotes";
import { format, isToday, isYesterday } from "date-fns";

export default function DailyNotesWidget() {
  const { data: notes = [], isLoading } = useDailyNotes();
  const createNote = useCreateNote();
  const toggleNote = useToggleNote();
  const deleteNote = useDeleteNote();
  const [input, setInput] = useState("");
  const [type, setType] = useState<"task" | "note">("task");
  const [filter, setFilter] = useState<"all" | "tasks" | "notes">("all");

  const handleAdd = () => {
    if (!input.trim()) return;
    createNote.mutate({ content: input.trim(), note_type: type });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const filtered = notes.filter((n) => {
    if (filter === "tasks") return n.note_type === "task";
    if (filter === "notes") return n.note_type === "note";
    return true;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const tasks = notes.filter((n) => n.note_type === "task");
  const completedTasks = tasks.filter((n) => n.is_completed).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <StickyNote className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Notes & Tasks</h3>
            {tasks.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {completedTasks}/{tasks.length} tasks done
              </p>
            )}
          </div>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[11px] px-2 h-5">All</TabsTrigger>
            <TabsTrigger value="tasks" className="text-[11px] px-2 h-5">Tasks</TabsTrigger>
            <TabsTrigger value="notes" className="text-[11px] px-2 h-5">Notes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Input area */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex gap-1.5">
          <Button
            variant={type === "task" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setType("task")}
            title="Add task"
          >
            <ListTodo className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={type === "note" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setType("note")}
            title="Add note"
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Input
            placeholder={type === "task" ? "Add a task..." : "Write a note..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 text-sm"
          />
        </div>
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAdd} disabled={!input.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Notes list */}
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-xs text-muted-foreground">No notes yet. Add your first one above.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors group"
              >
                {note.note_type === "task" ? (
                  <Checkbox
                    checked={note.is_completed}
                    onCheckedChange={(v) => toggleNote.mutate({ id: note.id, is_completed: !!v })}
                    className="mt-0.5"
                  />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${note.is_completed ? "line-through text-muted-foreground" : ""}`}>
                    {note.content}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {formatDate(note.note_date)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => deleteNote.mutate(note.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
