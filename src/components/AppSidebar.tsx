import {
  LayoutDashboard, Users, Briefcase, UserCheck, Megaphone, Settings,
  ChevronLeft, LogOut, Globe, ChevronRight, HelpCircle,
  Inbox, FileText, Calendar, Kanban,
  ClipboardList, RefreshCw, DollarSign,
  UserCircle, Star,
  Mail, Share2, Gift, BarChart3, QrCode, Tag, Zap,
  Bot, Eye, CreditCard, Package, Building2, CheckSquare,
  Shield, Sparkles, ExternalLink, Bell, MapPin,
} from "lucide-react";
import ClientSwitcher from "@/modules/agency/components/ClientSwitcher";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdminStats";
import { useProfileCache } from "@/hooks/useProfileCache";
import { useJobRequestStats } from "@/hooks/useJobRequests";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import Tip from "@/components/Tip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

/* ── Navigation structure ── */

const crmItems = [
  { title: "Contacts", url: "/app/contacts", icon: Inbox },
  { title: "Pipeline", url: "/app/pipeline", icon: Kanban },
  { title: "Job Requests", url: "/app/job-requests", icon: Bell, glowKey: "job-requests" },
  { title: "Bookings", url: "/app/bookings", icon: Calendar },
  { title: "Tasks", url: "/app/tasks", icon: CheckSquare },
  { title: "Reviews", url: "/app/reviews", icon: Star },
  { title: "Loyalty", url: "/app/loyalty", icon: Gift },
];

const jobsItems = [
  { title: "Active Jobs", url: "/app/jobs", icon: Briefcase },
  { title: "Job Pipeline", url: "/app/job-pipeline", icon: ClipboardList },
  { title: "Projects", url: "/app/projects", icon: Briefcase },
  { title: "Recurring", url: "/app/recurring", icon: RefreshCw },
  { title: "Estimates", url: "/app/estimates", icon: FileText },
];

const moneyItems = [
  { title: "Invoices", url: "/app/invoices", icon: DollarSign },
  { title: "Revenue", url: "/app/revenue", icon: DollarSign },
  { title: "Expenses", url: "/app/expenses", icon: DollarSign },
];

const marketingItems = [
  { title: "Growth Hub", url: "/app/growth", icon: BarChart3 },
  { title: "Social Media", url: "/app/social", icon: Share2 },
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Campaigns", url: "/app/auto-campaigns", icon: Zap },
  { title: "Promotions", url: "/app/promotions", icon: Tag },
  { title: "Referrals", url: "/app/referrals", icon: Gift },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
];

const brandItems = [
  { title: "Card Editor", url: "/app/card", icon: CreditCard },
  { title: "Page Builder", url: "/app/page-builder", icon: Globe },
  { title: "QR Campaigns", url: "/app/qr-campaigns", icon: QrCode },
  { title: "Card Viewers", url: "/app/viewers", icon: Eye },
  { title: "Boost", url: "/app/boost", icon: Zap },
];

const teamItems = [
  { title: "Members", url: "/app/team-management", icon: Users },
  { title: "Team Cards", url: "/app/team-cards", icon: CreditCard },
  { title: "Lead Routing", url: "/app/lead-routing", icon: Inbox },
  { title: "Agency", url: "/app/agency", icon: Building2 },
];

const discoverItems = [
  { title: "Marketplace", url: "/discover/map", icon: MapPin },
  { title: "App Store", url: "/app/marketplace", icon: Package },
];

const adminOnlyItems = [
  { title: "Admin", url: "/app/admin", icon: Shield },
  { title: "Platform", url: "/app/platform-admin", icon: Shield },
  { title: "Admin Marketing", url: "/app/admin-marketing", icon: Megaphone },
];

type NavItem = { title: string; url: string; icon: any; end?: boolean; glowKey?: string };

