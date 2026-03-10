import { useState, useCallback } from "react";
import {
  Globe, Instagram, Facebook, Search, Loader2, Check, X,
  Sparkles, ArrowRight, ArrowLeft, Edit3, Image as ImageIcon,
  Download, Columns2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ScannedImage {
  url: string;
  alt: string;
  width?: number;
  selected: boolean;
  // AI-generated
  title?: string;
  description?: string;
  category?: string;
}

interface BeforeAfterPair {
  before_index: number;
  after_index: number;
  title: string;
}

interface PhotoImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profession: string;
  onImportComplete: (projects: ImportedProject[]) => void;
}

export interface ImportedProject {
  title: string;
  description: string;
  imageUrl: string;
  beforeImageUrl?: string;
  category: string;
}

type Step = "source" | "scanning" | "select" | "captioning" | "review" | "importing";

const SOURCE_PRESETS = [
  { icon: Globe, label: "Website URL", placeholder: "https://yourwebsite.com" },
  { icon: Instagram, label: "Instagram", placeholder: "https://instagram.com/yourbusiness" },
  { icon: Facebook, label: "Facebook", placeholder: "https://facebook.com/yourbusiness" },
  { icon: Search, label: "Google Business", placeholder: "https://google.com/maps/place/..." },
];

export default function PhotoImportDialog({
  open,
  onOpenChange,
  profession,
  onImportComplete,
}: PhotoImportDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("source");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<ScannedImage[]>([]);
  const [pairs, setPairs] = useState<BeforeAfterPair[]>([]);
  const [pageTitle, setPageTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const reset = useCallback(() => {
    setStep("source");
    setUrl("");
    setImages([]);
    setPairs([]);
    setPageTitle("");
    setError(null);
    setImportProgress(0);
    setEditingIdx(null);
  }, []);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  // Step 1: Scan URL
  const handleScan = async () => {
    if (!url.trim()) return;
    setStep("scanning");
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-photo-import", {
        body: { action: "scan", url: url.trim() },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const scanned = (data.images || []).map((img: any) => ({
        ...img,
        selected: true,
      }));

      if (scanned.length === 0) {
        setError("No images found on this page. Try a different URL.");
        setStep("source");
        return;
      }

      setImages(scanned);
      setPageTitle(data.pageTitle || "");
      setStep("select");
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err.message || "Failed to scan URL");
      setStep("source");
    }
  };

  // Step 2: Generate captions
  const handleGenerateCaptions = async () => {
    const selected = images.filter((img) => img.selected);
    if (selected.length === 0) {
      toast.error("Select at least one image");
      return;
    }

    setStep("captioning");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-photo-import", {
        body: {
          action: "caption",
          images: selected.map((img) => ({ url: img.url, alt: img.alt })),
          profession,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Apply captions to selected images
      const captions = data.captions || [];
      const updatedImages = images.map((img) => {
        if (!img.selected) return img;
        const selectedIdx = images.filter((i) => i.selected).indexOf(img);
        const caption = captions.find((c: any) => c.index === selectedIdx);
        if (caption) {
          return {
            ...img,
            title: caption.title,
            description: caption.description,
            category: caption.category,
          };
        }
        return img;
      });

      setImages(updatedImages);
      setPairs(data.before_after_pairs || []);
      setStep("review");
    } catch (err: any) {
      console.error("Caption error:", err);
      toast.error(err.message || "Failed to generate captions");
      setStep("select");
    }
  };

  // Step 3: Import selected images
  const handleImport = async () => {
    if (!user) return;
    const selected = images.filter((img) => img.selected);
    if (selected.length === 0) return;

    setStep("importing");
    setImportProgress(0);

    const projects: ImportedProject[] = [];

    for (let i = 0; i < selected.length; i++) {
      const img = selected[i];
      setImportProgress(Math.round(((i + 1) / selected.length) * 100));

      try {
        // Download image via edge function proxy
        const { data: dlData, error: dlError } = await supabase.functions.invoke("ai-photo-import", {
          body: { action: "download", imageUrl: img.url },
        });

        if (dlError || dlData?.error) {
          console.warn(`Failed to download image ${i}:`, dlError || dlData?.error);
          // Still add project with original URL
          projects.push({
            title: img.title || `Photo ${i + 1}`,
            description: img.description || "",
            imageUrl: img.url,
            category: img.category || "project",
          });
          continue;
        }

        // Upload to Supabase storage
        const base64Data = dlData.base64;
        const ext = dlData.contentType?.includes("png") ? "png" : "jpg";
        const fileName = `imported-${Date.now()}-${i}.${ext}`;
        const path = `${user.id}/gallery/${fileName}`;

        const res = await fetch(base64Data);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: dlData.contentType });

        const { error: uploadError } = await supabase.storage
          .from("card-assets")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          console.warn(`Upload failed for image ${i}:`, uploadError);
          projects.push({
            title: img.title || `Photo ${i + 1}`,
            description: img.description || "",
            imageUrl: img.url,
            category: img.category || "project",
          });
          continue;
        }

        const { data: urlData } = supabase.storage.from("card-assets").getPublicUrl(path);

        // Check if this image is part of a before/after pair
        const selectedIdx = images.filter((i2) => i2.selected).indexOf(img);
        const pair = pairs.find(
          (p) => p.after_index === selectedIdx || p.before_index === selectedIdx
        );

        if (pair && pair.after_index === selectedIdx) {
          // This is the "after" image — find the before image
          const beforeImg = selected[pair.before_index];
          projects.push({
            title: pair.title || img.title || `Before & After ${i + 1}`,
            description: img.description || "",
            imageUrl: urlData.publicUrl,
            beforeImageUrl: beforeImg?.url,
            category: "project",
          });
        } else if (pair && pair.before_index === selectedIdx) {
          // Skip — will be handled when processing the "after" image
          continue;
        } else {
          projects.push({
            title: img.title || `Photo ${i + 1}`,
            description: img.description || "",
            imageUrl: urlData.publicUrl,
            category: img.category || "project",
          });
        }
      } catch (err) {
        console.warn(`Error processing image ${i}:`, err);
      }
    }

    onImportComplete(projects);
    toast.success(`${projects.length} photos imported to your gallery!`);
    handleClose();
  };

  const toggleImage = (idx: number) => {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, selected: !img.selected } : img))
    );
  };

  const selectedCount = images.filter((img) => img.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Photo Import
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── Source Input ── */}
          {step === "source" && (
            <motion.div
              key="source"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Paste a link to your website or social profile to import photos automatically.
              </p>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Paste your URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://yourwebsite.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  />
                  <Button onClick={handleScan} disabled={!url.trim()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick sources</p>
                <div className="grid grid-cols-2 gap-2">
                  {SOURCE_PRESETS.map((src) => (
                    <button
                      key={src.label}
                      onClick={() => setUrl(src.placeholder)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                    >
                      <src.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">{src.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Scanning ── */}
          {step === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Search className="h-7 w-7 text-primary-foreground" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">Scanning for images...</p>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs mx-auto">{url}</p>
              </div>
            </motion.div>
          )}

          {/* ── Image Selection ── */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 flex flex-col min-h-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Found {images.length} images
                    {pageTitle && <span className="text-muted-foreground"> from {pageTitle}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedCount} selected</p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setImages((prev) => prev.map((img) => ({ ...img, selected: true })))}
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setImages((prev) => prev.map((img) => ({ ...img, selected: false })))}
                  >
                    None
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[340px] pr-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleImage(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      img.selected
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-transparent opacity-50 hover:opacity-75"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {img.selected && (
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => { setStep("source"); setImages([]); }} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleGenerateCaptions} disabled={selectedCount === 0} className="flex-1">
                  <Sparkles className="h-4 w-4 mr-1" /> Generate Captions
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Captioning ── */}
          {step === "captioning" && (
            <motion.div
              key="captioning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">AI is writing captions...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyzing {selectedCount} images for your {profession} card
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Review & Edit ── */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 flex flex-col min-h-0"
            >
              <div>
                <p className="text-sm font-medium">Review your gallery</p>
                <p className="text-xs text-muted-foreground">
                  Edit titles and descriptions, or remove photos before importing.
                  {pairs.length > 0 && (
                    <span className="text-primary font-medium ml-1">
                      {pairs.length} before/after pair{pairs.length > 1 ? "s" : ""} detected!
                    </span>
                  )}
                </p>
              </div>

              <div className="overflow-y-auto max-h-[340px] space-y-2 pr-1">
                {images
                  .filter((img) => img.selected)
                  .map((img, displayIdx) => {
                    const realIdx = images.indexOf(img);
                    const isPair = pairs.some(
                      (p) => p.before_index === displayIdx || p.after_index === displayIdx
                    );

                    return (
                      <div
                        key={realIdx}
                        className={`flex gap-3 p-2 rounded-lg border transition-all ${
                          isPair ? "border-accent/40 bg-accent/5" : "border-border"
                        }`}
                      >
                        <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0">
                          <img
                            src={img.url}
                            alt={img.title || ""}
                            className="h-full w-full object-cover"
                          />
                          {isPair && (
                            <div className="absolute bottom-0 inset-x-0 bg-accent text-accent-foreground text-[8px] text-center py-0.5 font-semibold">
                              <Columns2 className="h-2.5 w-2.5 inline mr-0.5" />
                              B/A
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          {editingIdx === realIdx ? (
                            <div className="space-y-1">
                              <Input
                                value={img.title || ""}
                                onChange={(e) =>
                                  setImages((prev) =>
                                    prev.map((im, i) =>
                                      i === realIdx ? { ...im, title: e.target.value } : im
                                    )
                                  )
                                }
                                className="h-7 text-xs"
                                placeholder="Title"
                              />
                              <Input
                                value={img.description || ""}
                                onChange={(e) =>
                                  setImages((prev) =>
                                    prev.map((im, i) =>
                                      i === realIdx ? { ...im, description: e.target.value } : im
                                    )
                                  )
                                }
                                className="h-7 text-xs"
                                placeholder="Description"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px]"
                                onClick={() => setEditingIdx(null)}
                              >
                                Done
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs font-medium truncate">{img.title || "Untitled"}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {img.description || "No description"}
                              </p>
                              <div className="flex items-center gap-1">
                                {img.category && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                                    {img.category}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => setEditingIdx(editingIdx === realIdx ? null : realIdx)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => toggleImage(realIdx)}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep("select")} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleImport} disabled={selectedCount === 0} className="flex-1">
                  <Download className="h-4 w-4 mr-1" /> Import {selectedCount} Photos
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Importing ── */}
          {step === "importing" && (
            <motion.div
              key="importing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center space-y-4"
            >
              <div className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <Download className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Importing photos...</p>
                <p className="text-xs text-muted-foreground mt-1">Optimizing for your card gallery</p>
              </div>
              <div className="w-48 mx-auto h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${importProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{importProgress}%</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
