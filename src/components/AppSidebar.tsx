import {
  LayoutDashboard, Users, Briefcase, UserCheck, Megaphone, Settings,
  ChevronLeft, LogOut, Globe, ChevronDown, HelpCircle,
  Inbox, FileText, Calendar, Kanban,
  ClipboardList, RefreshCw, DollarSign,
  UserCircle, Star,
  Mail, Share2, Gift, BarChart3, QrCode, Tag, Zap,
  Bot, Eye, CreditCard, Package, Building2, CheckSquare,
  Shield,
} from "lucide-react";
import ClientSwitcher from "@/modules/agency/components/ClientSwitcher";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdminStats";
import { useProfileCache } from "@/hooks/useProfileCache";
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

const primaryNav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "AI Assistant", url: "/app/assistant", icon: Bot },
];

const leadsItems = [
  { title: "All Leads", url: "/app/contacts", icon: Inbox },
  { title: "Pipeline", url: "/app/pipeline", icon: Kanban },
  { title: "Bookings", url: "/app/bookings", icon: Calendar },
  { title: "Estimates", url: "/app/estimates", icon: FileText },
  { title: "Tasks", url: "/app/tasks", icon: CheckSquare },
];

const jobsItems = [
  { title: "All Jobs", url: "/app/jobs", icon: Briefcase },
  { title: "Job Pipeline", url: "/app/job-pipeline", icon: ClipboardList },
  { title: "Recurring", url: "/app/recurring", icon: RefreshCw },
  { title: "Invoices", url: "/app/invoices", icon: DollarSign },
  { title: "Revenue", url: "/app/revenue", icon: DollarSign },
];

const customersItems = [
  { title: "Contacts", url: "/app/contacts?stage=customer", icon: UserCircle },
  { title: "Reviews", url: "/app/reviews", icon: Star },
  { title: "Projects", url: "/app/projects", icon: Briefcase },
];

const marketingItems = [
  { title: "Growth", url: "/app/growth", icon: BarChart3 },
  { title: "Social", url: "/app/social", icon: Share2 },
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Campaigns", url: "/app/auto-campaigns", icon: Zap },
  { title: "Referrals", url: "/app/referrals", icon: Gift },
  { title: "Promotions", url: "/app/promotions", icon: Tag },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
];

const toolsItems = [
  { title: "Card Editor", url: "/app/card", icon: CreditCard },
  { title: "Page Builder", url: "/app/page-builder", icon: Globe },
  { title: "QR Campaigns", url: "/app/qr-campaigns", icon: QrCode },
  { title: "Card Viewers", url: "/app/viewers", icon: Eye },
  { title: "Marketplace", url: "/app/marketplace", icon: Package },
  { title: "Boost", url: "/app/boost", icon: Zap },
];

const teamItems = [
  { title: "Team", url: "/app/team-management", icon: Users },
  { title: "Lead Routing", url: "/app/lead-routing", icon: Inbox },
  { title: "Agency", url: "/app/agency", icon: Building2 },
];

const settingsItems = [
  { title: "Settings", url: "/app/settings", icon: Settings },
  { title: "Help", url: "/app/help", icon: HelpCircle },
];

const adminOnlyItems = [
  { title: "Admin", url: "/app/admin", icon: Shield },
  { title: "Platform", url: "/app/platform-admin", icon: Shield },
  { title: "Marketing", url: "/app/admin-marketing", icon: Megaphone },
];

type NavItem = { title: string; url: string; icon: any; end?: boolean };

export function AppSidebar() {
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfileCache();

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

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <Tip label={item.title} side="right" delayDuration={collapsed ? 100 : 600}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.end}
            onClick={closeMobile}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all hover:bg-muted/60 ${
              isActive(item.url, item.end) ? "bg-primary/8 text-primary font-medium" : "text-sidebar-foreground"
            }`}
            activeClassName="bg-primary/8 text-primary font-medium"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </Tip>
    </SidebarMenuItem>
  );

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
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-[13px] px-3 py-2 cursor-pointer hover:bg-muted/40 rounded-lg flex items-center gap-3 font-medium text-sidebar-foreground transition-colors select-none">
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
              <span className={`flex-1 ${active ? "text-primary" : ""}`}>{label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="pl-3">{items.map(renderItem)}</SidebarMenu>
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
        <SidebarHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
                  <span className="text-xs font-bold text-primary-foreground">G</span>
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight">
                    <span className="font-extrabold text-primary">guzzl</span>.pro
                  </span>
                  <p className="text-2xs text-muted-foreground leading-tight">Business Platform</p>
                </div>
              </div>
            )}
            <Tip label={collapsed ? "Expand" : "Collapse"} side="right">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
              </Button>
            </Tip>
          </div>
        </SidebarHeader>

        {!collapsed && <Separator className="mx-4 w-auto opacity-50" />}

        {!collapsed && (
          <div className="px-3 py-1">
            <ClientSwitcher />
          </div>
        )}

        <SidebarContent className="px-2 pt-1">
          {/* Top-level items */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{primaryNav.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Core workflow groups */}
          {renderGroup("Leads", Inbox, leadsItems)}
          {renderGroup("Jobs", Briefcase, jobsItems)}
          {renderGroup("Customers", UserCheck, customersItems)}
          {renderGroup("Marketing", Megaphone, marketingItems)}
          {renderGroup("Tools", CreditCard, toolsItems)}
          {renderGroup("Team", Users, teamItems)}

          {/* View website */}
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
            {settingsItems.map(renderItem)}
            {isAdmin && adminOnlyItems.map(renderItem)}
          </SidebarMenu>

          {/* User card */}
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
              <Tip label="Sign out" side="top">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
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
                  className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <LogOut className="h-[18px] w-[18px] shrink-0" />
                </SidebarMenuButton>
              </Tip>
            </SidebarMenuItem>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
