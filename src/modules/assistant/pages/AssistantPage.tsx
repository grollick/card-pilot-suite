import { useState, useRef, useEffect } from "react";
import AiCreditTopupDialog from "@/components/AiCreditTopupDialog";
import { Send, Loader2, Copy, RotateCcw, TrendingUp, Zap, Target, PenTool, BarChart3, Users, CalendarPlus, ThumbsUp, ThumbsDown, Bookmark, Lightbulb, CheckCircle2, ArrowRight, Star, AlertTriangle, Sparkles, DollarSign, Share2, MessageSquare, Mail, Clock, Shield, Megaphone, Palette, FileText, Search, Heart, Award, Rocket, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/growth-coach`;

const PROMPT_CATEGORIES = [
  {
    label: "Performance",
    icon: BarChart3,
    color: "text-primary",
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
    prompts: [
      "Create a 30-day growth plan for my business",
      "How should I price my services compared to market?",
      "What automations should I set up to save time?",
    ],
  },
];

/* Quick action buttons that appear after AI responses */
const QUICK_ACTIONS = [
  { label: "View Contacts", icon: Users, route: "/app/contacts" },
  { label: "Create Booking", icon: CalendarPlus, route: "/app/bookings" },
  { label: "Set Up Automation", icon: Zap, route: "/app/automation" },
  { label: "Edit Card", icon: PenTool, route: "/app/card" },
];

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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
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

      // Final flush
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
                prev.map((m, i) => i === prev.length - 1 && m.role === "assistant" ? { ...m, content: assistantSoFar } : m)
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

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-4xl mx-auto">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold">AI Growth Coach</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Your personal business advisor. Get data-driven insights, generate content, and create growth strategies — all based on your real performance data.
              </p>
            </div>

            <div className={`w-full max-w-2xl grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {PROMPT_CATEGORIES.map((cat) => (
                <div key={cat.label} className="rounded-xl border border-border/60 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</p>
                  </div>
                  <div className="space-y-1">
                    {cat.prompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-foreground/80 hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "" : "flex gap-3"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center shrink-0 mt-1">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <div
                      className={`rounded-xl text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground px-4 py-3"
                          : "bg-muted/50 px-5 py-4"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:leading-relaxed [&_li]:leading-relaxed [&_ul]:my-2 [&_ol]:my-2 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_p+p]:mt-3">
                          <ReactMarkdown
                            components={{
                              h2: ({ children }) => {
                                const Icon = getScenarioIcon(String(children));
                                return (
                                  <h2 className="flex items-center gap-2 text-sm font-semibold mt-4 mb-2">
                                    <Icon className="h-4 w-4 text-primary shrink-0" />
                                    {children}
                                  </h2>
                                );
                              },
                              h3: ({ children }) => {
                                const Icon = getScenarioIcon(String(children));
                                return (
                                  <h3 className="flex items-center gap-2 text-sm font-semibold mt-3 mb-1.5">
                                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                                    {children}
                                  </h3>
                                );
                              },
                              li: ({ children }) => {
                                const text = String(children);
                                const Icon = getScenarioIcon(text);
                                return (
                                  <li className="flex items-start gap-2 my-1 list-none">
                                    <Icon className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                                    <span>{children}</span>
                                  </li>
                                );
                              },
                              blockquote: ({ children }) => (
                                <blockquote className="flex items-start gap-2 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg px-3 py-2 my-3 not-italic">
                                  <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                                  <div>{children}</div>
                                </blockquote>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-foreground">{children}</strong>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "assistant" && !isLoading && (
                      <div className="flex items-center gap-0.5 flex-wrap">
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
                        {/* Quick action buttons after last assistant message */}
                        {i === messages.length - 1 && (
                          <>
                            <span className="text-muted-foreground/30 mx-1">|</span>
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/50 rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-2xl mx-auto">
          {/* Quick suggestion chips when conversation is active */}
          {messages.length > 0 && !isLoading && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {["What else can I improve?", "Write me a follow-up message", "Give me a weekly summary"].map((q) => (
                <Badge
                  key={q}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted/60 transition-colors text-2xs"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setMessages([])}
                title="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Textarea
              ref={inputRef}
              placeholder="Ask for growth tips, content, performance analysis…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              className="min-h-[40px] max-h-[120px] resize-none"
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={!input.trim() || isLoading}
              onClick={() => sendMessage(input)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <AiCreditTopupDialog open={showTopup} onOpenChange={setShowTopup} />
    </div>
  );
}
