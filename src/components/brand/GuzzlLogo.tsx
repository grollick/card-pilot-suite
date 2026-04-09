import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import guzzlLogoImg from "@/assets/guzzl-logo.png";

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

const heightMap = {
  xs: "h-5",
  sm: "h-7",
  md: "h-9",
  lg: "h-12",
  xl: "h-16",
} as const;

/**
 * Brand-consistent image logo for guzzl.pro
 *
 * Uses the official logo asset with icon + wordmark.
 * Always horizontal, never stacked.
 */
export default function GuzzlLogo({
  size = "md",
  to = "/",
  className,
  suffix,
  suffixClassName,
}: GuzzlLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src={guzzlLogoImg}
        alt="guzzl.pro"
        className={cn("w-auto object-contain", heightMap[size])}
      />
      {suffix && (
        <span className={cn("ml-2 font-semibold text-muted-foreground text-xl", suffixClassName)}>
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
