import { Shield, ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type TrustVariant = "secure" | "verified" | "protected" | "encrypted";

const config: Record<TrustVariant, { icon: typeof Shield; label: string; className: string }> = {
  secure: {
    icon: ShieldCheck,
    label: "Secure Platform",
    className: "text-emerald-600 bg-emerald-500/8 border-emerald-500/15",
  },
  verified: {
    icon: BadgeCheck,
    label: "Verified Business",
    className: "text-blue-600 bg-blue-500/8 border-blue-500/15",
  },
  protected: {
    icon: Shield,
    label: "Protected Data",
    className: "text-primary bg-primary/8 border-primary/15",
  },
  encrypted: {
    icon: Lock,
    label: "Encrypted",
    className: "text-emerald-600 bg-emerald-500/8 border-emerald-500/15",
  },
};

interface TrustBadgeProps {
  variant: TrustVariant;
  size?: "sm" | "md";
  className?: string;
}

export default function TrustBadge({ variant, size = "sm", className }: TrustBadgeProps) {
  const c = config[variant];
  const Icon = c.icon;
  const isSmall = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium select-none",
        isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        c.className,
        className
      )}
    >
      <Icon className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {c.label}
    </span>
  );
}
