import { InstalledApp } from "@/hooks/useMarketplaceApps";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ExternalLink, Check, Shield, Calendar, Info } from "lucide-react";
import { useToggleApp, useUninstallApp } from "@/hooks/useMarketplaceApps";
import { format } from "date-fns";

interface Props {
  installedApp: InstalledApp | null;
  onClose: () => void;
}

export default function InstalledAppSettingsDialog({ installedApp, onClose }: Props) {
  const toggle = useToggleApp();
  const uninstall = useUninstallApp();

  if (!installedApp) return null;

  const app = installedApp.marketplace_apps;
  if (!app) return null;

  const handleUninstall = () => {
    uninstall.mutate(installedApp.id);
    onClose();
  };

  return (
    <Dialog open={!!installedApp} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
              {app.icon_url ? (
                <img src={app.icon_url} alt={app.name} className="h-8 w-8 rounded-lg object-contain" />
              ) : "📦"}
            </div>
            <div>
              <span className="block">{app.name}</span>
              <span className="text-xs font-normal text-muted-foreground">by {app.developer_name}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${installedApp.enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              <span className="text-sm font-medium">{installedApp.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <Switch
              checked={installedApp.enabled}
              onCheckedChange={(enabled) => toggle.mutate({ id: installedApp.id, enabled })}
            />
          </div>

          {/* Install date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Installed {format(new Date(installedApp.installed_at), "MMM d, yyyy")}
          </div>

          <Separator />

          {/* How to use */}
          <div>
            <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> How to Use
            </h4>
            <div className="rounded-lg border border-border p-3 space-y-2 bg-card">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {app.category === "marketing" 
                  ? `Access ${app.name} templates from the Marketing → Post Designer section. Select a template and customize it with your brand colors and content.`
                  : app.category === "payments"
                  ? `${app.name} integrates with your invoicing and payment workflows. Access it from the Payments section.`
                  : app.category === "accounting"
                  ? `${app.name} connects to your financial tools. View reports and sync data from the Accounting section.`
                  : app.category === "automation"
                  ? `${app.name} adds new automation triggers and actions. Configure them in the Automation section.`
                  : app.category === "analytics"
                  ? `${app.name} enhances your analytics dashboard with additional metrics and insights.`
                  : app.category === "communication"
                  ? `${app.name} adds new communication channels. Access it from the Messages section.`
                  : `${app.name} is available throughout your workspace. Look for the integration icon in relevant sections.`
                }
              </p>
              {app.long_description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{app.long_description}</p>
              )}
            </div>
          </div>

          {/* Features */}
          {app.features.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Features Included</h4>
                <ul className="space-y-1.5">
                  {app.features.map((f) => (
                    <li key={f} className="text-xs flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Permissions */}
          {app.permissions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Permissions
                </h4>
                <ul className="space-y-1">
                  {app.permissions.map((p) => (
                    <li key={p} className="text-xs text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUninstall}
              disabled={uninstall.isPending}
            >
              Uninstall
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
