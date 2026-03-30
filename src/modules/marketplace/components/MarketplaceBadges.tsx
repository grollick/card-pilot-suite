import { Sparkles, Rocket, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FeaturedBadge() {
  return (
    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-0.5">
      <Sparkles className="h-2.5 w-2.5" /> Featured
    </Badge>
  );
}

export function BoostedBadge() {
  return (
    <Badge className="bg-accent/10 text-accent-foreground border-accent/20 text-[10px] gap-0.5">
      <Rocket className="h-2.5 w-2.5" /> Boosted
    </Badge>
  );
}

export function PremiumBadge() {
  return (
    <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] gap-0.5">
      <ShieldCheck className="h-2.5 w-2.5" /> Premium
    </Badge>
  );
}
