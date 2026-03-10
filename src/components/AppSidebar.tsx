import {
  LayoutDashboard, Users, Kanban, Calendar, Mail, Share2,
  BarChart3, Settings, Shield, ChevronLeft, LogOut,
  Zap, CreditCard, Building2, QrCode, Eye,
  DollarSign, Tag, Gift, Globe, FolderOpen, Star, Megaphone,
  CheckSquare, Search as SearchIcon, FileText, Briefcase, Bot, Package
} from "lucide-react";
import ClientSwitcher from "@/modules/agency/components/ClientSwitcher";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ── 7 core modules ──

const cardItems = [
  { title: "Card Editor", url: "/app/card", icon: CreditCard },
  { title: "QR Code", url: "/app/card/qr", icon: QrCode },
];

const crmItems = [
  { title: "Contacts", url: "/app/contacts", icon: Users },
  { title: "Pipeline", url: "/app/pipeline", icon: Kanban },
  { title: "Tasks", url: "/app/tasks", icon: CheckSquare },
];

const bookingItems = [
  { title: "Bookings", url: "/app/bookings", icon: Calendar },
  { title: "Estimates", url: "/app/estimates", icon: FileText },
  { title: "Jobs", url: "/app/jobs", icon: Briefcase },
];

const analyticsItems = [
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "Who Viewed", url: "/app/viewers", icon: Eye },
  { title: "Revenue", url: "/app/revenue", icon: DollarSign },
  { title: "Industry", url: "/app/industry-insights", icon: Globe },
  { title: "QR Campaigns", url: "/app/qr-campaigns", icon: QrCode },
];

const marketingItems = [
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Social", url: "/app/social", icon: Share2 },
  { title: "Content", url: "/app/content", icon: Megaphone },
  { title: "Promotions", url: "/app/promotions", icon: Tag },
  { title: "Boost", url: "/app/boost", icon: Zap },
  { title: "Referrals", url: "/app/referrals", icon: Gift },
];

const automationItems = [
  { title: "Automation", url: "/app/automation", icon: Zap },
  { title: "AI Autopilot", url: "/app/autopilot", icon: Bot },
  { title: "AI Assistant", url: "/app/assistant", icon: Bot },
];

const marketplaceItems = [
  { title: "Projects", url: "/app/projects", icon: FolderOpen },
  { title: "Reviews", url: "/app/reviews", icon: Star },
  { title: "App Store", url: "/app/marketplace", icon: Package },
];

const agencyItems = [
  { title: "Agency", url: "/app/agency", icon: Building2 },
];

const bottomItems = [
  { title: "Team", url: "/app/team", icon: Building2 },
  { title: "Settings", url: "/app/settings", icon: Settings },
  { title: "Admin", url: "/app/admin", icon: Shield },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

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

  const isActive = (path: string) =>
    path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderGroup = (label: string, items: typeof crmItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-2xs uppercase tracking-widest text-muted-foreground/50 px-3 mb-0.5 font-semibold">
        {!collapsed && label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/app"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all hover:bg-muted/60 ${
                    isActive(item.url) ? "bg-primary/8 text-primary font-medium" : "text-sidebar-foreground"
                  }`}
                  activeClassName="bg-primary/8 text-primary font-medium"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const initials = profile?.name
    ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
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
                <span className="text-sm font-bold tracking-tight">CardPilot</span>
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
        {/* Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/app"
                    end
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all hover:bg-muted/60 ${
                      isActive("/app") && location.pathname === "/app" ? "bg-primary/8 text-primary font-medium" : "text-sidebar-foreground"
                    }`}
                    activeClassName="bg-primary/8 text-primary font-medium"
                  >
                    <LayoutDashboard className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {renderGroup("Card", cardItems)}
        {renderGroup("CRM", crmItems)}
        {renderGroup("Booking", bookingItems)}
        {renderGroup("Analytics", analyticsItems)}
        {renderGroup("Marketing", marketingItems)}
        {renderGroup("Automation", automationItems)}
        {renderGroup("Marketplace", marketplaceItems)}
        {renderGroup("Agency", agencyItems)}

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
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-all hover:bg-muted/60 ${
                    isActive(item.url) ? "bg-primary/8 text-primary font-medium" : "text-sidebar-foreground"
                  }`}
                  activeClassName="bg-primary/8 text-primary font-medium"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
