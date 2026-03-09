import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLogActivity } from "@/hooks/useContactActions";
import { useCreateTask } from "@/hooks/useTasks";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const tabs = [
  { key: "note", label: "Note" },
  { key: "task", label: "Task" },
  { key: "reply", label: "Reply" },
  { key: "email", label: "Email" },
  { key: "booking", label: "Booking" },
] as const;

type TabKey = typeof tabs[number]["key"];

const taskTypes = [
  { key: "call", label: "Call" },
  { key: "email", label: "Email" },
  { key: "text", label: "Text" },
  { key: "follow_up", label: "Follow-up" },
  { key: "meeting", label: "Meeting" },
  { key: "reminder", label: "Reminder" },
  { key: "other", label: "Other" },
];

export default function ActivityComposer({ contactId, contactName }: { contactId: string; contactName: string }) {
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const logActivity = useLogActivity();
  const createTask = useCreateTask();

  // Note state
  const [noteText, setNoteText] = useState("");
  // Task state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("follow_up");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    await logActivity.mutateAsync({
      lead_id: contactId,
      activity_type: "note_added",
      title: "Note added",
      description: noteText,
    });
    toast.success("Note saved");
    setNoteText("");
    setActiveTab(null);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return;
    await createTask.mutateAsync({
      title: taskTitle,
      lead_id: contactId,
      type: taskType,
      due_date: taskDue || null,
      priority: taskPriority,
    });
    toast.success("Task created");
    setTaskTitle("");
    setTaskDue("");
    setActiveTab(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(activeTab === tab.key ? null : tab.key)}
            className={`flex-1 text-xs font-medium py-2.5 transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Composer panels */}
      {activeTab === "note" && (
        <div className="p-4 space-y-3">
          <Textarea
            placeholder={`Write a note about ${contactName}...`}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveNote} disabled={logActivity.isPending || !noteText.trim()}>Save Note</Button>
          </div>
        </div>
      )}

      {activeTab === "task" && (
        <div className="p-4 space-y-3">
          <Input placeholder="Task title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="text-sm" />
          <div className="grid grid-cols-3 gap-2">
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {taskTypes.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="h-8 text-xs" />
            <Select value={taskPriority} onValueChange={setTaskPriority}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveTask} disabled={createTask.isPending || !taskTitle.trim()}>Create Task</Button>
          </div>
        </div>
      )}

      {activeTab === "email" && (
        <div className="p-4 text-center text-sm text-muted-foreground py-8">
          Email composer coming soon. Use the <strong>Send Email</strong> quick action.
        </div>
      )}

      {activeTab === "booking" && (
        <div className="p-4 text-center text-sm text-muted-foreground py-8">
          Booking composer coming soon. Use the <strong>Book Appointment</strong> quick action.
        </div>
      )}
    </div>
  );
}
