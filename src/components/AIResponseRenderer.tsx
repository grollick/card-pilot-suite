import ReactMarkdown from "react-markdown";
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  DollarSign, Users, Share2, MessageSquare, Mail, Clock, Shield, Megaphone,
  Palette, FileText, Search, Star, Heart, Award, TrendingUp, Rocket, Target,
  Zap, CalendarPlus, AlertTriangle, Lightbulb, CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ── Scenario icon mapping ── */
const ICON_KEYWORDS: [RegExp, LucideIcon][] = [
  [/revenue|money|price|cost|profit|earning|income|\$/i, DollarSign],
  [/lead|prospect|inquiry|customer|client/i, Users],
  [/share|social|post|viral|referral/i, Share2],
  [/message|chat|reply|respond|conversation/i, MessageSquare],
  [/email|inbox|send|newsletter/i, Mail],
  [/time|schedule|deadline|fast|quick|hour|minute/i, Clock],
  [/security|trust|safe|protect|privacy/i, Shield],
  [/market|advertis|promot|campaign|outreach/i, Megaphone],
  [/design|brand|style|visual|card|logo/i, Palette],
  [/estimat|invoice|quote|proposal|document/i, FileText],
  [/search|find|discover|seo|google/i, Search],
  [/review|rating|testimon|feedback/i, Star],
  [/retain|loyal|repeat|engage/i, Heart],
  [/award|milestone|achiev|badge|goal/i, Award],
  [/grow|scale|expand|boost|increase|improv/i, TrendingUp],
  [/launch|start|setup|begin|create/i, Rocket],
  [/strategy|plan|action|step|tip/i, Target],
  [/convert|funnel|pipeline|close|win/i, Zap],
  [/book|appoint|calendar|reserv/i, CalendarPlus],
  [/warn|risk|danger|avoid|mistake/i, AlertTriangle],
  [/idea|suggest|recommend|insight/i, Lightbulb],
];

export function getScenarioIcon(text: string): LucideIcon {
  for (const [pattern, icon] of ICON_KEYWORDS) {
    if (pattern.test(text)) return icon;
  }
  return CheckCircle2;
}

/** Shared premium markdown components for all AI responses */
export const aiMarkdownComponents = {
  h2: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <h2 className="flex items-center gap-3 text-lg font-extrabold mt-6 mb-3 pb-2.5 border-b border-border/20 text-foreground tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 shadow-sm ring-1 ring-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </span>
        {children}
      </h2>
    );
  },
  h3: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <h3 className="flex items-center gap-2.5 text-base font-bold mt-5 mb-2 text-foreground tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-primary/80" />
        </span>
        {children}
      </h3>
    );
  },
  li: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <li className="flex items-start gap-3 my-3 list-none text-[15px] leading-[1.7] group" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center shrink-0 mt-0.5 shadow-sm ring-1 ring-success/10 group-hover:ring-success/20 transition-all">
          <Icon className="h-3.5 w-3.5 text-success" />
        </span>
        <span className="flex-1 text-foreground/85">{children}</span>
      </li>
    );
  },
  blockquote: ({ children }: any) => (
    <blockquote className="flex items-start gap-3 border-l-[3px] border-warning/50 bg-gradient-to-r from-warning/8 to-transparent rounded-r-xl px-5 py-4 my-5 not-italic text-[15px] shadow-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <span className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="h-4 w-4 text-warning" />
      </span>
      <div className="flex-1">{children}</div>
    </blockquote>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</strong>
  ),
  p: ({ children }: any) => (
    <p className="text-muted-foreground leading-[1.85] my-2.5 text-[14px]">{children}</p>
  ),
};

/** Premium AI response card with consistent styling */
export function AIResponseCard({
  content,
  showActions = true,
  className = "",
}: {
  content: string;
  showActions?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rounded-2xl bg-gradient-to-b from-card to-card/80 border border-border/40 px-5 sm:px-7 py-5 sm:py-6 text-[13px] sm:text-sm shadow-md ring-1 ring-white/5">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:pl-0 [&_ol]:pl-0 [&_li+li]:mt-1">
          <ReactMarkdown components={aiMarkdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
      {showActions && (
        <div className="flex items-center gap-0.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-success"
            onClick={() => toast.success("Thanks for the feedback!")}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => toast("We'll improve — thanks!", { icon: "🙏" })}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
