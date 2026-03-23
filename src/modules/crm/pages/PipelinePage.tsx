import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, GripVertical, Phone, Mail, Loader2, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useContacts, usePipelineStages } from "@/hooks/useContacts";
import { useUpdateContact, useLogActivity } from "@/hooks/useContactActions";
import { useCreateTask } from "@/hooks/useTasks";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function PipelinePage() {
  const navigate = useNavigate();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages();
  const updateContact = useUpdateContact();
  const logActivity = useLogActivity();
  const createTask = useCreateTask();

  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const isLoading = contactsLoading || stagesLoading;

  const getContactTags = (c: any) => (c.contact_tags ?? []).map((ct: any) => ct.tags).filter(Boolean);

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDraggedContactId(contactId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);
    if (!draggedContactId) return;

    const contact = contacts.find((c: any) => c.id === draggedContactId);
    if (!contact || contact.stage_id === toStageId) {
      setDraggedContactId(null);
      return;
    }

    const fromStage = stages.find((s: any) => s.id === contact.stage_id);
    const toStage = stages.find((s: any) => s.id === toStageId);

    await updateContact.mutateAsync({ id: draggedContactId, stage_id: toStageId });
    await logActivity.mutateAsync({
      lead_id: draggedContactId,
      activity_type: "stage_changed",
      title: `Stage: ${fromStage?.name ?? "None"} → ${toStage?.name ?? "Unknown"}`,
    });
    toast.success(`Moved to ${toStage?.name}`);
    setDraggedContactId(null);
  };

  const handleQuickTask = async (contactId: string, contactName: string) => {
    await createTask.mutateAsync({
      title: `Follow up with ${contactName}`,
      lead_id: contactId,
      type: "follow_up",
      priority: "medium",
    });
    toast.success("Task created");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Pipeline</span></h1>
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Pipeline</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Drag contacts between stages</p>
        </div>
        <Button className="shadow-glow" onClick={() => navigate("/app/contacts")}>
          <Plus className="h-4 w-4 mr-2" /> Add Contact
        </Button>
      </div>

      {stages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pipeline stages configured. Complete onboarding to set up your pipeline.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 overflow-x-auto pb-4 min-h-[65vh]"
        >
          {stages.map((stage: any) => {
            const stageContacts = contacts.filter((c: any) => c.stage_id === stage.id);
            const isDragOver = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`min-w-[260px] w-[260px] shrink-0 rounded-xl border p-3 flex flex-col transition-colors ${
                  isDragOver
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
                onDragOver={e => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, stage.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage.name}</h3>
                    <Badge variant="secondary" className="text-[10px] px-1.5">{stageContacts.length}</Badge>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {stageContacts.map((contact: any) => {
                    const cTags = getContactTags(contact);
                    const isOverdue = contact.next_activity_at && new Date(contact.next_activity_at) < new Date();

                    return (
                      <div
                        key={contact.id}
                        draggable
                        onDragStart={e => handleDragStart(e, contact.id)}
                        onClick={() => navigate(`/app/contacts/${contact.id}`)}
                        className={`p-3 rounded-lg border border-border bg-card hover:shadow-md transition-all cursor-pointer group ${
                          draggedContactId === contact.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary shrink-0">
                              {contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                            <p className="text-sm font-medium truncate">{contact.name}</p>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors shrink-0 mt-0.5" />
                        </div>

                        {/* Meta row */}
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                          {contact.last_activity_at && (
                            <span>{formatDistanceToNow(new Date(contact.last_activity_at), { addSuffix: true })}</span>
                          )}
                          {contact.next_activity_at && (
                            <span className={isOverdue ? "text-destructive font-medium" : ""}>
                              · Due {formatDistanceToNow(new Date(contact.next_activity_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>

                        {/* Tags + Quick actions */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {cTags.slice(0, 2).map((tag: any) => (
                            <span key={tag.id} className="text-[10px] px-1.5 py-0 rounded-full border" style={{ borderColor: tag.color, color: tag.color }}>
                              {tag.name}
                            </span>
                          ))}
                          <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => e.stopPropagation()}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36" onClick={e => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleQuickTask(contact.id, contact.name)}>
                                  <FileText className="h-3.5 w-3.5 mr-2" /> Add task
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/app/contacts/${contact.id}`)}>
                                  <Mail className="h-3.5 w-3.5 mr-2" /> Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/app/bookings?new=1`)}>
                                  <Calendar className="h-3.5 w-3.5 mr-2" /> Book
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/app/estimates?lead=${contact.id}`)}>
                                  <FileText className="h-3.5 w-3.5 mr-2" /> Estimate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageContacts.length === 0 && (
                    <div className={`flex items-center justify-center h-20 text-xs border border-dashed rounded-lg transition-colors ${
                      isDragOver ? "border-primary/50 text-primary" : "border-border text-muted-foreground"
                    }`}>
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned column */}
          {contacts.some((c: any) => !c.stage_id) && (
            <div className="min-w-[260px] w-[260px] shrink-0 rounded-xl border border-border bg-muted/20 p-3 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No Stage</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {contacts.filter((c: any) => !c.stage_id).length}
                </Badge>
              </div>
              <div className="space-y-2 flex-1">
                {contacts.filter((c: any) => !c.stage_id).map((contact: any) => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={e => handleDragStart(e, contact.id)}
                    onClick={() => navigate(`/app/contacts/${contact.id}`)}
                    className="p-3 rounded-lg border border-border bg-card hover:shadow-md transition-all cursor-pointer"
                  >
                    <p className="text-sm font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{contact.email ?? contact.phone ?? "No details"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