export function AppSidebar() {
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfileCache();
  const { data: jobStats } = useJobRequestStats();
  const hasPendingOpportunities = (jobStats?.newRequests ?? 0) > 0 || (jobStats?.hasGuaranteeMatch ?? false);

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    const basePath = path.split("?")[0];
    return location.pathname.startsWith(basePath) && location.pathname !== "/app";
  };

  const isGroupActive = (items: NavItem[]) =>
    items.some((item) => isActive(item.url, item.end));

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item.url, item.end);
    const shouldGlow = item.glowKey === "job-requests" && hasPendingOpportunities && !active;
    return (
      <SidebarMenuItem key={item.title}>
        <Tip label={item.title} side="right" delayDuration={collapsed ? 100 : 600}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end={item.end}
              onClick={closeMobile}
              className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
                active
                  ? "bg-primary/10 text-primary font-semibold shadow-sm"
                  : shouldGlow
                    ? "bg-destructive/10 text-destructive font-semibold shadow-[0_0_12px_hsl(var(--destructive)/0.4)] ring-1 ring-destructive/30 animate-pulse"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/50"
              }`}
              activeClassName="bg-primary/10 text-primary font-semibold"
            >
              <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : shouldGlow ? "text-destructive" : "text-muted-foreground"}`} />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {shouldGlow && !collapsed && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                  </span>
                  <span className="text-[10px] font-bold text-destructive">{jobStats?.newRequests}</span>
                </span>
              )}
              {shouldGlow && collapsed && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
                </span>
              )}
            </NavLink>
          </SidebarMenuButton>
        </Tip>
      </SidebarMenuItem>
    );
  };

  const renderGroup = (label: string, icon: any, items: NavItem[]) => {
    const active = isGroupActive(items);
    const Icon = icon;

    if (collapsed) {
      return (
        <SidebarGroup key={label}>
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <Collapsible key={label} defaultOpen={active} className="group/collapsible">
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="h-8 text-[11px] uppercase tracking-wider px-3 cursor-pointer hover:bg-muted/30 rounded-md flex items-center gap-2 font-semibold text-muted-foreground/70 transition-colors select-none mb-0.5">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground/50"}`} />
              <span className={`flex-1 ${active ? "text-primary/80" : ""}`}>{label}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="ml-2 border-l border-border/40 pl-2 space-y-0.5">
                {items.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <TooltipProvider delayDuration={collapsed ? 100 : 500}>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
        {/* ── Header / Brand ── */}
        <SidebarHeader className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-sm font-black text-primary-foreground">G</span>
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight">
                    <span className="font-black text-primary">guzzl</span>
                    <span className="text-foreground/60 font-normal">.pro</span>
                  </span>
                </div>
              </div>
            )}
            <Tip label={collapsed ? "Expand" : "Collapse"} side="right">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
              >
                <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
              </Button>
            </Tip>
          </div>
        </SidebarHeader>

        {!collapsed && (
          <div className="px-4 pb-2">
            <ClientSwitcher />
          </div>
        )}

        <SidebarContent className="px-2.5 pt-0.5">
          {/* ── Quick Access ── */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                <SidebarMenuItem>
                  <Tip label="Dashboard" side="right" delayDuration={collapsed ? 100 : 600}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/app"
                        end
                        onClick={closeMobile}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
                          location.pathname === "/app"
                            ? "bg-primary/10 text-primary font-semibold shadow-sm"
                            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/50"
                        }`}
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <LayoutDashboard className={`h-4 w-4 shrink-0 ${location.pathname === "/app" ? "text-primary" : "text-muted-foreground"}`} />
                        {!collapsed && <span>Dashboard</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </Tip>
                </SidebarMenuItem>

                {/* AI Assistant — highlighted */}
                <SidebarMenuItem>
                  <Tip label="AI Assistant" side="right" delayDuration={collapsed ? 100 : 600}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/app/assistant"
                        onClick={closeMobile}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
                          isActive("/app/assistant")
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold shadow-sm"
                            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/50"
                        }`}
                        activeClassName="bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold"
                      >
                        <Sparkles className={`h-4 w-4 shrink-0 ${isActive("/app/assistant") ? "text-primary" : "text-primary/60"}`} />
                        {!collapsed && <span>AI Assistant</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </Tip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!collapsed && <Separator className="mx-2 my-1 w-auto opacity-30" />}

          {/* ── Workflow Groups ── */}
          {renderGroup("CRM", UserCheck, crmItems)}
          {renderGroup("Jobs", Briefcase, jobsItems)}
          {renderGroup("Money", DollarSign, moneyItems)}
          {renderGroup("Marketing", Megaphone, marketingItems)}
          {renderGroup("Brand", CreditCard, brandItems)}
          {renderGroup("Team", Users, teamItems)}
          {renderGroup("Discover", MapPin, discoverItems)}

          {/* View website link */}
          {profile?.handle && !collapsed && (
            <div className="px-2 pt-1">
              <a
                href={`/site/${profile.handle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-primary/70 hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Live Website</span>
              </a>
            </div>
          )}
        </SidebarContent>

        {/* ── Footer ── */}
        <SidebarFooter className="px-2.5 pb-3 pt-1">
          {!collapsed && <Separator className="mx-1 mb-2 w-auto opacity-20" />}
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <Tip label="Settings" side="right" delayDuration={collapsed ? 100 : 600}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/app/settings"
                    onClick={closeMobile}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
                      isActive("/app/settings")
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/50"
                    }`}
                    activeClassName="bg-primary/10 text-primary font-semibold"
                  >
                    <Settings className={`h-4 w-4 shrink-0 ${isActive("/app/settings") ? "text-primary" : "text-muted-foreground"}`} />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </Tip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tip label="Help" side="right" delayDuration={collapsed ? 100 : 600}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/app/help"
                    onClick={closeMobile}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
                      isActive("/app/help")
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/50"
                    }`}
                    activeClassName="bg-primary/10 text-primary font-semibold"
                  >
                    <HelpCircle className={`h-4 w-4 shrink-0 ${isActive("/app/help") ? "text-primary" : "text-muted-foreground"}`} />
                    {!collapsed && <span>Help Center</span>}
                  </NavLink>
                </SidebarMenuButton>
              </Tip>
            </SidebarMenuItem>
            {isAdmin && adminOnlyItems.map(renderItem)}
          </SidebarMenu>

          {/* User card */}
          {!collapsed && (
            <div className="mt-3 mx-0.5 p-3 rounded-xl bg-gradient-to-b from-muted/50 to-muted/20 border border-border/30 flex items-center gap-2.5">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-background shadow-sm" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shadow-sm">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-foreground">{profile?.name || "User"}</p>
                <p className="text-[11px] text-muted-foreground truncate">@{profile?.handle || "—"}</p>
              </div>
              <Tip label="Sign out" side="top">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-7 w-7 text-muted-foreground/60 hover:text-destructive shrink-0 rounded-lg"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </Tip>
            </div>
          )}
          {collapsed && (
            <SidebarMenuItem>
              <Tip label="Sign out" side="right">
                <SidebarMenuButton
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-md px-2.5 py-1.5 text-[13px] transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </Tip>
            </SidebarMenuItem>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
