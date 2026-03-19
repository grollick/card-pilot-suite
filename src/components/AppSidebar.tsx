import {
  LayoutDashboard, Users, Briefcase, UserCheck, Megaphone, Settings,
  ChevronLeft, LogOut, Globe, ChevronDown, Wrench, HardHat, HelpCircle,
  // Leads sub-items
  Inbox, FileText, Calendar, Kanban,
  // Jobs sub-items
  ClipboardList, RefreshCw, DollarSign,
  // Customers sub-items
  UserCircle, History, CreditCard,
  // Marketing sub-items
  Mail, Share2, Gift, Star, Package, Zap, Bot, Eye, BarChart3, QrCode, Tag,
  // Settings sub-items
  Shield, Building2, CheckSquare
} from "lucide-react";
import ClientSwitcher from "@/modules/agency/components/ClientSwitcher";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdminStats";
import { useProfileCache } from "@/hooks/useProfileCache";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";

// ── Navigation structure: 6 primary groups ──

const primaryNav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
];

const leadsItems = [
  { title: "All Leads", url: "/app/contacts", icon: Inbox },
  { title: "Pipeline", url: "/app/pipeline", icon: Kanban },
  { title: "Job Requests", url: "/app/job-requests", icon: Briefcase },
  { title: "Bookings", url: "/app/bookings", icon: Calendar },
  { title: "Estimates", url: "/app/estimates", icon: FileText },
  { title: "Tasks", url: "/app/tasks", icon: CheckSquare },
];

const jobsItems = [
  { title: "All Jobs", url: "/app/jobs", icon: Briefcase },
  { title: "Job Pipeline", url: "/app/job-pipeline", icon: ClipboardList },
  { title: "Recurring", url: "/app/recurring", icon: RefreshCw },
  { title: "Invoices", url: "/app/invoices", icon: DollarSign },
];

const customersItems = [
  { title: "Customers", url: "/app/contacts?stage=customer", icon: UserCircle },
  { title: "Reviews", url: "/app/reviews", icon: Star },
  { title: "Projects", url: "/app/projects", icon: History },
];

const marketingItems = [
  { title: "Growth", url: "/app/growth", icon: BarChart3 },
  { title: "Social", url: "/app/social", icon: Share2 },
  { title: "Auto Campaigns", url: "/app/auto-campaigns", icon: Zap },
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Content", url: "/app/content", icon: Megaphone },
  { title: "Referrals", url: "/app/referrals", icon: Gift },
  { title: "Boost", url: "/app/boost", icon: Zap },
  { title: "Marketplace ROI", url: "/app/marketplace-performance", icon: BarChart3 },
  { title: "Promotions", url: "/app/promotions", icon: Tag },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
];

const teamItems = [
  { title: "Team Management", url: "/app/team-management", icon: Users },
  { title: "Tech Dashboard", url: "/app/tech-dashboard", icon: HardHat },
];

const moreItems = [
  { title: "AI Assistant", url: "/app/assistant", icon: Bot },
  { title: "Autopilot", url: "/app/autopilot", icon: Bot },
  { title: "Automation", url: "/app/automation", icon: Zap },
  { title: "Card Editor", url: "/app/card", icon: CreditCard },
  { title: "Page Builder", url: "/app/page-builder", icon: Globe },
  { title: "QR Code", url: "/app/card/qr", icon: QrCode },
  { title: "Card Viewers", url: "/app/viewers", icon: Eye },
  { title: "Revenue", url: "/app/revenue", icon: DollarSign },
  { title: "Industry", url: "/app/industry-insights", icon: Globe },
  { title: "QR Campaigns", url: "/app/qr-campaigns", icon: QrCode },
  { title: "App Store", url: "/app/marketplace", icon: Package },
  { title: "Agency", url: "/app/agency", icon: Building2 },
];

const settingsItemsBase = [
  { title: "Help Center", url: "/app/help", icon: HelpCircle },
  { title: "Settings", url: "/app/settings", icon: Settings },
  { title: "Team", url: "/app/team", icon: Building2 },
  { title: "Landing Pages", url: "/app/landing-pages", icon: Globe },
  { title: "Sales Pipeline", url: "/app/sales-crm", icon: Kanban },
];

const adminOnlyItems = [
  { title: "Admin", url: "/app/admin", icon: Shield },
  { title: "Platform Admin", url: "/app/platform-admin", icon: Shield },
  { title: "Admin Marketing", url: "/app/admin-marketing", icon: Megaphone },
];

type NavItem = { title: string; url: string; icon: any; end?: boolean };

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();

  const { data: profile } = useQuery({
    queryKey: ["profile-handle"],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("handle, name, avatar_url")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    // Handle query params in url definition
    const basePath = path.split("?")[0];
    return location.pathname.startsWith(basePath) && location.pathname !== "/app";
  };

  const isGroupActive = (items: NavItem[]) =>
    items.some((item) => isActive(item.url, item.end));

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.end}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all hover:bg-muted/60 ${
            isActive(item.url, item.end) ? "bg-primary/8 text-primary font-medium" : "text-sidebar-foreground"
          }`}
          activeClassName="bg-primary/8 text-primary font-medium"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderCollapsibleGroup = (label: string, icon: any, items: NavItem[]) => {
    const groupActive = isGroupActive(items);
    const Icon = icon;

    if (collapsed) {
      // In collapsed mode, show only the icon for the group
      return (
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <Collapsible defaultOpen={groupActive} className="group/collapsible">
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-[13px] px-3 py-2 cursor-pointer hover:bg-muted/40 rounded-lg flex items-center gap-3 font-medium text-sidebar-foreground transition-colors select-none">
              <Icon className={`h-[18px] w-[18px] shrink-0 ${groupActive ? "text-primary" : ""}`} />
              <span className={`flex-1 ${groupActive ? "text-primary" : ""}`}>{label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="pl-3">
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
                <span className="text-xs font-bold text-primary-foreground">CP</span>
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span>.pro</span>
                <p className="text-2xs text-muted-foreground leading-tight">Business Growth Platform</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </SidebarHeader>

      {!collapsed && <Separator className="mx-4 w-auto opacity-50" />}

      {/* Agency client switcher */}
      {!collapsed && (
        <div className="px-3 py-1">
          <ClientSwitcher />
        </div>
      )}

      <SidebarContent className="px-2 pt-1">
        {/* Dashboard — top-level, no group */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Core workflow groups */}
        {renderCollapsibleGroup("Leads", Inbox, leadsItems)}
        {renderCollapsibleGroup("Jobs", Briefcase, jobsItems)}
        {renderCollapsibleGroup("Customers", UserCheck, customersItems)}
        {renderCollapsibleGroup("Marketing", Megaphone, marketingItems)}
        {renderCollapsibleGroup("Team", Users, teamItems)}
        {renderCollapsibleGroup("More Tools", Package, moreItems)}

        {/* View My Website */}
        {profile?.handle && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a
                      href={`/site/${profile.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all hover:bg-primary/10 text-primary font-medium"
                    >
                      <Globe className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>View Website</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        {!collapsed && <Separator className="mx-2 mb-2 w-auto opacity-50" />}
        <SidebarMenu>
          {[...settingsItemsBase, ...(isAdmin ? adminOnlyItems : [])].map(renderItem)}
        </SidebarMenu>

        {/* User section */}
        {!collapsed && (
          <div className="mt-2 mx-1 p-2.5 rounded-lg bg-muted/40 flex items-center gap-2.5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-background" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{profile?.name || "User"}</p>
              <p className="text-2xs text-muted-foreground truncate">@{profile?.handle || "—"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {collapsed && (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
