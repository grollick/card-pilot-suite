import { useState } from "react";
import {
  Users, User, Crown, Shield, Briefcase, Wrench, UserCog,
  MoreHorizontal, Edit, RefreshCw, Trash2, UserMinus, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type TeamMember, ROLE_LABELS, type TeamRole } from "@/hooks/useTeam";
import { motion } from "framer-motion";

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown, admin: Shield, manager: Briefcase,
  technician: Wrench, office_staff: UserCog, member: User,
};

type MemberStatus = "active" | "invited" | "profile_only";

interface TeamTableProps {
  members: TeamMember[];
  currentUserId?: string;
  isAdmin: boolean;
  onEdit: (member: TeamMember) => void;
  onChangeRole: (member: TeamMember) => void;
  onAssignWork: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onViewDetail: (member: TeamMember) => void;
  assignedCounts: Record<string, number>;
}

function getStatus(member: TeamMember): MemberStatus {
  if (!member.profile?.name && !member.profile?.email) return "profile_only";
  return "active";
}

const statusConfig: Record<MemberStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  invited: { label: "Invited", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  profile_only: { label: "Profile Only", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
};

const roleColorMap: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  technician: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  office_staff: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  member: "bg-muted text-muted-foreground",
};

export default function TeamTable({
  members, currentUserId, isAdmin,
  onEdit, onChangeRole, onAssignWork, onDeactivate, onRemove, onViewDetail,
  assignedCounts,
}: TeamTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[280px]">Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Assigned</TableHead>
            <TableHead className="w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member, i) => {
            const RoleIcon = roleIcons[member.role] || User;
            const isMe = member.user_id === currentUserId;
            const status = getStatus(member);
            const sc = statusConfig[status];
            const count = assignedCounts[member.user_id] || 0;

            return (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onViewDetail(member)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {(member.profile?.name || member.profile?.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.profile?.name || member.profile?.email || "Unnamed"}
                        {isMe && <span className="text-xs text-primary ml-1.5">(you)</span>}
                      </p>
                      {member.profile?.email && (
                        <p className="text-xs text-muted-foreground truncate">{member.profile.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`gap-1 text-[11px] ${roleColorMap[member.role]}`}>
                    <RoleIcon className="h-3 w-3" /> {ROLE_LABELS[member.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[11px] ${sc.className}`}>
                    {sc.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-semibold tabular-nums">{count}</span>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  {isAdmin && !isMe && member.role !== "owner" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onEdit(member)}>
                          <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeRole(member)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAssignWork(member)}>
                          <Briefcase className="h-3.5 w-3.5 mr-2" /> Assign Work
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeactivate(member)}>
                          <UserMinus className="h-3.5 w-3.5 mr-2" /> Deactivate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRemove(member)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetail(member)}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </TableCell>
              </motion.tr>
            );
          })}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No team members yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
