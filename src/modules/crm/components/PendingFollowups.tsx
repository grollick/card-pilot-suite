import { format, formatDistanceToNow } from "date-fns";
import { Mail, X, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  followups: any[];
  contactName: string;
}

export default function PendingFollowups({ followups, contactName }: Props) {
  const qc = useQueryClient();

  const cancelFollowup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_followups")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-followups"] });
      toast.success("Follow-up cancelled");
    },
    onError: () => toast.error("Failed to cancel"),
  });

  const cancelAll = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("scheduled_followups")
        .update({ status: "cancelled" })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-followups"] });
      toast.success("All follow-ups cancelled");
    },
    onError: () => toast.error("Failed to cancel"),
  });

  if (followups.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Pending Follow-ups</h3>
          <Badge variant="secondary" className="text-[10px] h-4">{followups.length}</Badge>
        </div>
        {followups.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-destructive hover:text-destructive"
            disabled={cancelAll.isPending}
            onClick={() => {
              if (!confirm(`Cancel all ${followups.length} pending follow-ups for ${contactName}?`)) return;
              cancelAll.mutate(followups.map((f: any) => f.id));
            }}
          >
            Cancel all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {followups.map((f: any) => (
          <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/20 group">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {f.followup_variants?.subject || `Step ${f.step_number ?? 1}`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Sends {formatDistanceToNow(new Date(f.send_at), { addSuffix: true })}
                {" · "}
                {format(new Date(f.send_at), "MMM d, h:mm a")}
              </p>
              {f.followup_variants?.variant_key && (
                <Badge variant="outline" className="text-[9px] h-3.5 mt-1">
                  Variant {f.followup_variants.variant_key}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={cancelFollowup.isPending}
              onClick={() => cancelFollowup.mutate(f.id)}
            >
              {cancelFollowup.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
