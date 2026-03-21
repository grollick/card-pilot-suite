import { useState, useRef, useEffect } from "react";
import {
  Camera, Sparkles, FileText, DollarSign, Lightbulb, ArrowRight,
  Loader2, Copy, RotateCcw, X, ImagePlus, Trash2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import { aiMarkdownComponents } from "@/components/AIResponseRenderer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TechAssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string;
  jobTitle?: string;
  jobType?: string;
  existingNotes?: string;
  onApplyNotes?: (notes: string) => void;
}

type AssistAction = "analyze_photos" | "clean_notes" | "draft_estimate" | "suggest_services" | "follow_up";

const ACTIONS: { key: AssistAction; label: string; icon: typeof Camera; description: string }[] = [
  { key: "analyze_photos", label: "Analyze Photos", icon: Camera, description: "Upload site photos for AI analysis" },
  { key: "clean_notes", label: "Clean Up Notes", icon: FileText, description: "Turn rough notes into professional summary" },
  { key: "draft_estimate", label: "Draft Estimate", icon: DollarSign, description: "Generate estimate from photos & notes" },
  { key: "suggest_services", label: "Suggest Services", icon: Lightbulb, description: "Get upsell & follow-up ideas" },
  { key: "follow_up", label: "Next Actions", icon: ArrowRight, description: "Recommended follow-up steps" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tech-assist`;

export default function TechAssistantSheet({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  jobType,
  existingNotes,
  onApplyNotes,
}: TechAssistantSheetProps) {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<AssistAction | null>(null);
  const [notes, setNotes] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result]);

  useEffect(() => {
    if (open) {
      setSelectedAction(null);
      setResult("");
      setNotes(existingNotes || "");
      setPhotoFiles([]);
      setPhotoPreviews([]);
    }
  }, [open, existingNotes]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setPhotoFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user || photoFiles.length === 0) return [];
    const urls: string[] = [];
    for (const file of photoFiles) {
      const path = `tech-assist/${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("card-assets").upload(path, file, { contentType: file.type });
      if (error) {
        console.error("Upload error:", error);
        continue;
      }
      const { data } = supabase.storage.from("card-assets").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const runAssist = async () => {
    if (!selectedAction) return;
    setIsLoading(true);
    setResult("");

    try {
      let photo_urls: string[] = [];
      if (photoFiles.length > 0) {
        toast.info("Uploading photos...");
        photo_urls = await uploadPhotos();
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use the assistant");
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: selectedAction,
          job_id: jobId,
          notes: notes.trim() || undefined,
          photo_urls: photo_urls.length > 0 ? photo_urls : undefined,
          service_type: jobType,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
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
              fullText += content;
              setResult(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
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
              fullText += content;
              setResult(fullText);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      console.error("Tech assist error:", err);
      setResult(`Sorry, something went wrong: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  const handleApplyNotes = () => {
    if (onApplyNotes && result) {
      onApplyNotes(result);
      toast.success("Notes applied to job");
      onOpenChange(false);
    }
  };

  const needsPhotos = selectedAction === "analyze_photos" || selectedAction === "draft_estimate";
  const needsNotes = selectedAction === "clean_notes" || selectedAction === "draft_estimate" || selectedAction === "suggest_services" || selectedAction === "follow_up";

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoAdd} />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90dvh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Job Assistant
              {jobTitle && <span className="text-xs text-muted-foreground font-normal truncate">· {jobTitle}</span>}
            </SheetTitle>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Action Selection */}
            {!selectedAction && !result && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">What do you need help with?</p>
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.key}
                      onClick={() => setSelectedAction(a.key)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{a.label}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input Phase */}
            {selectedAction && !result && !isLoading && (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => setSelectedAction(null)}>
                  ← Back
                </Button>

                <h3 className="font-semibold text-sm">
                  {ACTIONS.find(a => a.key === selectedAction)?.label}
                </h3>

                {/* Photo Upload */}
                {needsPhotos && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Upload job-site photos</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-14 gap-2"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <Camera className="h-5 w-5" /> Take Photo
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-14 gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-5 w-5" /> Gallery
                      </Button>
                    </div>
                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photoPreviews.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removePhoto(i)}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Input */}
                {needsNotes && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {selectedAction === "clean_notes" ? "Enter your rough notes" : "Add context (optional)"}
                    </p>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. customer wants patio fixed, weeds heavy, wants quote for mulch too"
                      rows={4}
                      className="text-base"
                    />
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full h-14 text-base gap-2"
                  onClick={runAssist}
                  disabled={
                    (selectedAction === "clean_notes" && !notes.trim()) ||
                    (selectedAction === "analyze_photos" && photoFiles.length === 0)
                  }
                >
                  <Sparkles className="h-5 w-5" />
                  Generate
                </Button>
              </div>
            )}

            {/* Loading */}
            {isLoading && !result && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing...</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-gradient-to-b from-card via-card/95 to-card/85 border border-border/30 px-5 sm:px-8 py-6 sm:py-8 shadow-xl ring-1 ring-white/5 backdrop-blur-sm">
                  <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:pl-0 [&_ol]:pl-0 [&_li+li]:mt-1">
                    <ReactMarkdown components={aiMarkdownComponents}>{result}</ReactMarkdown>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          {result && !isLoading && (
            <div className="border-t border-border px-4 py-3 shrink-0 space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-12 gap-2" onClick={handleCopy}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button variant="outline" className="flex-1 h-12 gap-2" onClick={() => { setResult(""); }}>
                  <RotateCcw className="h-4 w-4" /> Regenerate
                </Button>
              </div>
              {selectedAction === "clean_notes" && onApplyNotes && (
                <Button className="w-full h-12 gap-2" onClick={handleApplyNotes}>
                  <CheckCircle2 className="h-4 w-4" /> Apply as Job Notes
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
