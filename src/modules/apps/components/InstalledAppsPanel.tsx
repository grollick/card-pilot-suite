import { useInstalledApps, useUninstallApp, useToggleApp, InstalledApp } from "@/hooks/useMarketplaceApps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Settings } from "lucide-react";

export default function InstalledAppsPanel() {
  const { data: apps, isLoading } = useInstalledApps();
  const uninstall = useUninstallApp();
  const toggle = useToggleApp();

  if (isLoading) return <div className="text-sm text-muted-foreground py-8 text-center">Loading installed apps…</div>;
  if (!apps?.length) return <div className="text-sm text-muted-foreground py-8 text-center">No apps installed yet.</div>;

  return (
    <div className="space-y-2">
      {apps.map((ia: InstalledApp) => {
        const app = ia.marketplace_apps;
        if (!app) return null;
        return (
          <Card key={ia.id} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{app.name}</p>
                <p className="text-2xs text-muted-foreground">{app.developer_name}</p>
              </div>
              <Switch
                checked={ia.enabled}
                onCheckedChange={(enabled) => toggle.mutate({ id: ia.id, enabled })}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => uninstall.mutate(ia.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
