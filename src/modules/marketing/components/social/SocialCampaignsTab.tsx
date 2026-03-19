import { useState } from "react";
import { Plus, Trash2, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSocialCampaigns, useCreateCampaign, useDeleteCampaign } from "@/hooks/useSocialCampaigns";
import { useSocialAccounts, useToggleAccount } from "@/hooks/useSocialAccounts";
import { PLATFORMS, getPlatformConfig } from "./constants";
import { toast } from "sonner";

export default function SocialCampaignsTab() {
  const { data: campaigns = [] } = useSocialCampaigns();
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const { data: accounts = [] } = useSocialAccounts();
  const toggleAccount = useToggleAccount();
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createCampaign.mutateAsync({ name: newName.trim() });
      setNewName("");
      toast.success("Campaign created");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Connected Accounts</h3>
            <p className="text-xs text-muted-foreground">Manage your social media connections</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORMS.filter(p => ["Instagram", "Facebook"].includes(p.id)).map(platform => {
            const acct = accounts.find(a => a.provider === platform.id);
            const connected = acct?.connected ?? false;
            const cfg = getPlatformConfig(platform.id);
            return (
              <Card key={platform.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${cfg?.color}`}>{platform.id}</div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                        <span className="text-xs">{connected ? "Connected" : "Not connected"}</span>
                      </div>
                    </div>
                    <Switch
                      checked={connected}
                      onCheckedChange={(val) => toggleAccount.mutate({ provider: platform.id, connected: val })}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Campaigns</h3>
            <p className="text-xs text-muted-foreground">Organize posts into campaigns for tracking</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New campaign name..."
            className="h-9"
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <Button size="sm" className="h-9 gap-1.5" onClick={handleCreate} disabled={createCampaign.isPending}>
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>

        <div className="space-y-2">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No campaigns yet. Create one to organize your posts.</p>
            </div>
          ) : campaigns.map(c => (
            <Card key={c.id} className="border">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color || "hsl(var(--primary))" }} />
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{c.status}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteCampaign.mutate(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Auto Posting Info */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Auto Posting
            </h3>
            <p className="text-xs text-muted-foreground">Automatically generate and publish content</p>
          </div>
        </div>
        <Card className="border border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-xs leading-relaxed">
              Enable Auto Posting to have AI generate trade-specific content, schedule it based on your preferences, and publish it automatically to your connected accounts. Configure this in the <strong>Auto Campaigns</strong> section.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
