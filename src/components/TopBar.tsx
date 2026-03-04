import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, ExternalLink, Bell, UserPlus, Calendar,
  Mail, Share2, ChevronDown, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-14 flex items-center border-b border-border px-4 gap-3 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      <SidebarTrigger className="md:hidden">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      {/* Global Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts, bookings, campaigns…"
          className="pl-9 h-9 bg-muted/50 border-transparent focus:border-border text-sm"
        />
      </div>

      <div className="flex-1" />

      {/* Create dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="shadow-glow gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate("/app/contacts?new=1")}>
            <UserPlus className="h-4 w-4 mr-2" /> New Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/bookings?new=1")}>
            <Calendar className="h-4 w-4 mr-2" /> New Booking
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/app/email?new=1")}>
            <Mail className="h-4 w-4 mr-2" /> New Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/social?new=1")}>
            <Share2 className="h-4 w-4 mr-2" /> New Social Post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View card */}
      <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={() => window.open("/demo", "_blank")}>
        <ExternalLink className="h-3.5 w-3.5" /> View Card
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="h-9 w-9 relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      {/* Avatar */}
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
        U
      </div>
    </header>
  );
}
