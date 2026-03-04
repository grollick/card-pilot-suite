import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  created_by: string;
}

interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profile?: { name: string | null; email: string | null; avatar_url: string | null };
}

interface OrgContextType {
  currentOrg: Organization | null;
  orgs: Organization[];
  members: OrgMember[];
  myRole: "owner" | "admin" | "member" | null;
  isOrgAdmin: boolean;
  loading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  createOrg: (name: string, slug: string) => Promise<Organization | null>;
  inviteMember: (email: string, role: "admin" | "member") => Promise<{ error: string | null }>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: "owner" | "admin" | "member") => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all orgs the user belongs to
  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["orgs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*");
      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!user,
  });

  // Fetch current org from profile
  const { data: profile } = useQuery({
    queryKey: ["profile-org", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("current_org_id")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const currentOrg = orgs.find((o) => o.id === profile?.current_org_id) || orgs[0] || null;

  // Fetch members of current org
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["org-members", currentOrg?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("org_id", currentOrg!.id);
      if (error) throw error;
      return data as OrgMember[];
    },
    enabled: !!currentOrg,
  });

  const myMembership = members.find((m) => m.user_id === user?.id);
  const myRole = myMembership?.role || null;
  const isOrgAdmin = myRole === "owner" || myRole === "admin";

  const switchOrg = useCallback(async (orgId: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ current_org_id: orgId }).eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile-org"] });
  }, [user, queryClient]);

  const createOrg = useCallback(async (name: string, slug: string): Promise<Organization | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name, slug, created_by: user.id })
      .select()
      .single();
    if (error) throw error;

    // Add self as owner
    await supabase.from("organization_members").insert({
      org_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    // Set as current
    await supabase.from("profiles").update({ current_org_id: data.id }).eq("id", user.id);

    queryClient.invalidateQueries({ queryKey: ["orgs"] });
    queryClient.invalidateQueries({ queryKey: ["profile-org"] });
    return data as Organization;
  }, [user, queryClient]);

  const inviteMember = useCallback(async (email: string, role: "admin" | "member") => {
    if (!currentOrg) return { error: "No organization selected" };
    // Look up user by email in profiles
    const { data: targetProfile, error: lookupErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();
    if (lookupErr || !targetProfile) return { error: "User not found. They need a CardPilot account first." };

    const { error } = await supabase.from("organization_members").insert({
      org_id: currentOrg.id,
      user_id: targetProfile.id,
      role,
      invited_by: user?.id,
    });
    if (error) return { error: error.message };
    queryClient.invalidateQueries({ queryKey: ["org-members"] });
    return { error: null };
  }, [currentOrg, user, queryClient]);

  const removeMember = useCallback(async (memberId: string) => {
    await supabase.from("organization_members").delete().eq("id", memberId);
    queryClient.invalidateQueries({ queryKey: ["org-members"] });
  }, [queryClient]);

  const updateMemberRole = useCallback(async (memberId: string, role: "owner" | "admin" | "member") => {
    await supabase.from("organization_members").update({ role }).eq("id", memberId);
    queryClient.invalidateQueries({ queryKey: ["org-members"] });
  }, [queryClient]);

  return (
    <OrgContext.Provider value={{
      currentOrg,
      orgs,
      members,
      myRole,
      isOrgAdmin,
      loading: orgsLoading || membersLoading,
      switchOrg,
      createOrg,
      inviteMember,
      removeMember,
      updateMemberRole,
    }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within OrgProvider");
  return context;
}
