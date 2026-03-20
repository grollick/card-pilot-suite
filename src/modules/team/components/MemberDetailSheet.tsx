import {
  User, Mail, Calendar, FileText, Briefcase, Clock, MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { type TeamMember, ROLE_LABELS } from "@/hooks/useTeam";

const roleColorMap: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  technician: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  office_staff: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  member: "bg-muted text-muted-foreground",
};

interface Props {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stats: { leads: number; bookings: number; estimates: number };
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function MemberDetailSheet({ member, open, onOpenChange, stats }: Props) {
  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Member Details</SheetTitle>
          <SheetDescription>View assigned work and profile info</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {(member.profile?.name || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {member.profile?.name || "Unnamed"}
              </h3>
              {member.profile?.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {member.profile.email}
                </p>
              )}
              <Badge variant="secondary" className={`mt-1 text-[11px] ${roleColorMap[member.role]}`}>
                {ROLE_LABELS[member.role]}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</h4>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm">Active</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>

          <Separator />

          {/* Assigned work stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assigned Work</h4>
            <div className="grid grid-cols-3 gap-2">
              <StatCard icon={User} label="Leads" value={stats.leads} />
              <StatCard icon={Calendar} label="Bookings" value={stats.bookings} />
              <StatCard icon={FileText} label="Estimates" value={stats.estimates} />
            </div>
          </div>

          <Separator />

          {/* Availability placeholder */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Availability</h4>
            <div className="rounded-lg border border-border p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Schedule can be configured in the Availability tab
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
