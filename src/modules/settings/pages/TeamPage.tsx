import { useState } from "react";
import { Building2, Users, UserPlus, Crown, Shield, User, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const roleIcons = { owner: Crown, admin: Shield, member: User };
const roleLabels = { owner: "Owner", admin: "Admin", member: "Member" };

export default function TeamPage() {
  const { currentOrg, orgs, members, myRole, isOrgAdmin, createOrg, inviteMember, removeMember, updateMemberRole, switchOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateOrg = async () => {
    if (!newOrgName || !newOrgSlug) return;
    setLoading(true);
    try {
      await createOrg(newOrgName, newOrgSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
      toast({ title: "Organization created!" });
      setShowCreateOrg(false);
      setNewOrgName("");
      setNewOrgSlug("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    const { error } = await inviteMember(inviteEmail, inviteRole);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Member invited!" });
      setShowInvite(false);
      setInviteEmail("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary">guzzl</span> <span className="font-normal">Team & Organization</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your team and organization settings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Building2 className="h-4 w-4 mr-1" />New Organization</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Organization</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={newOrgName} onChange={e => { setNewOrgName(e.target.value); setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")); }} placeholder="My Agency" />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL-friendly)</Label>
                  <Input value={newOrgSlug} onChange={e => setNewOrgSlug(e.target.value)} placeholder="my-agency" />
                </div>
                <Button onClick={handleCreateOrg} disabled={loading} className="w-full shadow-glow">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Org Switcher */}
      {orgs.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Organization</Label>
          <Select value={currentOrg?.id || ""} onValueChange={switchOrg}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {orgs.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Current Org Info */}
      {currentOrg ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{currentOrg.name}</h2>
                  <p className="text-sm text-muted-foreground">/{currentOrg.slug} · {members.length} member{members.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {isOrgAdmin && (
                <Dialog open={showInvite} onOpenChange={setShowInvite}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="shadow-glow"><UserPlus className="h-4 w-4 mr-1" />Invite</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={v => setInviteRole(v as "admin" | "member")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleInvite} disabled={loading} className="w-full shadow-glow">Send Invite</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Members
              </h3>
              <div className="divide-y divide-border">
                {members.map(member => {
                  const RoleIcon = roleIcons[member.role];
                  const isMe = member.user_id === user?.id;
                  return (
                    <div key={member.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.user_id.slice(0, 8)}… {isMe && <span className="text-xs text-primary">(you)</span>}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <RoleIcon className="h-3 w-3" />
                            {roleLabels[member.role]}
                          </div>
                        </div>
                      </div>
                      {isOrgAdmin && !isMe && member.role !== "owner" && (
                        <div className="flex items-center gap-1">
                          <Select value={member.role} onValueChange={v => updateMemberRole(member.id, v as any)}>
                            <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMember(member.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold text-lg">No Organization Yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create an organization to collaborate with your team.</p>
          <Button onClick={() => setShowCreateOrg(true)} className="shadow-glow">
            <Building2 className="h-4 w-4 mr-1" /> Create Organization
          </Button>
        </div>
      )}
    </div>
  );
}
