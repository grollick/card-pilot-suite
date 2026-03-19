import { useState } from "react";
import { Sparkles, Image, RefreshCw, Check, Copy, Hash, ArrowRight, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CanvasElement, PostTemplate } from "../../data/postTemplates";

interface ContentSuggestion {
  caption: string;
  hashtags: string[];
  cta: string;
  headline: string;
  subheadline: string;
  alternativeHeadlines?: string[];
}

interface ImageSuggestion {
  url: string;
  query: string;
  description: string;
}

interface Props {
  currentTemplate: PostTemplate | null;
  elements: CanvasElement[];
  onApplyHeadline: (text: string) => void;
  onApplySubheadline: (text: string) => void;
  onApplyCta: (text: string) => void;
  onApplyImage: (url: string, elementId?: string) => void;
}

export default function AiSuggestionsPanel({
  currentTemplate, elements, onApplyHeadline, onApplySubheadline, onApplyCta, onApplyImage,
}: Props) {
  const [content, setContent] = useState<ContentSuggestion | null>(null);
  const [images, setImages] = useState<ImageSuggestion[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const existingTexts = elements
    .filter((e) => e.type === "text" || e.type === "badge")
    .map((e) => e.text || e.badgeText || "")
    .filter(Boolean);

  const fetchContent = async () => {
    if (!currentTemplate) {
      toast.error("Select a template first");
      return;
    }
    setLoadingContent(true);
    try {
      const { data, error } = await supabase.functions.invoke("post-ai-assist", {
        body: {
          action: "suggest_content",
          templateName: currentTemplate.name,
          profession: currentTemplate.profession,
          category: currentTemplate.category,
          format: currentTemplate.format,
          existingTexts,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data);
      toast.success("AI suggestions ready!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate suggestions");
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchImages = async () => {
    if (!currentTemplate) {
      toast.error("Select a template first");
      return;
    }
    setLoadingImages(true);
    try {
      const { data, error } = await supabase.functions.invoke("post-ai-assist", {
        body: {
          action: "find_images",
          templateName: currentTemplate.name,
          profession: currentTemplate.profession,
          category: currentTemplate.category,
          format: currentTemplate.format,
          existingTexts,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setImages(data.images || []);
      toast.success("Image suggestions ready!");
    } catch (e: any) {
      toast.error(e.message || "Failed to find images");
    } finally {
      setLoadingImages(false);
    }
  };

  const copyCaption = () => {
    if (!content) return;
    const fullCaption = `${content.caption}\n\n${content.hashtags.map((h) => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(fullCaption);
    setCopiedCaption(true);
    toast.success("Caption & hashtags copied!");
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Find the first image element to apply to
  const firstImageEl = elements.find((e) => e.type === "image");

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Assistant
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {currentTemplate
            ? `Suggestions for "${currentTemplate.name}"`
            : "Select a template to get AI suggestions"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Generate buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={fetchContent}
              disabled={loadingContent || !currentTemplate}
            >
              {loadingContent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              AI Content
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={fetchImages}
              disabled={loadingImages || !currentTemplate}
            >
              {loadingImages ? <Loader2 className="h-3 w-3 animate-spin" /> : <Image className="h-3 w-3" />}
              Find Photos
            </Button>
          </div>

          {/* Content suggestions */}
          {content && (
            <div className="space-y-3">
              <Separator />

              {/* Caption */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Caption</span>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] gap-1" onClick={copyCaption}>
                    {copiedCaption ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                    {copiedCaption ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs bg-muted/50 rounded-md p-2 leading-relaxed">{content.caption}</p>
              </div>

              {/* Hashtags */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                  <Hash className="h-2.5 w-2.5" /> Hashtags
                </span>
                <div className="flex flex-wrap gap-1">
                  {content.hashtags.map((h) => (
                    <Badge key={h} variant="secondary" className="text-[10px] h-5 cursor-pointer hover:bg-primary/20" onClick={() => {
                      navigator.clipboard.writeText(`#${h}`);
                      toast.success(`Copied #${h}`);
                    }}>
                      #{h}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Headline suggestion */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Headline</span>
                <button
                  onClick={() => onApplyHeadline(content.headline)}
                  className="w-full text-left text-xs bg-muted/50 rounded-md p-2 hover:bg-primary/10 hover:ring-1 hover:ring-primary/30 transition-all flex items-center justify-between group"
                >
                  <span>{content.headline}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                </button>
                {content.alternativeHeadlines?.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => onApplyHeadline(alt)}
                    className="w-full text-left text-xs bg-muted/30 rounded-md p-2 hover:bg-primary/10 hover:ring-1 hover:ring-primary/30 transition-all flex items-center justify-between group"
                  >
                    <span className="text-muted-foreground">{alt}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {/* Subheadline */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Subheadline</span>
                <button
                  onClick={() => onApplySubheadline(content.subheadline)}
                  className="w-full text-left text-xs bg-muted/50 rounded-md p-2 hover:bg-primary/10 hover:ring-1 hover:ring-primary/30 transition-all flex items-center justify-between group"
                >
                  <span>{content.subheadline}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                </button>
              </div>

              {/* CTA */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">CTA Button</span>
                <button
                  onClick={() => onApplyCta(content.cta)}
                  className="w-full text-left text-xs bg-primary/10 border border-primary/20 rounded-md p-2 hover:bg-primary/20 transition-all flex items-center justify-between group font-medium"
                >
                  <span>{content.cta}</span>
                  <ArrowRight className="h-3 w-3 text-primary shrink-0 ml-2" />
                </button>
              </div>

              <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1.5 text-muted-foreground" onClick={fetchContent} disabled={loadingContent}>
                <RefreshCw className={`h-3 w-3 ${loadingContent ? "animate-spin" : ""}`} /> Regenerate
              </Button>
            </div>
          )}

          {/* Image suggestions */}
          {images.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                <Image className="h-2.5 w-2.5" /> Suggested Photos
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => onApplyImage(img.url, firstImageEl?.id)}
                    className="relative rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/50 transition-all group aspect-[4/3]"
                  >
                    <img
                      src={img.url}
                      alt={img.description}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Use Photo
                      </span>
                    </div>
                    <p className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white p-1 truncate">
                      {img.description}
                    </p>
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1.5 text-muted-foreground" onClick={fetchImages} disabled={loadingImages}>
                <RefreshCw className={`h-3 w-3 ${loadingImages ? "animate-spin" : ""}`} /> More Photos
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!content && images.length === 0 && !loadingContent && !loadingImages && (
            <div className="text-center py-6 space-y-2">
              <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">
                Click <strong>AI Content</strong> to generate captions, hashtags & copy.
              </p>
              <p className="text-xs text-muted-foreground">
                Click <strong>Find Photos</strong> to get matching stock images.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
