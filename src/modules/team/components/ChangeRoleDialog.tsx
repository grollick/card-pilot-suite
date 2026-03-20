import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { type TeamMember, ROLE_LABELS, ROLE_DESCRIPTIONS, type TeamRole } from "@/hooks/useTeam";
import { toast } from "sonner";

const ASSIGNABLE_ROLES: TeamRole[] = ["admin", "manager", "technician", "office_staff", "member"];

interface Props {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChangeRole: (memberId: string, role: "owner" | "admin" | "member") => Promise<void>;
}

export default function ChangeRoleDialog({ member, open, onOpenChange, onChangeRole }: Props) {
  const [role, setRole] = useState<TeamRole>(member?.role || "member");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!member) return;
    setLoading(true);
    const mapped = role === "admin" ? "admin" : role === "owner" ? "owner" : "member";
    await onChangeRole(member.id, mapped);
    toast.success(`Role updated to ${ROLE_LABELS[role]}`);
    onOpenChange(false);
    setLoading(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update role for {member.profile?.name || member.profile?.email || "this member"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Select value={role} onValueChange={v => setRole(v as TeamRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map(r => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Role"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
