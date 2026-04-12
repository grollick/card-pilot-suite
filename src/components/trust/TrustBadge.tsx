import { Shield, ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type TrustVariant = "secure" | "verified" | "protected" | "encrypted";

const config: Record<TrustVariant, { icon: typeof Shield; label: string; sublabel: string; accentColor: string }> = {
  secure: {
    icon: ShieldCheck,
    label: "Secure",
    sublabel: "Platform",
    accentColor: "text-blue-600",
  },
  verified: {
    icon: BadgeCheck,
    label: "Verified",
    sublabel: "Business",
    accentColor: "text-blue-600",
  },
  protected: {
    icon: Shield,
    label: "Protected",
    sublabel: "Data",
    accentColor: "text-blue-600",
  },
  encrypted: {
    icon: Lock,
    label: "Encrypted",
    sublabel: "SSL/TLS",
    accentColor: "text-blue-600",
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
        "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-sm select-none",
        isSmall ? "px-2.5 py-1" : "px-3.5 py-1.5",
        className
      )}
    >
      {/* Icon seal */}
      <span className={cn(
        "relative flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm",
        isSmall ? "h-5 w-5" : "h-7 w-7"
      )}>
        <Icon className={isSmall ? "h-3 w-3" : "h-4 w-4"} strokeWidth={2.5} />
        {/* Check mark overlay */}
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white border border-gray-200",
          isSmall ? "h-2.5 w-2.5" : "h-3 w-3"
        )}>
          <svg viewBox="0 0 10 10" className={cn("text-blue-600 fill-current", isSmall ? "h-1.5 w-1.5" : "h-2 w-2")}>
            <path d="M8.5 3L4.2 7.3 1.5 4.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {/* Text */}
      <span className="flex flex-col leading-none">
        <span className={cn("font-bold tracking-tight text-gray-800", isSmall ? "text-[10px]" : "text-xs")}>
          {c.label}
        </span>
        <span className={cn("font-medium text-gray-400 uppercase tracking-widest", isSmall ? "text-[7px]" : "text-[9px]")}>
          {c.sublabel}
        </span>
      </span>
    </span>
  );
}
