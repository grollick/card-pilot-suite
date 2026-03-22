import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserX, Clock, AlertCircle, Loader2, Mail } from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { toast } from "sonner";

export default function AdminReengagement() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reengagement"],
    staleTime: 60_000,
    queryFn: async () => {
      // Get all profiles
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("id, name, email, created_at, onboarding_completed, updated_at")
        .order("created_at", { ascending: false });

      const all = profiles || [];
      const now = new Date();

      // Never onboarded
      const neverOnboarded = all.filter((p: any) =>
        !p.onboarding_completed && differenceInDays(now, new Date(p.created_at)) >= 2
      );

      // Inactive 7+ days (onboarded but no recent activity)
      const inactive7d = all.filter((p: any) =>
        p.onboarding_completed &&
        differenceInDays(now, new Date(p.updated_at)) >= 7 &&
        differenceInDays(now, new Date(p.updated_at)) < 30
      );

      // Inactive 30+ days (churning)
      const churning = all.filter((p: any) =>
        p.onboarding_completed &&
        differenceInDays(now, new Date(p.updated_at)) >= 30
      );

      // Get cards to check who never published
      const { data: cards } = await (supabase as any)
        .from("cards")
        .select("user_id, status");

      const publishedUsers = new Set((cards || []).filter((c: any) => c.status === "published").map((c: any) => c.user_id));
      const neverPublished = all.filter((p: any) => p.onboarding_completed && !publishedUsers.has(p.id));

      return {
        neverOnboarded: neverOnboarded.slice(0, 20),
        neverOnboardedCount: neverOnboarded.length,
        inactive7d: inactive7d.slice(0, 20),
        inactive7dCount: inactive7d.length,
        churning: churning.slice(0, 20),
        churningCount: churning.length,
        neverPublished: neverPublished.slice(0, 20),
        neverPublishedCount: neverPublished.length,
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const segments = [
    {
      key: "never-onboarded",
      title: "Never Completed Onboarding",
      description: "Signed up 2+ days ago but never finished onboarding",
      icon: AlertCircle,
      color: "text-destructive",
      count: data?.neverOnboardedCount || 0,
      users: data?.neverOnboarded || [],
    },
    {
      key: "never-published",
      title: "No Published Card",
      description: "Completed onboarding but never published their card",
      icon: UserX,
      color: "text-amber-600",
      count: data?.neverPublishedCount || 0,
      users: data?.neverPublished || [],
    },
    {
      key: "inactive-7d",
      title: "Inactive 7–30 Days",
      description: "Haven't been active for at least a week",
      icon: Clock,
      color: "text-orange-500",
      count: data?.inactive7dCount || 0,
      users: data?.inactive7d || [],
    },
    {
      key: "churning",
      title: "Churning (30+ days inactive)",
      description: "High risk of permanent churn",
      icon: UserX,
      color: "text-destructive",
      count: data?.churningCount || 0,
      users: data?.churning || [],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {segments.map((seg) => (
          <Card key={seg.key}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <seg.icon className={`h-4 w-4 ${seg.color}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground">{seg.title}</p>
                  <p className="text-xl font-bold">{seg.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment details */}
      {segments.map((seg) => (
        <Card key={seg.key}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <seg.icon className={`h-3.5 w-3.5 ${seg.color}`} />
                  {seg.title} ({seg.count})
                </CardTitle>
                <CardDescription className="text-xs">{seg.description}</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                onClick={() => toast.info("Email campaign feature coming soon — use the Campaigns tab to target this segment")}
              >
                <Mail className="h-3 w-3" /> Send Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {seg.users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users in this segment 🎉</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Signed Up</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seg.users.map((u: any) => (
                      <tr key={u.id} className="border-b border-border/50">
                        <td className="py-1.5 font-medium">{u.name || "—"}</td>
                        <td className="py-1.5 text-muted-foreground">{u.email || "—"}</td>
                        <td className="py-1.5 text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</td>
                        <td className="py-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {differenceInDays(new Date(), new Date(u.updated_at))}d ago
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
