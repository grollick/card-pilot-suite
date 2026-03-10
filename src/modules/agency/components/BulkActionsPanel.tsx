import { useState } from "react";
import { useClientWorkspaces } from "@/hooks/useAgency";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Share2, Mail, Tag, Loader2, CheckCircle, Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function BulkActionsPanel() {
  const { data: workspaces = [] } = useClientWorkspaces();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === workspaces.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(workspaces.map((w) => w.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) {
      toast.error("Select at least one client workspace");
      return;
    }
    setRunning(true);
    // Placeholder for actual bulk action logic
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(`${action} queued for ${selected.size} workspace(s)`);
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Bulk Actions</h3>
          {selected.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selected.size} selected
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={selectAll}>
          {selected.size === workspaces.length ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {/* Client selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            onClick={() => toggle(ws.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              selected.has(ws.id)
                ? "border-primary/40 bg-primary/5"
                : "border-border/60 hover:border-border"
            }`}
          >
            <Checkbox checked={selected.has(ws.id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{ws.name}</p>
              <p className="text-2xs text-muted-foreground">{ws.lead_count} leads</p>
            </div>
            {selected.has(ws.id) && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={running || selected.size === 0}
          onClick={() => handleBulkAction("Social posts")}
        >
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
          Schedule Social Posts
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={running || selected.size === 0}
          onClick={() => handleBulkAction("Promotions")}
        >
          <Tag className="h-4 w-4 mr-2" />
          Create Promotions
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={running || selected.size === 0}
          onClick={() => handleBulkAction("Marketing emails")}
        >
          <Mail className="h-4 w-4 mr-2" />
          Send Marketing Emails
        </Button>
      </div>
    </div>
  );
}
