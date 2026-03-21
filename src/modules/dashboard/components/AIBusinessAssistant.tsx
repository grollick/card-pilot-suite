import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, MessageSquare, FileText, Lightbulb,
  Loader2, X, Minimize2, Maximize2, RotateCcw, Copy, Check,
  Wand2, ClipboardCheck, ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "chat" | "template" | "tips";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-assistant`;

const modeConfig: Record<Mode, { label: string; icon: typeof Sparkles; color: string; placeholder: string }> = {
  chat: {
    label: "Chat",
    icon: MessageSquare,
    color: "text-primary",
    placeholder: "Ask me anything about your business...",
  },
  template: {
    label: "Templates",
    icon: FileText,
    color: "text-[hsl(var(--success))]",
    placeholder: "e.g. Write a follow-up message for a new lead...",
  },
  tips: {
    label: "Tips",
    icon: Lightbulb,
    color: "text-[hsl(var(--warning))]",
    placeholder: "e.g. How do I get more reviews?",
  },
};

const quickPrompts: { label: string; prompt: string; mode: Mode }[] = [
  { label: "Write a follow-up message", prompt: "Write a professional follow-up message for a lead who inquired but hasn't booked yet.", mode: "template" },
  { label: "Service description", prompt: "Write a compelling service description for my main offering.", mode: "template" },
  { label: "Get more leads", prompt: "Give me 5 actionable tips to get more leads this week.", mode: "tips" },
  { label: "Quote template", prompt: "Create a professional quote/estimate message template I can send to customers.", mode: "template" },
];

// Parse action blocks from AI responses: <!--ACTION:type:label-->
interface ParsedAction {
  type: "apply_bio" | "apply_tagline" | "copy" | "create_task";
  label: string;
  content: string; // the AI response content to act on
}

function parseActions(content: string): ParsedAction[] {
  const actions: ParsedAction[] = [];
  const regex = /<!--ACTION:(\w+):(.+?)-->/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    actions.push({
      type: match[1] as ParsedAction["type"],
      label: match[2],
      content,
    });
  }
  return actions;
}

function stripActionTags(content: string): string {
  return content.replace(/<!--ACTION:\w+:.+?-->/g, "").trim();
}

async function streamChat({
  messages,
  mode,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  mode: Mode;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, mode }),
  });

  if (!resp.ok) {
    let errorMsg = "Something went wrong. Please try again.";
    try {
      const err = await resp.json();
      errorMsg = err.error || errorMsg;
    } catch {}
    onError(errorMsg);
    return;
  }

  if (!resp.body) {
    onError("No response received.");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }

      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

function ActionButtons({
  actions,
  content,
  onAction,
  isExecuting,
}: {
  actions: ParsedAction[];
  content: string;
  onAction: (action: ParsedAction) => void;
  isExecuting: string | null;
}) {
  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-1.5 mt-2"
    >
      {actions.map((action, i) => {
        const isRunning = isExecuting === `${action.type}-${i}`;
        const Icon = action.type === "apply_bio" || action.type === "apply_tagline"
          ? Wand2
          : action.type === "copy"
          ? ClipboardCheck
          : ListTodo;

        return (
          <button
            key={i}
            onClick={() => onAction({ ...action, content })}
            disabled={!!isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-all disabled:opacity-50 border border-primary/20"
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Icon className="h-3 w-3" />
            )}
            {action.label}
          </button>
        );
      })}
    </motion.div>
  );
}

// "Do this for me" generic button when no structured actions are detected
function DoThisForMeButton({
  onDoThis,
  isLoading,
}: {
  onDoThis: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-2"
    >
      <button
        onClick={onDoThis}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-all disabled:opacity-50 border border-primary/20"
      >
        <Wand2 className="h-3 w-3" />
        Want me to do this for you?
      </button>
    </motion.div>
  );
}

export default function AIBusinessAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: Msg = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        mode,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          toast.error(msg);
          setIsLoading(false);
        },
      });
    } catch {
      toast.error("Failed to connect. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAction = async (action: ParsedAction, msgIndex: number) => {
    if (!user) return;
    const key = `${action.type}-${msgIndex}`;
    setExecutingAction(key);

    try {
      const cleanContent = stripActionTags(action.content);

      switch (action.type) {
        case "apply_bio": {
          // Extract the bio text — take the first substantial paragraph
          const lines = cleanContent.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("<!--"));
          const bioText = lines.join("\n").slice(0, 500);
          const { error } = await supabase.from("profiles").update({ bio: bioText }).eq("id", user.id);
          if (error) throw error;
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["public-card"] });
          toast.success("Bio updated! Check your card.");
          break;
        }
        case "apply_tagline": {
          const lines = cleanContent.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("<!--"));
          const taglineText = lines[0]?.replace(/^[*_"]+|[*_"]+$/g, "").slice(0, 120) || "";
          // Save tagline to card theme_json
          const { data: card } = await supabase.from("cards").select("id, theme_json").eq("user_id", user.id).maybeSingle();
          if (card) {
            const themeJson = typeof card.theme_json === "object" && card.theme_json ? card.theme_json : {};
            await supabase.from("cards").update({
              theme_json: { ...themeJson, tagline: taglineText },
            }).eq("id", card.id);
          }
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["public-card"] });
          toast.success("Tagline updated!");
          break;
        }
        case "copy": {
          await navigator.clipboard.writeText(cleanContent);
          toast.success("Copied to clipboard!");
          break;
        }
        case "create_task": {
          // Extract task items from the content
          const taskLines = cleanContent.split("\n")
            .filter(l => /^\d+[\.\)]\s/.test(l.trim()) || /^[-*]\s/.test(l.trim()))
            .map(l => l.replace(/^[\d\.\)\-*\s]+/, "").trim())
            .filter(Boolean)
            .slice(0, 5);

          if (taskLines.length === 0) {
            toast.info("No actionable items found to create tasks from.");
            break;
          }

          for (const title of taskLines) {
            await supabase.from("contact_activities").insert({
              user_id: user.id,
              lead_id: null as any,
              activity_type: "task",
              title: title.slice(0, 200),
              description: "Created by AI Assistant",
              occurred_at: new Date().toISOString(),
            });
          }
          toast.success(`${taskLines.length} task${taskLines.length > 1 ? "s" : ""} created!`);
          break;
        }
      }

      setCompletedActions(prev => new Set([...prev, msgIndex]));
    } catch (err: any) {
      toast.error(err.message || "Failed to apply action");
    } finally {
      setExecutingAction(null);
    }
  };

  const handleDoThisForMe = (msgIndex: number) => {
    handleSend("Yes, please do this for me. Apply the changes you suggested.");
  };

  const handleQuickPrompt = (qp: typeof quickPrompts[0]) => {
    setMode(qp.mode);
    handleSend(qp.prompt);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setCompletedActions(new Set());
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:shadow-xl hover:shadow-primary/30 transition-shadow"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>
    );
  }

  const panelHeight = isExpanded ? "h-[600px]" : "h-[440px]";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className={`fixed bottom-6 right-6 z-50 w-[380px] ${panelHeight} rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Content, tips & messaging</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="New chat">
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" /> : <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-border">
          {(Object.keys(modeConfig) as Mode[]).map(m => {
            const cfg = modeConfig[m];
            const Icon = cfg.icon;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === m
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-3 w-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center py-2">
                {mode === "chat" && "Ask me anything about growing your business."}
                {mode === "template" && "I'll create ready-to-use templates for you."}
                {mode === "tips" && "Get actionable tips tailored to your trade."}
              </p>
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Quick start</p>
                {quickPrompts
                  .filter(qp => qp.mode === mode || mode === "chat")
                  .slice(0, 3)
                  .map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickPrompt(qp)}
                      className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-xs"
                    >
                      {qp.label}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const actions = msg.role === "assistant" ? parseActions(msg.content) : [];
              const displayContent = msg.role === "assistant" ? stripActionTags(msg.content) : msg.content;
              const isLastAssistant = msg.role === "assistant" && !isLoading && i === messages.length - 1;
              const hasActions = actions.length > 0;
              const isCompleted = completedActions.has(i);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group ${msg.role === "user" ? "flex justify-end" : ""}`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2 text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[95%] relative">
                      <div className="absolute -top-1 right-0">
                        <CopyButton text={displayContent} />
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_p]:mb-1.5 [&_li]:mb-0.5 [&_ul]:mb-1.5 [&_ol]:mb-1.5 [&_h3]:text-sm [&_h3]:mt-2">
                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                      </div>

                      {/* Action buttons */}
                      {isCompleted ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-1.5 mt-2 text-[11px] text-[hsl(var(--success))] font-medium"
                        >
                          <Check className="h-3 w-3" />
                          Done! Changes applied.
                        </motion.div>
                      ) : hasActions ? (
                        <ActionButtons
                          actions={actions}
                          content={msg.content}
                          onAction={(action) => handleAction(action, i)}
                          isExecuting={executingAction}
                        />
                      ) : isLastAssistant && displayContent.length > 50 ? (
                        <DoThisForMeButton
                          onDoThis={() => handleDoThisForMe(i)}
                          isLoading={isLoading}
                        />
                      ) : null}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs">Thinking...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-3 py-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={modeConfig[mode].placeholder}
              className="min-h-[40px] max-h-[100px] resize-none text-sm rounded-xl"
              rows={1}
            />
            <Button
              size="sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0 rounded-xl p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
