import { useState, useMemo } from "react";
import { useMarketplaceApps, useFeaturedApps, useInstalledApps, useInstallApp, AppCategory, MarketplaceApp } from "@/hooks/useMarketplaceApps";
import AppCard from "../components/AppCard";
import AppDetailDialog from "../components/AppDetailDialog";
import PurchaseAppDialog from "../components/PurchaseAppDialog";
import InstalledAppsPanel from "../components/InstalledAppsPanel";
import RequestAppDialog from "../components/RequestAppDialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, Package, MessageSquarePlus } from "lucide-react";

const categories: { value: AppCategory | "all"; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "🏪" },
  { value: "payments", label: "Payments", icon: "💳" },
  { value: "accounting", label: "Accounting", icon: "📊" },
  { value: "marketing", label: "Marketing", icon: "📣" },
  { value: "automation", label: "Automation", icon: "⚡" },
  { value: "analytics", label: "Analytics", icon: "📈" },
  { value: "industry_tools", label: "Industry", icon: "🔧" },
  { value: "communication", label: "Comms", icon: "💬" },
  { value: "productivity", label: "Productivity", icon: "🚀" },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AppCategory | "all">("all");
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null);
  const [tab, setTab] = useState("browse");
  const [requestOpen, setRequestOpen] = useState(false);
  const [purchaseApp, setPurchaseApp] = useState<MarketplaceApp | null>(null);
  const { data: allApps, isLoading } = useMarketplaceApps(category === "all" ? undefined : category);
  const { data: featured } = useFeaturedApps();
  const { data: installed } = useInstalledApps();
  const installApp = useInstallApp();

  const installedIds = useMemo(() => new Set(installed?.map((i) => i.app_id) || []), [installed]);

  const handleInstall = (app: MarketplaceApp) => {
    if (app.pricing_type !== "free") {
      setPurchaseApp(app);
    } else {
      installApp.mutate(app.id);
    }
  };

  const filtered = useMemo(() => {
    if (!allApps) return [];
    if (!search.trim()) return allApps;
    const q = search.toLowerCase();
    return allApps.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.developer_name.toLowerCase().includes(q));
  }, [allApps, search]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apps & Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover and install apps to extend your guzzl.pro workspace.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="browse" className="gap-1.5">
              <Package className="h-3.5 w-3.5" /> Browse
            </TabsTrigger>
            <TabsTrigger value="installed" className="gap-1.5">
              Installed
              {installed?.length ? <Badge variant="secondary" className="ml-1 text-2xs h-4 px-1.5">{installed.length}</Badge> : null}
            </TabsTrigger>
          </TabsList>

          {tab === "browse" && (
            <div className="relative flex-1 max-w-xs ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search apps…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          )}
        </div>

        <TabsContent value="browse" className="mt-4 space-y-6">
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === c.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>

          {/* Featured section */}
          {category === "all" && !search && featured && featured.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500" /> Featured Apps
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {featured.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={installedIds.has(app.id)}
                    onInstall={() => installApp.mutate(app.id)}
                    onView={() => setSelectedApp(app)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All apps */}
          <div>
            {category !== "all" || search ? (
              <h2 className="text-sm font-semibold mb-3">{search ? `Results for "${search}"` : categories.find((c) => c.value === category)?.label}</h2>
            ) : (
              <h2 className="text-sm font-semibold mb-3">All Apps</h2>
            )}

            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-12">Loading apps…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-12">No apps found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={installedIds.has(app.id)}
                    onInstall={() => installApp.mutate(app.id)}
                    onView={() => setSelectedApp(app)}
                  />
                ))}
                {/* Request an App CTA */}
                <Card
                  className="group border-dashed border-2 border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer"
                  onClick={() => setRequestOpen(true)}
                >
                  <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full min-h-[180px] gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MessageSquarePlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">Request an App</h3>
                      <p className="text-2xs text-muted-foreground mt-0.5">Don't see what you need? Let us know!</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="mt-4">
          <InstalledAppsPanel />
        </TabsContent>
      </Tabs>

      <AppDetailDialog
        app={selectedApp}
        isInstalled={selectedApp ? installedIds.has(selectedApp.id) : false}
        onInstall={() => {
          if (selectedApp) handleInstall(selectedApp);
        }}
        onClose={() => setSelectedApp(null)}
      />

      <PurchaseAppDialog
        app={purchaseApp}
        onClose={() => setPurchaseApp(null)}
        onPurchaseComplete={() => setPurchaseApp(null)}
      />

      <RequestAppDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
