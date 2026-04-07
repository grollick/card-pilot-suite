import ReactMarkdown from "react-markdown";
import { Copy, ThumbsUp, ThumbsDown, Sparkles, ExternalLink } from "lucide-react";
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
  h1: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <h1
        className="flex items-center gap-3 text-2xl font-black mt-6 mb-4 pb-3 border-b border-primary/15 text-foreground tracking-tight"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <span className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </span>
        <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{children}</span>
      </h1>
    );
  },
  h2: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <h2
        className="flex items-center gap-3 text-lg font-extrabold mt-8 mb-3 pb-3 border-b border-border/30 text-foreground tracking-tight"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-md ring-1 ring-primary/15">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        {children}
      </h2>
    );
  },
  h3: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <h3
        className="flex items-center gap-2.5 text-base font-bold mt-6 mb-2.5 text-foreground tracking-tight"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/12 to-transparent flex items-center justify-center shrink-0 ring-1 ring-primary/10">
          <Icon className="h-4 w-4 text-primary/80" />
        </span>
        {children}
      </h3>
    );
  },
  li: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <li
        className="flex items-start gap-3.5 my-3.5 list-none text-[15px] leading-[1.75] group"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center shrink-0 mt-0.5 shadow-sm ring-1 ring-success/15 group-hover:ring-success/30 group-hover:shadow-md transition-all duration-200">
          <Icon className="h-4 w-4 text-success" />
        </span>
        <span className="flex-1 text-foreground/90">{children}</span>
      </li>
    );
  },
  blockquote: ({ children }: any) => (
    <blockquote
      className="flex items-start gap-3.5 border-l-[3px] border-warning/50 bg-gradient-to-r from-warning/8 via-warning/4 to-transparent rounded-r-xl px-5 py-4 my-6 not-italic text-[15px] shadow-sm backdrop-blur-sm"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <span className="h-9 w-9 rounded-xl bg-warning/15 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-warning/20">
        <Lightbulb className="h-4.5 w-4.5 text-warning" />
      </span>
      <div className="flex-1">{children}</div>
    </blockquote>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {children}
    </strong>
  ),
  p: ({ children }: any) => (
    <p className="text-foreground/75 leading-[1.9] my-3 text-[15px]">{children}</p>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary font-semibold underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors"
    >
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  ),
  hr: () => (
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      <Sparkles className="h-3.5 w-3.5 text-primary/30" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
    </div>
  ),
  code: ({ children }: any) => (
    <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground/80">{children}</code>
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
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-2xl bg-gradient-to-b from-card via-card/95 to-card/85 border border-border/30 px-5 sm:px-8 py-6 sm:py-8 shadow-xl ring-1 ring-white/5 backdrop-blur-sm">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:pl-0 [&_ol]:pl-0 [&_li+li]:mt-1">
          <ReactMarkdown components={aiMarkdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
      {showActions && (
        <div className="flex items-center gap-1 pl-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
            onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-success rounded-lg"
            onClick={() => toast.success("Thanks for the feedback!")}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
            onClick={() => toast("We'll improve — thanks!", { icon: "🙏" })}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
