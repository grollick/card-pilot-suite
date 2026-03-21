import { useState, useRef, useEffect } from "react";
import AiCreditTopupDialog from "@/components/AiCreditTopupDialog";
import {
  Send, Loader2, Copy, RotateCcw, TrendingUp, Zap, Target, PenTool,
  BarChart3, Users, CalendarPlus, ThumbsUp, ThumbsDown, Bookmark,
  Lightbulb, CheckCircle2, ArrowRight, Star, AlertTriangle, Sparkles,
  DollarSign, Share2, MessageSquare, Mail, Clock, Shield, Megaphone,
  Palette, FileText, Search, Heart, Award, Rocket, Bot,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

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

function getScenarioIcon(text: string): LucideIcon {
  for (const [pattern, icon] of ICON_KEYWORDS) {
    if (pattern.test(text)) return icon;
  }
  return CheckCircle2;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/growth-coach`;

const PROMPT_CATEGORIES = [
  {
    label: "Performance",
    icon: BarChart3,
    color: "text-primary",
    gradient: "from-primary/10 to-primary/5",
    prompts: [
      "Give me my weekly performance summary",
      "What's my conversion rate and how can I improve it?",
      "Which leads should I follow up with today?",
    ],
  },
  {
    label: "Growth Tips",
    icon: TrendingUp,
    color: "text-success",
    gradient: "from-success/10 to-success/5",
    prompts: [
      "How can I get more leads this week?",
      "What should I improve on my card to convert better?",
      "Analyze my business and give me 3 quick wins",
    ],
  },
  {
    label: "Content",
    icon: PenTool,
    color: "text-warning",
    gradient: "from-warning/10 to-warning/5",
    prompts: [
      "Write service descriptions for my top services",
      "Create a seasonal promotion for my business",
      "Draft a follow-up message for my pending leads",
    ],
  },
  {
    label: "Strategy",
    icon: Target,
    color: "text-destructive",
    gradient: "from-destructive/10 to-destructive/5",
    prompts: [
      "Create a 30-day growth plan for my business",
      "How should I price my services compared to market?",
      "What automations should I set up to save time?",
    ],
  },
];

const QUICK_ACTIONS = [
  { label: "View Contacts", icon: Users, route: "/app/contacts" },
  { label: "Create Booking", icon: CalendarPlus, route: "/app/bookings" },
  { label: "Set Up Automation", icon: Zap, route: "/app/automation" },
  { label: "Edit Card", icon: PenTool, route: "/app/card" },
];

/* ── Follow-up suggestions based on last message context ── */
function getFollowUps(lastMsg: string): string[] {
  const lower = lastMsg.toLowerCase();
  if (/lead|contact|prospect/i.test(lower))
    return ["How do I follow up with stale leads?", "Write a follow-up message", "Show my lead funnel"];
  if (/revenue|money|earn|profit/i.test(lower))
    return ["How can I increase my average job value?", "Show pricing recommendations", "Create an upsell strategy"];
  if (/card|design|brand/i.test(lower))
    return ["What sections should I add to my card?", "Write a better bio for me", "How do top cards convert?"];
  if (/grow|scale|marketing/i.test(lower))
    return ["Create a 7-day growth sprint", "What channels should I focus on?", "Draft a promo campaign"];
  return ["What else can I improve?", "Give me a weekly summary", "Write me a follow-up message"];
}

/* ── Markdown components ── */
const mdComponents = {
  h2: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <h2 className="flex items-center gap-2.5 text-base font-bold mt-5 mb-2.5 pb-1.5 border-b border-border/30 text-foreground">
        <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        {children}
      </h2>
    );
  },
  h3: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <h3 className="flex items-center gap-2 text-[15px] font-semibold mt-4 mb-1.5 text-foreground">
        <Icon className="h-4 w-4 text-primary/70 shrink-0" />
        {children}
      </h3>
    );
  },
  li: ({ children }: any) => {
    const Icon = getScenarioIcon(String(children));
    return (
      <li className="flex items-start gap-2.5 my-2 list-none text-[14px] leading-relaxed">
        <span className="h-5.5 w-5.5 rounded-md bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-3.5 w-3.5 text-success" />
        </span>
        <span className="flex-1">{children}</span>
      </li>
    );
  },
  blockquote: ({ children }: any) => (
    <blockquote className="flex items-start gap-3 border-l-2 border-warning/40 bg-warning/5 rounded-r-xl px-4 py-3 my-4 not-italic">
      <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </blockquote>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  p: ({ children }: any) => (
    <p className="text-muted-foreground leading-[1.8] my-2">{children}</p>
  ),
};

export default function AssistantPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in to use the assistant");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 403 && err.code === "AI_LIMIT_REACHED") {
          setShowTopup(true);
          throw new Error(err.error);
        }
        if (resp.status === 429) throw new Error("Rate limited — please wait a moment and try again.");
        if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Settings.");
        throw new Error(err.error || "Request failed");
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) =>
                prev.map((m, idx) => idx === prev.length - 1 && m.role === "assistant" ? { ...m, content: assistantSoFar } : m)
              );
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      console.error("Growth coach error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const followUps = lastAssistantMsg ? getFollowUps(lastAssistantMsg.content) : [];

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-4xl mx-auto">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-5">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-full gap-6 py-12"
            >
              {/* Animated greeting */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center shadow-sm"
              >
                <Bot className="h-8 w-8 text-primary" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center space-y-2"
              >
                <h2 className="text-xl font-bold text-foreground">AI Growth Coach</h2>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Your personal business advisor. Ask anything about your performance, leads, content, or growth strategy.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={`w-full max-w-2xl grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {PROMPT_CATEGORIES.map((cat, catIdx) => (
                  <motion.div
                    key={cat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + catIdx * 0.08 }}
                    className={`rounded-xl border border-border/50 bg-gradient-to-br ${cat.gradient} p-4 space-y-2.5 hover:border-border transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-6 w-6 rounded-lg bg-background/80 flex items-center justify-center`}>
                        <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                      </span>
                      <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">{cat.label}</p>
                    </div>
                    <div className="space-y-0.5">
                      {cat.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-background/60 transition-colors text-foreground/75 hover:text-foreground leading-snug"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`${msg.role === "user" ? "max-w-[80%] sm:max-w-[65%]" : "max-w-[95%] sm:max-w-[85%] flex gap-3"}`}>
                    {msg.role === "assistant" && (
                      <div className="hidden sm:flex h-8 w-8 rounded-xl bg-gradient-to-br from-primary/10 to-success/10 items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="space-y-2 min-w-0 flex-1">
                      {/* Title the assistant response with what the user asked */}
                      {msg.role === "assistant" && i > 0 && messages[i - 1]?.role === "user" && (
                        <div className="flex items-center gap-1.5 px-1 mb-1">
                          <Search className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-xs font-medium text-muted-foreground/70 truncate">
                            {messages[i - 1].content}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground px-4 py-3 text-sm leading-relaxed shadow-sm"
                            : "bg-card border border-border/50 px-4 sm:px-6 py-4 sm:py-5 text-[13px] sm:text-sm shadow-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:pl-0 [&_ol]:pl-0 [&_li+li]:mt-1">
                            <ReactMarkdown components={mdComponents}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* Action bar */}
                      {msg.role === "assistant" && !isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-0.5 flex-wrap"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => toast.success("Saved to bookmarks")}
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                          </Button>
                          {i === messages.length - 1 && (
                            <>
                              <span className="text-muted-foreground/20 mx-1">|</span>
                              {QUICK_ACTIONS.map((action) => (
                                <Button
                                  key={action.route}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                                  onClick={() => navigate(action.route)}
                                >
                                  <action.icon className="h-3.5 w-3.5" />
                                  {action.label}
                                </Button>
                              ))}
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3 items-start">
                    <div className="hidden sm:flex h-8 w-8 rounded-xl bg-gradient-to-br from-primary/10 to-success/10 items-center justify-center shrink-0 shadow-sm">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl px-5 py-3.5 shadow-sm flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-muted-foreground">Thinking…</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Contextual follow-up suggestions */}
          {messages.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-1.5 flex-wrap"
            >
              {followUps.map((q) => (
                <Badge
                  key={q}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all text-[11px] py-1 px-2.5"
                  onClick={() => sendMessage(q)}
                >
                  <Sparkles className="h-3 w-3 mr-1 text-primary/50" />
                  {q}
                </Badge>
              ))}
            </motion.div>
          )}
          <div className="flex items-end gap-2">
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl"
                onClick={() => setMessages([])}
                title="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                placeholder="Ask for growth tips, content, performance analysis…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={1}
                className="min-h-[42px] max-h-[120px] resize-none pr-12 rounded-xl"
              />
              <Button
                size="icon"
                className="h-8 w-8 absolute right-1.5 bottom-1.5 rounded-lg"
                disabled={!input.trim() || isLoading}
                onClick={() => sendMessage(input)}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <AiCreditTopupDialog open={showTopup} onOpenChange={setShowTopup} />
    </div>
  );
}
