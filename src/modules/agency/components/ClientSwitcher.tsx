import { useOrg } from "@/contexts/OrgContext";
import { useIsAgency } from "@/hooks/useAgency";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ClientSwitcher() {
  const { data: isAgency } = useIsAgency();
  const { orgs, currentOrg, switchOrg } = useOrg();
  const navigate = useNavigate();

  if (!isAgency || orgs.length <= 1) return null;

  const handleSwitch = async (orgId: string) => {
    await switchOrg(orgId);
    toast.success("Switched workspace");
  };

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-xs font-medium">
            {currentOrg?.name || "Select workspace"}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Client Workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarImage src={org.logo_url ?? undefined} />
              <AvatarFallback className="rounded-md bg-primary/10 text-primary text-2xs font-semibold">
                {initials(org.name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm truncate">{org.name}</span>
            {currentOrg?.id === org.id && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/app/agency")}
          className="text-primary cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
