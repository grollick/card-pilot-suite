import {
  LayoutDashboard, Users, Kanban, Calendar, Mail, Share2,
  BarChart3, Settings, Shield, ChevronLeft, LogOut,
  FileText, Zap, Megaphone, CreditCard, Building2
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const crmItems = [
  { title: "Contacts", url: "/app/contacts", icon: Users },
  { title: "Pipeline", url: "/app/pipeline", icon: Kanban },
  { title: "Tasks", url: "/app/tasks", icon: FileText },
  { title: "Bookings", url: "/app/booking", icon: Calendar },
  { title: "Card Editor", url: "/app/card", icon: CreditCard },
];

const marketingItems = [
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Social", url: "/app/social", icon: Share2 },
  { title: "Content", url: "/app/content", icon: Megaphone },
];

const insightItems = [
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "Automation", url: "/app/automation", icon: Zap },
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
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderGroup = (label: string, items: typeof crmItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 mb-1">
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
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <span className="text-lg font-bold tracking-tight gradient-text">CardPilot</span>
              <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">Auto follow-up. Auto close.</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-muted-foreground"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/app"
                    end
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Home</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {renderGroup("CRM", crmItems)}
        {renderGroup("Marketing", marketingItems)}
        {renderGroup("Insights", insightItems)}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
