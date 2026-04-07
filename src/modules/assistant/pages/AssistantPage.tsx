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
import { aiMarkdownComponents, getScenarioIcon } from "@/components/AIResponseRenderer";

type Msg = { role: "user" | "assistant"; content: string };

/* Icon mapping now imported from AIResponseRenderer */

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

/* ── Topic categories for tracking conversation context ── */
const TOPIC_MAP: { pattern: RegExp; topic: string }[] = [
  { pattern: /lead|contact|prospect|inquiry|follow.?up/i, topic: "leads" },
  { pattern: /revenue|money|earn|profit|price|income|invoice/i, topic: "revenue" },
  { pattern: /card|design|brand|logo|bio|profile/i, topic: "card" },
  { pattern: /grow|scale|marketing|promote|campaign|outreach/i, topic: "growth" },
  { pattern: /book|appoint|schedul|calendar/i, topic: "bookings" },
  { pattern: /estimat|quote|proposal|scope/i, topic: "estimates" },
  { pattern: /automat|workflow|trigger|sequence/i, topic: "automation" },
  { pattern: /review|rating|testimon|reputation/i, topic: "reviews" },
  { pattern: /social|post|content|caption/i, topic: "social" },
  { pattern: /convert|funnel|pipeline|close|win/i, topic: "conversion" },
  { pattern: /retain|churn|inactive|re.?engage/i, topic: "retention" },
  { pattern: /referral|word.?of.?mouth/i, topic: "referrals" },
];

/** Detects topics from a message */
function detectTopics(text: string): Set<string> {
  const topics = new Set<string>();
  for (const { pattern, topic } of TOPIC_MAP) {
    if (pattern.test(text)) topics.add(topic);
  }
  return topics;
}

/** Follow-up map — related insights per topic (not repeating what was already discussed) */
const FOLLOW_UP_MAP: Record<string, string[]> = {
  leads: [
    "How do I follow up with stale leads?",
    "Write a follow-up message for my top leads",
    "Show my lead-to-booking conversion funnel",
  ],
  revenue: [
    "How can I increase my average job value?",
    "Show pricing recommendations for my area",
    "Create an upsell strategy for my services",
  ],
  card: [
    "What sections convert best on a card?",
    "Write a better bio for my profile",
    "How do top-performing cards look?",
  ],
  growth: [
    "Create a 7-day growth sprint plan",
    "Which channels should I focus on?",
    "Draft a promo campaign for this month",
  ],
  bookings: [
    "How can I reduce no-shows?",
    "Set up booking reminders",
    "What's my busiest day for bookings?",
  ],
  estimates: [
    "How can I close more estimates?",
    "Write a professional scope of work",
    "What's a good follow-up cadence for quotes?",
  ],
  automation: [
    "What automations save the most time?",
    "Set up a lead follow-up sequence",
    "Automate my review requests",
  ],
  reviews: [
    "How do I get more 5-star reviews?",
    "Write a review request message",
    "How do reviews impact my lead conversion?",
  ],
  social: [
    "Write 3 social posts for this week",
    "What type of content gets the most engagement?",
    "Create a content calendar for my business",
  ],
  conversion: [
    "What's blocking my conversions?",
    "Optimize my card for higher conversion",
    "Show my conversion rate trend",
  ],
  retention: [
    "How do I re-engage inactive customers?",
    "Write a win-back message",
    "What's causing customers to leave?",
  ],
  referrals: [
    "How do I set up a referral program?",
    "Write a referral ask message",
    "What incentives work best for referrals?",
  ],
};

/** Cross-topic discovery — suggest a related but different topic */
const CROSS_TOPIC: Record<string, { label: string; prompt: string }> = {
  leads: { label: "💡 Related insight", prompt: "How can I convert more leads into bookings?" },
  revenue: { label: "💡 Related insight", prompt: "Which services should I promote more?" },
  card: { label: "💡 Related insight", prompt: "How can I drive more traffic to my card?" },
  growth: { label: "💡 Related insight", prompt: "What's my biggest untapped opportunity?" },
  bookings: { label: "💡 Related insight", prompt: "How can I increase repeat bookings?" },
  estimates: { label: "💡 Related insight", prompt: "How do my estimate prices compare to market?" },
  automation: { label: "💡 Related insight", prompt: "What manual tasks am I still doing?" },
  reviews: { label: "💡 Related insight", prompt: "How can I use reviews to get more leads?" },
  social: { label: "💡 Related insight", prompt: "Which posts drove the most leads?" },
  conversion: { label: "💡 Related insight", prompt: "What's my strongest service by conversion?" },
  retention: { label: "💡 Related insight", prompt: "How do I turn one-time customers into regulars?" },
  referrals: { label: "💡 Related insight", prompt: "Who are my best candidates for referral asks?" },
};

/**
 * Smart follow-up engine: uses full conversation history to suggest
 * relevant next questions without repeating already-discussed topics.
 */
