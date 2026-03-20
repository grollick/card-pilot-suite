import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type TeamRole } from "@/hooks/useTeam";
import { toast } from "sonner";

const INVITE_ROLES: TeamRole[] = ["admin", "manager", "technician", "office_staff", "member"];

interface Props {
  onInvite: (email: string, role: "admin" | "member") => Promise<{ error: string | null }>;
}

export default function InviteMemberDialog({ onInvite }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("technician");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    const mappedRole = role === "admin" ? "admin" : "member";
    const { error } = await onInvite(email, mappedRole);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Invited ${email} as ${ROLE_LABELS[role]}`);
      setOpen(false);
      setEmail("");
      setMessage("");
      setRole("technician");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to your team by email
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@example.com"
            />
            <p className="text-xs text-muted-foreground">They must have a guzzl.pro account</p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={v => setRole(v as TeamRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVITE_ROLES.map(r => (
                  <SelectItem key={r} value={r}>
                    <span className="font-medium">{ROLE_LABELS[r]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>

          <div className="space-y-2">
            <Label>Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Hey! Join our team on guzzl.pro..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading || !email} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
