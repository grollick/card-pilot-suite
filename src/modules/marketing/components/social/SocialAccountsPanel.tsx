import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialAccounts, useToggleAccount } from "@/hooks/useSocial";
import { PLATFORMS, getPlatformConfig } from "./constants";

export default function SocialAccountsPanel() {
  const { data: accounts = [] } = useSocialAccounts();
  const toggleAccount = useToggleAccount();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Connect and manage your social media accounts. Toggle accounts to enable/disable posting.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORMS.map(platform => {
          const acct = accounts.find(a => a.provider === platform.id);
          const connected = acct?.connected ?? false;
          const cfg = getPlatformConfig(platform.id);
          const isFuture = ["Google Business", "TikTok"].includes(platform.id);

          return (
            <Card key={platform.id} className={`dash-card ${isFuture ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg?.color}`}>{platform.id}</span>
                    {isFuture && <Badge variant="secondary" className="text-[9px] h-4">Coming Soon</Badge>}
                  </div>
                  <Switch
                    checked={connected}
                    onCheckedChange={(val) => toggleAccount.mutate({ provider: platform.id, connected: val })}
                    disabled={isFuture}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className={connected ? "text-emerald-600" : "text-muted-foreground"}>
                      {connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  {connected && acct?.account_name && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Account</span>
                      <span>@{acct.account_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Posting</span>
                    <span>{connected ? "Available" : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Char limit</span>
                    <span>{platform.charLimit.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        API integrations for actual publishing can be configured separately. Toggle accounts to control which platforms are available when composing posts.
      </p>
    </div>
  );
}
