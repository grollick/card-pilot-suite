import { ShieldCheck, Shield, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationLevel = "basic" | "verified" | "pro_verified";

const levelConfig: Record<VerificationLevel, {
  icon: typeof Shield;
  label: string;
  className: string;
  tooltip: string;
}> = {
  basic: {
    icon: Shield,
    label: "Basic",
    className: "text-muted-foreground bg-muted/50 border-border/40",
    tooltip: "Basic account",
  },
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    className: "text-primary bg-primary/8 border-primary/20",
    tooltip: "Verified Business",
  },
  pro_verified: {
    icon: BadgeCheck,
    label: "Pro Verified",
    className: "text-amber-600 bg-amber-500/8 border-amber-500/20",
    tooltip: "Pro Verified Business",
  },
};

interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export default function VerificationBadge({
  level,
  size = "sm",
  showLabel = true,
  className,
}: VerificationBadgeProps) {
  if (level === "basic") return null;

  const c = levelConfig[level];
  const Icon = c.icon;

  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  };

  if (!showLabel) {
    return (
      <span className={cn("inline-flex", className)} aria-label={c.tooltip}>
        <Icon className={cn(sizeClasses[size], level === "pro_verified" ? "text-amber-600" : "text-primary")} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium select-none",
        size === "xs" ? "px-1.5 py-0.5 text-[9px]" : size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        c.className,
        className
      )}
      aria-label={c.tooltip}
    >
      <Icon className={sizeClasses[size]} />
      {c.label}
    </span>
  );
}

/** Determine verification level from profile data (client-side fallback) */
export function getVerificationLevel(profile: {
  name?: string | null;
  profession_id?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  trust_score?: number | null;
  verification_level?: string | null;
}, stats?: { leadCount?: number; bookingCount?: number; hasCard?: boolean }): VerificationLevel {
  if (profile.verification_level && profile.verification_level !== "basic") {
    return profile.verification_level as VerificationLevel;
  }

  const hasProfile = !!profile.name && !!profile.profession_id;
  const hasActivity = (stats?.leadCount ?? 0) >= 1 || (stats?.bookingCount ?? 0) >= 1;
  const trustScore = profile.trust_score ?? 0;

  if (
    trustScore >= 60 &&
    hasProfile &&
    !!profile.phone &&
    !!profile.avatar_url &&
    stats?.hasCard &&
    ((stats?.leadCount ?? 0) >= 5 || (stats?.bookingCount ?? 0) >= 3)
  ) {
    return "pro_verified";
  }

  if (hasProfile && hasActivity) {
    return "verified";
  }

  return "basic";
}
