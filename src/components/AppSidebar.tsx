import {
  LayoutDashboard, CreditCard, Users, Calendar, Mail, Share2,
  BarChart3, Settings, Shield, ChevronLeft, LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Home", url: "/app", icon: LayoutDashboard },
  { title: "Card", url: "/app/card", icon: CreditCard },
  { title: "Leads", url: "/app/leads", icon: Users },
  { title: "Booking", url: "/app/booking", icon: Calendar },
  { title: "Email", url: "/app/email", icon: Mail },
  { title: "Social", url: "/app/social", icon: Share2 },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
];

const bottomItems = [
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

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight gradient-text">CardPilot</span>
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 px-3">
            {!collapsed && "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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
