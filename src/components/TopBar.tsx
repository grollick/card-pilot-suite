import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Search, Plus, ExternalLink, Bell, UserPlus, Calendar,
  Mail, Share2, ChevronDown, Menu, Moon, Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
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

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="h-14 flex items-center border-b border-border px-4 gap-3 bg-card/60 backdrop-blur-xl sticky top-0 z-30">
      <SidebarTrigger className="md:hidden">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      {/* Global Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
        <Input
          placeholder="Search contacts, bookings…"
          className="pl-9 h-9 bg-muted/40 border-transparent focus:border-border focus:bg-card text-sm rounded-lg transition-colors"
        />
      </div>

      <div className="flex-1" />

      {/* Create dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="shadow-glow gap-1.5 rounded-lg h-9">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline text-[13px]">Create</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate("/app/contacts?new=1")} className="gap-2">
            <UserPlus className="h-4 w-4" /> New Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/bookings?new=1")} className="gap-2">
            <Calendar className="h-4 w-4" /> New Booking
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/app/email?new=1")} className="gap-2">
            <Mail className="h-4 w-4" /> New Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/social?new=1")} className="gap-2">
            <Share2 className="h-4 w-4" /> New Social Post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View card */}
      {profile?.handle && (
        <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex h-9 rounded-lg text-[13px]" asChild>
          <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> View Card
          </a>
        </Button>
      )}

      {/* Night mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle night mode</span>
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="h-9 w-9 relative rounded-lg">
        <Bell className="h-4 w-4" />
        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-card" />
      </Button>

      {/* Avatar */}
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-border" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary ring-2 ring-border">
          {initials}
        </div>
      )}
    </header>
  );
}