function getSmartFollowUps(messages: Msg[]): string[] {
  // Collect all topics discussed across the conversation
  const discussedTopics = new Set<string>();
  const recentTopics: string[] = [];

  for (const msg of messages) {
    const topics = detectTopics(msg.content);
    topics.forEach((t) => discussedTopics.add(t));
  }

  // Get topics from the last assistant message for contextual suggestions
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (lastAssistant) {
    detectTopics(lastAssistant.content).forEach((t) => recentTopics.push(t));
  }
  // Also check last user message
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser) {
    detectTopics(lastUser.content).forEach((t) => {
      if (!recentTopics.includes(t)) recentTopics.push(t);
    });
  }

  const suggestions: string[] = [];
  const usedPrompts = new Set(messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase()));

  // 1. Add deeper follow-ups for current topic
  for (const topic of recentTopics) {
    const candidates = FOLLOW_UP_MAP[topic] || [];
    for (const c of candidates) {
      if (!usedPrompts.has(c.toLowerCase()) && suggestions.length < 2) {
        suggestions.push(c);
      }
    }
  }

  // 2. Add a cross-topic discovery suggestion (something they haven't explored)
  const unexplored = Object.keys(CROSS_TOPIC).filter((t) => !discussedTopics.has(t));
  if (unexplored.length > 0) {
    const pick = unexplored[Math.floor(Math.random() * unexplored.length)];
    const cross = CROSS_TOPIC[pick];
    if (cross && !usedPrompts.has(cross.prompt.toLowerCase()) && suggestions.length < 3) {
      suggestions.push(cross.prompt);
    }
  }

  // 3. Fill remaining slots with general suggestions not yet asked
  const generals = [
    "What else can I improve?",
    "Give me my weekly performance summary",
    "What's my biggest opportunity right now?",
    "Show me quick wins I can do today",
  ];
  for (const g of generals) {
    if (!usedPrompts.has(g.toLowerCase()) && suggestions.length < 3) {
      suggestions.push(g);
    }
  }

  return suggestions.slice(0, 3);
}

/** Formats the user's query into a clean, title-cased result heading. */
function formatResultTitle(text: string): string {
  let t = text.trim();

  // Remove trailing punctuation for a clean title
  t = t.replace(/[?.!,;:]+$/, "");

  // Strip leading filler words for punchier titles
  t = t.replace(/^(please\s+|can you\s+|could you\s+|i want to\s+|i need to\s+|help me\s+|show me\s+|tell me\s+|give me\s+)/i, "");

  // Title-case: capitalize first letter of every word (except small words mid-sentence)
  const smallWords = new Set(["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "my", "is", "it", "vs"]);
  t = t
    .split(" ")
    .map((word, i) => {
      if (i === 0 || !smallWords.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(" ");

  // Ensure first char is always uppercase
  t = t.charAt(0).toUpperCase() + t.slice(1);

  return t;
}

/* Markdown components now imported from AIResponseRenderer as aiMarkdownComponents */
const mdComponents = aiMarkdownComponents;

const STORAGE_KEY = "cardpilot-assistant-history";

function loadMessages(): Msg[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveMessages(msgs: Msg[]) {
  try {
    // Keep last 50 messages to avoid storage bloat
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
  } catch { /* ignore */ }
}

export default function AssistantPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) saveMessages(messages);
  }, [messages]);

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

    // Scroll to top so user sees the new response from the beginning
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });

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

  const followUps = messages.length > 0 ? getSmartFollowUps(messages) : [];

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-4xl mx-auto">
      {/* Header with clear button */}
      {messages.length > 0 && (
        <div className="flex items-center justify-end px-3 sm:px-6 pt-2">
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-7 text-muted-foreground" onClick={handleClearChat}>
            <RotateCcw className="h-3 w-3" /> New Chat
          </Button>
        </div>
      )}
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
                  <div className={`${msg.role === "user" ? "max-w-[80%] sm:max-w-[65%]" : "max-w-[95%] sm:max-w-[88%] flex gap-3.5"}`}>
                    {msg.role === "assistant" && (
                      <div className="hidden sm:flex h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 items-center justify-center shrink-0 mt-1 shadow-lg shadow-primary/20">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="space-y-3 min-w-0 flex-1">
                      {/* Premium result title */}
                      {msg.role === "assistant" && i > 0 && messages[i - 1]?.role === "user" && (
                        <div className="px-1 mb-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="h-4 w-4 text-primary/60" />
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/50">AI Insight</span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-[1.15]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                            {formatResultTitle(messages[i - 1].content)}
                          </h2>
                          <div className="h-1 w-16 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mt-3" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground px-5 py-3.5 text-sm leading-relaxed shadow-md"
                            : "bg-gradient-to-b from-card via-card/95 to-card/85 border border-border/30 px-5 sm:px-8 py-6 sm:py-8 shadow-xl ring-1 ring-white/5 backdrop-blur-sm"
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
                          className="flex items-center gap-1 flex-wrap pl-1"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
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
