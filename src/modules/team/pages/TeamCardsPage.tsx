import { useState } from "react";
import { Users, CreditCard, Plus, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTeamMembers, ROLE_LABELS, type TeamMember } from "@/hooks/useTeam";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function useTeamCards(orgId?: string) {
  return useQuery({
    queryKey: ["team-cards", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("id, user_id, status, is_team_card, team_member_id, updated_at")
        .eq("org_id", orgId!)
        .eq("is_team_card", true);
      if (error) throw error;
      return data || [];
    },
  });
}

function useCreateTeamCard() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (member: TeamMember) => {
      const { error } = await supabase.from("cards").insert({
        user_id: member.user_id,
        org_id: currentOrg!.id,
        is_team_card: true,
        team_member_id: member.user_id,
        status: "draft",
        sections_json: [],
        theme_json: {},
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-cards"] });
      toast.success("Team card created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export default function TeamCardsPage() {
  const { currentOrg } = useOrg();
  const { data: members = [], isLoading: membersLoading } = useTeamMembers();
  const { data: teamCards = [], isLoading: cardsLoading } = useTeamCards(currentOrg?.id);
  const createCard = useCreateTeamCard();
  const navigate = useNavigate();

  const isLoading = membersLoading || cardsLoading;
  const cardsByMember = new Map(teamCards.map((c: any) => [c.team_member_id, c]));

  if (!currentOrg) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center max-w-2xl mx-auto">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-semibold text-lg">Create an Organization First</h2>
        <p className="text-sm text-muted-foreground mt-1">Team cards require an organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> <span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal">Team Cards</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create individual digital cards for each team member
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Add team members first to create their cards.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/app/team-management")}>
              Manage Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => {
            const existingCard = cardsByMember.get(member.user_id);
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {(member.profile?.name || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{member.profile?.name || "Unnamed"}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </div>
                    </div>

                    {existingCard ? (
                      <div className="flex items-center justify-between">
                        <Badge variant={existingCard.status === "published" ? "default" : "secondary"} className="text-xs">
                          {existingCard.status === "published" ? "Live" : "Draft"}
                        </Badge>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/app/card")}>
                          <ExternalLink className="h-3 w-3" /> Edit Card
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        disabled={createCard.isPending}
                        onClick={() => createCard.mutate(member)}
                      >
                        <Plus className="h-3 w-3" /> Create Card
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
