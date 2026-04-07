import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface GuzzlLogoProps {
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Link destination — set to null to render without link */
  to?: string | null;
  /** Additional className */
  className?: string;
  /** Show only "guzzl" without ".pro" */
  brandOnly?: boolean;
  /** Optional suffix after .pro (e.g. "Analytics", "Team") */
  suffix?: string;
  /** Suffix text styling */
  suffixClassName?: string;
}

const sizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl",
} as const;

/**
 * Brand-consistent logo text for guzzl.pro
 *
 * Rules (from brand spec):
 * - "guzzl" = medium weight (font-medium), primary color
 * - ".pro"  = bold weight (font-bold), visually stronger
 * - Always horizontal, never stacked
 */
export default function GuzzlLogo({
  size = "md",
  to = "/",
  className,
  brandOnly = false,
  suffix,
  suffixClassName,
}: GuzzlLogoProps) {
  const content = (
    <span className={cn("inline-flex items-baseline tracking-tight", sizeMap[size], className)}>
      <span className="font-medium text-primary">guzzl</span>
      {!brandOnly && <span className="font-bold text-foreground">.pro</span>}
      {suffix && (
        <span className={cn("ml-1.5 font-normal text-muted-foreground", suffixClassName)}>
          {suffix}
        </span>
      )}
    </span>
  );

  if (to) {
    return <Link to={to} className="shrink-0">{content}</Link>;
  }

  return content;
}
