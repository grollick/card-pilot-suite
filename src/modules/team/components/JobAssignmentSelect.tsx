import { useState } from "react";
import { UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTeamMembers, ROLE_LABELS, type TeamRole } from "@/hooks/useTeam";
import { useAssignJob } from "@/hooks/useTeam";

interface JobAssignmentSelectProps {
  jobId: string;
  currentAssignee?: string | null;
}

export default function JobAssignmentSelect({ jobId, currentAssignee }: JobAssignmentSelectProps) {
  const { data: members = [] } = useTeamMembers();
  const assignJob = useAssignJob();

  // Filter to technicians, managers, and admins
  const assignableMembers = members.filter(m =>
    ["owner", "admin", "manager", "technician"].includes(m.role)
  );

  if (assignableMembers.length === 0) return null;

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Assign To</Label>
      <Select
        value={currentAssignee || "unassigned"}
        onValueChange={(v) => assignJob.mutate({ jobId, userId: v === "unassigned" ? null : v })}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {assignableMembers.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id}>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>{m.profile?.name || m.profile?.email || "Team Member"}</span>
                <span className="text-xs text-muted-foreground">({ROLE_LABELS[m.role]})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
