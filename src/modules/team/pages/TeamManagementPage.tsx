import { useState } from "react";
import {
  Users, UserPlus, User, Loader2, BarChart3, Clock, CalendarPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTeamMembers, useTeamPerformance,
  ROLE_LABELS, type TeamMember
} from "@/hooks/useTeam";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

import TeamTable from "../components/TeamTable";
import InviteMemberDialog from "../components/InviteMemberDialog";
import StaffProfileDialog from "../components/StaffProfileDialog";
import MemberDetailSheet from "../components/MemberDetailSheet";
import ChangeRoleDialog from "../components/ChangeRoleDialog";
import AvailabilityEditor from "../components/AvailabilityEditor";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const roleColorMap: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  technician: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  office_staff: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  member: "bg-muted text-muted-foreground",
};

export default function TeamManagementPage() {
  const isMobile = useIsMobile();
  const { currentOrg, isOrgAdmin, inviteMember, removeMember, updateMemberRole } = useOrg();
  const { user } = useAuth();
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const { data: performance = [] } = useTeamPerformance();

  const [showStaffProfile, setShowStaffProfile] = useState(false);
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [roleChangeMember, setRoleChangeMember] = useState<TeamMember | null>(null);
  const [showRoleChange, setShowRoleChange] = useState(false);

  // Mock assigned counts (would come from real data)
  const assignedCounts: Record<string, number> = {};
  performance.forEach((p: any) => {
    assignedCounts[p.user_id] = p.total_jobs || 0;
  });

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.profile?.name || "this member"} from the team?`)) return;
    await removeMember(member.id);
    toast.success("Member removed");
  };

  if (!currentOrg) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center max-w-2xl mx-auto">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-semibold text-lg">Create an Organization First</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Go to Settings → Team to create an organization before managing team members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Team
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentOrg.name} · {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isOrgAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowStaffProfile(true)}>
              <UserPlus className="h-4 w-4" /> Staff Profile
            </Button>
            <InviteMemberDialog onInvite={inviteMember} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Members
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Performance
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Availability
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TeamTable
              members={teamMembers}
              currentUserId={user?.id}
              isAdmin={isOrgAdmin}
              assignedCounts={assignedCounts}
              onEdit={(m) => {
                setDetailMember(m);
                setShowDetail(true);
              }}
              onChangeRole={(m) => {
                setRoleChangeMember(m);
                setShowRoleChange(true);
              }}
              onAssignWork={(m) => {
                toast.info(`Navigate to Jobs to assign work to ${m.profile?.name || "this member"}`);
              }}
              onDeactivate={(m) => {
                toast.info(`${m.profile?.name || "Member"} deactivated`);
              }}
              onRemove={handleRemove}
              onViewDetail={(m) => {
                setDetailMember(m);
                setShowDetail(true);
              }}
            />
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4">
          {performance.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No performance data yet. Assign jobs to see metrics here.
              </p>
            </div>
          ) : (
            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
              {performance.map((p: any, i: number) => (
                <motion.div
                  key={p.user_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {(p.name || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <Badge variant="secondary" className={`text-[10px] ${roleColorMap[p.role]}`}>
                        {ROLE_LABELS[p.role]}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold tabular-nums">{p.jobs_completed}</p>
                      <p className="text-[10px] text-muted-foreground">Done</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold tabular-nums">{p.jobs_scheduled}</p>
                      <p className="text-[10px] text-muted-foreground">Scheduled</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold tabular-nums">{p.jobs_in_progress}</p>
                      <p className="text-[10px] text-muted-foreground">Active</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <AvailabilityEditor />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs / Sheets */}
      <StaffProfileDialog open={showStaffProfile} onOpenChange={setShowStaffProfile} />
      <MemberDetailSheet
        member={detailMember}
        open={showDetail}
        onOpenChange={setShowDetail}
        stats={{ leads: 0, bookings: 0, estimates: 0 }}
      />
      <ChangeRoleDialog
        member={roleChangeMember}
        open={showRoleChange}
        onOpenChange={setShowRoleChange}
        onChangeRole={updateMemberRole}
      />
    </div>
  );
}
