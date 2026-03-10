import { useState } from "react";
import {
  Users, UserPlus, Crown, Shield, Wrench, Briefcase, User,
  Trash2, BarChart3, Bell, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTeamMembers, useTeamPerformance,
  ROLE_LABELS, ROLE_DESCRIPTIONS, type TeamRole
} from "@/hooks/useTeam";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown, admin: Shield, manager: Briefcase,
  technician: Wrench, office_staff: User, member: User,
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  technician: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  office_staff: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  member: "bg-muted text-muted-foreground",
};

const ASSIGNABLE_ROLES: TeamRole[] = ["admin", "manager", "technician", "office_staff", "member"];

export default function TeamManagementPage() {
  const isMobile = useIsMobile();
  const { currentOrg, isOrgAdmin, inviteMember, removeMember, updateMemberRole } = useOrg();
  const { user } = useAuth();
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const { data: performance = [] } = useTeamPerformance();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("technician");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    const mappedRole = inviteRole === "manager" || inviteRole === "technician" || inviteRole === "office_staff"
      ? inviteRole as any
      : inviteRole === "admin" ? "admin" : "member";
    const { error } = await inviteMember(inviteEmail, mappedRole);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Team member added!");
      setShowInvite(false);
      setInviteEmail("");
    }
    setLoading(false);
  };

  if (!currentOrg) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center max-w-2xl mx-auto">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-semibold text-lg">Create an Organization First</h2>
        <p className="text-sm text-muted-foreground mt-1">Go to Settings → Team to create an organization before managing team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Team Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentOrg.name} · {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isOrgAdmin && (
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" /> Add Team Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="team@example.com" />
                  <p className="text-xs text-muted-foreground">They must have a CardPilot account first</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={v => setInviteRole(v as TeamRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map(r => (
                        <SelectItem key={r} value={r}>
                          <div className="flex flex-col">
                            <span>{ROLE_LABELS[r]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[inviteRole]}</p>
                </div>
                <Button onClick={handleInvite} disabled={loading || !inviteEmail} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Member"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1"><Users className="h-3.5 w-3.5" /> Members</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Performance</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-3 mt-4">
          {/* Role Legend */}
          <div className={`flex flex-wrap gap-2 ${isMobile ? "" : ""}`}>
            {Object.entries(ROLE_LABELS).map(([key, label]) => {
              const Icon = roleIcons[key];
              return (
                <Badge key={key} variant="secondary" className={`gap-1 text-xs ${roleColors[key]}`}>
                  <Icon className="h-3 w-3" /> {label}
                </Badge>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => {
                const RoleIcon = roleIcons[member.role] || User;
                const isMe = member.user_id === user?.id;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {member.profile?.avatar_url ? (
                          <img src={member.profile.avatar_url} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.profile?.name || member.profile?.email || member.user_id.slice(0, 8)}
                          {isMe && <span className="text-xs text-primary ml-1">(you)</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] gap-0.5 ${roleColors[member.role]}`}>
                            <RoleIcon className="h-2.5 w-2.5" /> {ROLE_LABELS[member.role]}
                          </Badge>
                          {member.profile?.email && (
                            <span className="text-xs text-muted-foreground truncate">{member.profile.email}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOrgAdmin && !isMe && member.role !== "owner" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Select
                          value={member.role}
                          onValueChange={v => updateMemberRole(member.id, v as any)}
                        >
                          <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ASSIGNABLE_ROLES.map(r => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMember(member.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-3 mt-4">
          {performance.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No performance data yet. Assign jobs to team members to see metrics.</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {performance.map((p: any) => (
                <motion.div
                  key={p.user_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <Badge className={`text-[10px] ${roleColors[p.role]}`}>{ROLE_LABELS[p.role]}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold tabular-nums">{p.jobs_completed}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold tabular-nums">{p.jobs_scheduled}</p>
                      <p className="text-[10px] text-muted-foreground">Scheduled</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold tabular-nums">{p.jobs_in_progress}</p>
                      <p className="text-[10px] text-muted-foreground">In Progress</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
