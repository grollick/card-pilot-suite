import { useState, useCallback } from "react";
import {
  Globe, Instagram, Facebook, Search, Loader2, Check, X,
  Sparkles, ArrowRight, Download, AlertCircle, Link2,
  MapPin, Phone, Mail, Image as ImageIcon, FileText, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";

interface ExtractedContent {
  businessName?: string;
  tagline?: string;
  description?: string;
  services?: { name: string; description?: string }[];
  socialLinks?: { platform: string; url: string }[];
  phone?: string;
  email?: string;
  location?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
}

interface ScannedImage {
  url: string;
  alt: string;
}

export interface ImportResult {
  businessName?: string;
  tagline?: string;
  description?: string;
  services?: { name: string; description?: string }[];
  socialLinks?: { platform: string; url: string }[];
  phone?: string;
  email?: string;
  location?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  galleryImages?: string[];
}

interface ContentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (result: ImportResult) => void;
}

type Step = "input" | "scanning" | "preview" | "importing";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  tiktok: <span className="text-xs font-bold">TT</span>,
  website: <Globe className="h-4 w-4" />,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  website: "Website",
};

export default function ContentImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ContentImportDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedContent | null>(null);
  const [images, setImages] = useState<ScannedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [importSections, setImportSections] = useState({
    businessInfo: true,
    description: true,
    services: true,
    socialLinks: true,
    images: true,
  });

  const reset = useCallback(() => {
    setStep("input");
    setUrl("");
    setError(null);
    setPlatform(null);
    setExtracted(null);
    setImages([]);
    setSelectedImages(new Set());
    setImportSections({ businessInfo: true, description: true, services: true, socialLinks: true, images: true });
  }, []);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    setStep("scanning");
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("content-import", {
        body: { url: url.trim() },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setPlatform(data.platform);
      setExtracted(data.extracted || {});
      setImages(data.images || []);
      // Auto-select first 6 images
      setSelectedImages(new Set(Array.from({ length: Math.min(6, (data.images || []).length) }, (_, i) => i)));
      setStep("preview");
    } catch (err: any) {
      console.error("Content import scan error:", err);
      setError(err.message || "Failed to scan URL. Try a different link.");
      setStep("input");
    }
  };

  const handleImport = async () => {
    if (!user || !extracted) return;
    setStep("importing");

    try {
      const result: ImportResult = {};

      if (importSections.businessInfo) {
        result.businessName = extracted.businessName;
        result.phone = extracted.phone;
        result.email = extracted.email;
        result.location = extracted.location;
        result.profileImageUrl = extracted.profileImageUrl;
        result.coverImageUrl = extracted.coverImageUrl;
      }
      if (importSections.description) {
        result.tagline = extracted.tagline;
        result.description = extracted.description;
      }
      if (importSections.services && extracted.services?.length) {
        result.services = extracted.services;
      }
      if (importSections.socialLinks && extracted.socialLinks?.length) {
        result.socialLinks = extracted.socialLinks;
      }
      if (importSections.images && selectedImages.size > 0) {
        // Download and upload selected images
        const galleryUrls: string[] = [];
        for (const idx of selectedImages) {
          const img = images[idx];
          if (!img) continue;
          try {
            const { data: dlData, error: dlError } = await supabase.functions.invoke("ai-photo-import", {
              body: { action: "download", imageUrl: img.url },
            });
            if (dlError || dlData?.error) {
              galleryUrls.push(img.url); // fallback to original URL
              continue;
            }
            const ext = dlData.contentType?.includes("png") ? "png" : "jpg";
            const fileName = `imported-${Date.now()}-${idx}.${ext}`;
            const path = `${user.id}/gallery/${fileName}`;
            const res = await fetch(dlData.base64);
            const blob = await res.blob();
            const file = new File([blob], fileName, { type: dlData.contentType });
            const { error: uploadError } = await supabase.storage
              .from("card-assets")
              .upload(path, file, { upsert: true });
            if (uploadError) {
              galleryUrls.push(img.url);
              continue;
            }
            const { data: urlData } = supabase.storage.from("card-assets").getPublicUrl(path);
            galleryUrls.push(urlData.publicUrl);
          } catch {
            galleryUrls.push(img.url);
          }
        }
        result.galleryImages = galleryUrls;
      }

      onImportComplete(result);
      toast.success("Content imported successfully!");
      handleClose();
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error("Failed to import content");
      setStep("preview");
    }
  };

  const toggleImage = (idx: number) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const hasContent = extracted && (
    extracted.businessName || extracted.description || extracted.services?.length || extracted.socialLinks?.length
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Import Content
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── URL Input ── */}
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste a link to your website or social profile. We'll extract your business info, images, and content automatically.
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Paste any link..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  className="flex-1"
                />
                <Button onClick={handleScan} disabled={!url.trim()}>
                  <Search className="h-4 w-4 mr-1" /> Scan
                </Button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Supported sources</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["instagram", "facebook", "tiktok", "website"] as const).map((p) => (
                    <div key={p} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border text-sm text-muted-foreground">
                      {PLATFORM_ICONS[p]}
                      <span className="text-xs font-medium">{PLATFORM_LABELS[p]}</span>
                      {p === "tiktok" && <span className="ml-auto text-[10px] text-muted-foreground/60">Preview</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-primary/80">AI will auto-detect the platform and extract relevant content</p>
              </div>
            </motion.div>
          )}

          {/* ── Scanning ── */}
          {step === "scanning" && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Search className="h-7 w-7 text-primary-foreground" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">Scanning & extracting content...</p>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs mx-auto">{url}</p>
              </div>
            </motion.div>
          )}

          {/* ── Preview ── */}
          {step === "preview" && extracted && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              {/* Platform badge */}
              {platform && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {PLATFORM_ICONS[platform]}
                  <span className="font-medium">{PLATFORM_LABELS[platform]}</span>
                  <span>•</span>
                  <span className="truncate">{url}</span>
                </div>
              )}

              {!hasContent && images.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No content could be extracted. Try a different URL.
                </div>
              )}

              {/* Business Info */}
              {(extracted.businessName || extracted.phone || extracted.email || extracted.location) && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4 text-primary" />
                      Business Info
                    </div>
                    <Checkbox
                      checked={importSections.businessInfo}
                      onCheckedChange={(v) => setImportSections(prev => ({ ...prev, businessInfo: !!v }))}
                    />
                  </div>
                  {extracted.businessName && <p className="text-sm font-semibold">{extracted.businessName}</p>}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {extracted.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{extracted.location}</span>}
                    {extracted.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{extracted.phone}</span>}
                    {extracted.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{extracted.email}</span>}
                  </div>
                </div>
              )}

              {/* Description */}
              {(extracted.tagline || extracted.description) && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      Description
                    </div>
                    <Checkbox
                      checked={importSections.description}
                      onCheckedChange={(v) => setImportSections(prev => ({ ...prev, description: !!v }))}
                    />
                  </div>
                  {extracted.tagline && <p className="text-sm font-medium text-foreground">{extracted.tagline}</p>}
                  {extracted.description && <p className="text-xs text-muted-foreground">{extracted.description}</p>}
                </div>
              )}

              {/* Services */}
              {extracted.services && extracted.services.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Services ({extracted.services.length})
                    </div>
                    <Checkbox
                      checked={importSections.services}
                      onCheckedChange={(v) => setImportSections(prev => ({ ...prev, services: !!v }))}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extracted.services.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-muted text-xs font-medium">{s.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {extracted.socialLinks && extracted.socialLinks.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link2 className="h-4 w-4 text-primary" />
                      Social Links ({extracted.socialLinks.length})
                    </div>
                    <Checkbox
                      checked={importSections.socialLinks}
                      onCheckedChange={(v) => setImportSections(prev => ({ ...prev, socialLinks: !!v }))}
                    />
                  </div>
                  <div className="space-y-1">
                    {extracted.socialLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{link.platform}</span>
                        <span className="truncate">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      Images ({images.length})
                    </div>
                    <Checkbox
                      checked={importSections.images}
                      onCheckedChange={(v) => setImportSections(prev => ({ ...prev, images: !!v }))}
                    />
                  </div>
                  {importSections.images && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {images.slice(0, 12).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => toggleImage(idx)}
                          className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                            selectedImages.has(idx)
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-transparent opacity-50 hover:opacity-75"
                          }`}
                        >
                          <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          {selectedImages.has(idx) && (
                            <div className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1 sticky bottom-0 bg-card pb-1">
                <Button variant="outline" onClick={() => { setStep("input"); setExtracted(null); setImages([]); }} className="flex-1">
                  Try different URL
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!Object.values(importSections).some(Boolean)}
                  className="flex-1 gap-1"
                >
                  <Download className="h-4 w-4" />
                  Import Selected
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Importing ── */}
          {step === "importing" && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center space-y-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Download className="h-7 w-7 text-primary-foreground" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">Importing content to your card...</p>
                <p className="text-xs text-muted-foreground mt-1">Downloading images and mapping content</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
