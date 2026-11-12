import { useState } from "react";
import { X, Plus, Trash2, GripVertical, Wand2, Loader2 } from "lucide-react";
import { getSavedCalcPreset, type CalcPreset } from "./QuoteCalculator";
import { buildPresetFromRows, rowsFromPreset, validatePriceRow, isPricedRow, MAX_PRICE_ROWS, DEFAULT_PRICE_NOTE, type PriceRow } from "@/modules/card/lib/priceList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SectionContent {
  // About
  text?: string;
  // Services
  items?: { name: string; description?: string; price?: string }[];
  // Testimonials
  testimonials?: { name: string; text: string; role?: string }[];
  // Gallery
  images?: { url: string; caption?: string }[];
  // Social
  links?: { platform: string; url: string }[];
  // Hero
  tagline?: string;
  subtitle?: string;
  // Contact
  heading?: string;
  description?: string;
  // Booking
  bookingHeading?: string;
  // Projects
  projectsHeading?: string;
  projectsDescription?: string;
  showBeforeAfter?: boolean;
  // Quote Calculator
  calcHeading?: string;
  calcPresetId?: string;
  calcDisclaimer?: string;
  calcPriceRows?: PriceRow[];
  calcCustomPreset?: CalcPreset | null;
  // Video Introduction
  videoUrl?: string;
  videoHeading?: string;
  videoCaption?: string;
  videoAutoplay?: boolean;
}

interface SectionEditorProps {
  sectionId: string;
  sectionLabel: string;
  content: SectionContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: SectionContent) => void;
  profession?: string;
  userName?: string;
  company?: string;
  sectionEnabled?: boolean;
}

const SOCIAL_PLATFORMS = [
  "Instagram", "Facebook", "Twitter/X", "LinkedIn", "TikTok", "YouTube", "Snapchat", "Pinterest", "Website",
];

const AI_SUPPORTED_SECTIONS = ["hero", "about", "services", "testimonials", "contact", "booking"];

function useAISectionWriter() {
  const [generating, setGenerating] = useState(false);

  const generate = async (
    section: string,
    profession: string,
    name: string,
    company: string
  ): Promise<SectionContent | null> => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-section-writer", {
        body: { section, profession, name, company },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.content as SectionContent;
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating };
}

function AIWriteButton({
  sectionId,
  profession,
  userName,
  company,
  onResult,
}: {
  sectionId: string;
  profession: string;
  userName: string;
  company: string;
  onResult: (content: SectionContent) => void;
}) {
  const { generate, generating } = useAISectionWriter();

  if (!AI_SUPPORTED_SECTIONS.includes(sectionId)) return null;

  const handleClick = async () => {
    const result = await generate(sectionId, profession, userName, company);
    if (result) {
      onResult(result);
      toast.success("AI content generated!");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full border-primary/30 text-primary hover:bg-primary/5"
      onClick={handleClick}
      disabled={generating}
    >
      {generating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Wand2 className="h-4 w-4 mr-2" />
      )}
      {generating ? "Writing…" : "AI Write Assist"}
    </Button>
  );
}

export default function SectionEditor({
  sectionId,
  sectionLabel,
  content,
  open,
  onOpenChange,
  onSave,
  profession = "",
  userName = "",
  company = "",
  sectionEnabled = false,
}: SectionEditorProps) {
  const [draft, setDraft] = useState<SectionContent>(content);

  const handleOpenChange = (val: boolean) => {
    if (val) setDraft(content);
    onOpenChange(val);
  };

  const handleSave = () => {
    if (sectionId === "quote_calculator") {
      const rows = draft.calcPriceRows ?? rowsFromPreset(draft.calcCustomPreset);
      const bad = rows.map(validatePriceRow).find(Boolean);
      if (bad) { toast.error(bad); return; }
      const note = draft.calcDisclaimer ?? DEFAULT_PRICE_NOTE;
      const { calcPresetId: _unused, ...rest } = draft;
      onSave({ ...rest, calcPriceRows: rows, calcDisclaimer: note, calcCustomPreset: buildPresetFromRows(rows, note) });
      onOpenChange(false);
      return;
    }
    onSave(draft);
    onOpenChange(false);
  };

  const handleAIResult = (generated: SectionContent) => {
    setDraft((prev) => ({ ...prev, ...generated }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit {sectionLabel}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* AI Write Assist button */}
          <AIWriteButton
            sectionId={sectionId}
            profession={profession}
            userName={userName}
            company={company}
            onResult={handleAIResult}
          />

          {sectionId === "hero" && <HeroEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "about" && <AboutEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "services" && <ServicesEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "testimonials" && <TestimonialsEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "gallery" && <GalleryEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "social" && <SocialEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "contact" && <ContactEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "booking" && <BookingEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "projects" && <ProjectsEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "video_intro" && <VideoIntroEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "quote_calculator" && <QuoteCalculatorEditor draft={draft} setDraft={setDraft} sectionEnabled={sectionEnabled} />}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={handleSave} className="flex-1">Save Changes</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Individual Section Editors ───────────────────────────

function HeroEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Tagline</Label>
        <Input
          placeholder="e.g. Master Barber · Est. 2015"
          value={draft.tagline || ""}
          onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
        />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input
          placeholder="e.g. Premium cuts & grooming in Downtown LA"
          value={draft.subtitle || ""}
          onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
        />
      </div>
    </div>
  );
}

function AboutEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  return (
    <div>
      <Label className="text-xs">About Text</Label>
      <Textarea
        placeholder="Tell visitors about yourself and your work…"
        value={draft.text || ""}
        onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        rows={6}
      />
      <p className="text-[10px] text-muted-foreground mt-1">{(draft.text || "").length}/500 characters</p>
    </div>
  );
}

function ServicesEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  const items = draft.items || [];

  const addItem = () => {
    setDraft({ ...draft, items: [...items, { name: "", description: "", price: "" }] });
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    setDraft({ ...draft, items: next });
  };

  const removeItem = (idx: number) => {
    setDraft({ ...draft, items: items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Service {idx + 1}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeItem(idx)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Input
            placeholder="Service name"
            value={item.name}
            onChange={(e) => updateItem(idx, "name", e.target.value)}
          />
          <Input
            placeholder="Brief description (optional)"
            value={item.description || ""}
            onChange={(e) => updateItem(idx, "description", e.target.value)}
          />
          <Input
            placeholder="Price (e.g. $50)"
            value={item.price || ""}
            onChange={(e) => updateItem(idx, "price", e.target.value)}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Add Service
      </Button>
    </div>
  );
}

function TestimonialsEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  const testimonials = draft.testimonials || [];

  const addTestimonial = () => {
    setDraft({ ...draft, testimonials: [...testimonials, { name: "", text: "", role: "" }] });
  };

  const updateTestimonial = (idx: number, field: string, value: string) => {
    const next = testimonials.map((t, i) => (i === idx ? { ...t, [field]: value } : t));
    setDraft({ ...draft, testimonials: next });
  };

  const removeTestimonial = (idx: number) => {
    setDraft({ ...draft, testimonials: testimonials.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      {testimonials.map((t, idx) => (
        <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Testimonial {idx + 1}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTestimonial(idx)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Input
            placeholder="Client name"
            value={t.name}
            onChange={(e) => updateTestimonial(idx, "name", e.target.value)}
          />
          <Input
            placeholder="Role or title (optional)"
            value={t.role || ""}
            onChange={(e) => updateTestimonial(idx, "role", e.target.value)}
          />
          <Textarea
            placeholder="What they said…"
            value={t.text}
            onChange={(e) => updateTestimonial(idx, "text", e.target.value)}
            rows={3}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addTestimonial}>
        <Plus className="h-4 w-4 mr-1" /> Add Testimonial
      </Button>
    </div>
  );
}

function GalleryEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  const images = draft.images || [];

  const addImage = () => {
    setDraft({ ...draft, images: [...images, { url: "", caption: "" }] });
  };

  const updateImage = (idx: number, field: string, value: string) => {
    const next = images.map((img, i) => (i === idx ? { ...img, [field]: value } : img));
    setDraft({ ...draft, images: next });
  };

  const removeImage = (idx: number) => {
    setDraft({ ...draft, images: images.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Add image URLs for your gallery. You can paste links from Instagram, your portfolio, or any image host.</p>
      {images.map((img, idx) => (
        <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Image {idx + 1}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeImage(idx)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Input
            placeholder="Image URL"
            value={img.url}
            onChange={(e) => updateImage(idx, "url", e.target.value)}
          />
          <Input
            placeholder="Caption (optional)"
            value={img.caption || ""}
            onChange={(e) => updateImage(idx, "caption", e.target.value)}
          />
          {img.url && (
            <img src={img.url} alt={img.caption || ""} className="w-full h-24 object-cover rounded-md" />
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addImage}>
        <Plus className="h-4 w-4 mr-1" /> Add Image
      </Button>
    </div>
  );
}

function SocialEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  const links = draft.links || [];

  const addLink = () => {
    setDraft({ ...draft, links: [...links, { platform: "Instagram", url: "" }] });
  };

  const updateLink = (idx: number, field: string, value: string) => {
    const next = links.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
    setDraft({ ...draft, links: next });
  };

  const removeLink = (idx: number) => {
    setDraft({ ...draft, links: links.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      {links.map((link, idx) => (
        <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <select
              className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer"
              value={link.platform}
              onChange={(e) => updateLink(idx, "platform", e.target.value)}
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeLink(idx)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Input
            placeholder={`Your ${link.platform} URL`}
            value={link.url}
            onChange={(e) => updateLink(idx, "url", e.target.value)}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addLink}>
        <Plus className="h-4 w-4 mr-1" /> Add Social Link
      </Button>
    </div>
  );
}

function ContactEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Section Heading</Label>
        <Input
          placeholder="e.g. Get in Touch"
          value={draft.heading || ""}
          onChange={(e) => setDraft({ ...draft, heading: e.target.value })}
        />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea
          placeholder="e.g. Have a question? Send me a message and I'll get back to you within 24 hours."
          value={draft.description || ""}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}

function BookingEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Section Heading</Label>
        <Input
          placeholder="e.g. Book an Appointment"
          value={draft.bookingHeading || ""}
          onChange={(e) => setDraft({ ...draft, bookingHeading: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Booking services are managed in Settings → Bookings. The booking widget will automatically display your active services.
      </p>
    </div>
  );
}

function ProjectsEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Section Heading</Label>
        <Input
          placeholder="e.g. Our Work"
          value={draft.projectsHeading || ""}
          onChange={(e) => setDraft({ ...draft, projectsHeading: e.target.value })}
        />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea
          placeholder="e.g. Check out some of our recent projects and transformations."
          value={draft.projectsDescription || ""}
          onChange={(e) => setDraft({ ...draft, projectsDescription: e.target.value })}
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showBeforeAfter"
          checked={draft.showBeforeAfter !== false}
          onChange={(e) => setDraft({ ...draft, showBeforeAfter: e.target.checked })}
          className="rounded border-border"
        />
        <Label htmlFor="showBeforeAfter" className="text-xs cursor-pointer">Show before/after slider on project images</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Projects are managed from the Projects page under Customers → Projects. Public projects will automatically appear on your card.
      </p>
    </div>
  );
}

function QuoteCalculatorEditor({ draft, setDraft, sectionEnabled }: { draft: SectionContent; setDraft: (d: SectionContent) => void; sectionEnabled: boolean }) {
  const { user } = useAuth();
  const [filling, setFilling] = useState(false);
  const rows: PriceRow[] = draft.calcPriceRows ?? rowsFromPreset(draft.calcCustomPreset);
  const note = draft.calcDisclaimer ?? DEFAULT_PRICE_NOTE;
  const setRows = (next: PriceRow[]) => setDraft({ ...draft, calcPriceRows: next });
  const updateRow = (i: number, patch: Partial<PriceRow>) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const showing = sectionEnabled && rows.some(isPricedRow);

  const addMyServices = async () => {
    if (!user) return;
    setFilling(true);
    const { data, error } = await supabase.from("booking_services").select("name").eq("user_id", user.id).order("created_at", { ascending: true });
    setFilling(false);
    if (error) { toast.error("Couldn't load your services. Please try again."); return; }
    const have = new Set(rows.map((r) => r.name.trim().toLowerCase()));
    const extra = (data || []).map((d) => d.name).filter((n) => n && !have.has(n.trim().toLowerCase()));
    if (extra.length === 0) { toast("No new services to add."); return; }
    setRows([...rows, ...extra.map((name) => ({ name, from: "", to: "" }))].slice(0, MAX_PRICE_ROWS));
  };

  return (
    <div className="space-y-4">
      <p className={`rounded-md border px-3 py-2 text-sm ${showing ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
        {showing ? "Showing on your card" : "Not shown on your card until you add your own prices."}
      </p>
      <div>
        <Label className="text-xs">Section Heading</Label>
        <Input
          className="h-11"
          placeholder="e.g. Get an Instant Quote"
          value={draft.calcHeading || ""}
          onChange={(e) => setDraft({ ...draft, calcHeading: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Your price list</h3>
        <p className="text-xs text-muted-foreground">Customers pick a job and see your price range. Nothing shows on your card until you add at least one price.</p>
      </div>
      <div className="space-y-3">
        {rows.map((row, i) => {
          const err = validatePriceRow(row);
          return (
            <div key={i} className="space-y-2 rounded-md border border-border p-3">
              <div className="flex gap-2">
                <Input className="h-11 flex-1" placeholder="Job name" aria-label="Job name" value={row.name} onChange={(e) => updateRow(i, { name: e.target.value })} />
                <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Remove job" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">From $</Label>
                  <Input className="h-11" type="number" inputMode="decimal" min={0} value={row.from} onChange={(e) => updateRow(i, { from: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">To $ (optional)</Label>
                  <Input className="h-11" type="number" inputMode="decimal" min={0} value={row.to} onChange={(e) => updateRow(i, { to: e.target.value })} />
                </div>
              </div>
              {err ? (
                <p className="text-xs text-destructive">{err}</p>
              ) : !isPricedRow(row) ? (
                <p className="text-xs text-muted-foreground">No price yet, so customers won't see this job.</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="h-11 flex-1" disabled={rows.length >= MAX_PRICE_ROWS} onClick={() => setRows([...rows, { name: "", from: "", to: "" }])}>
          <Plus className="h-4 w-4 mr-1" /> Add a job
        </Button>
        <Button type="button" variant="outline" className="h-11 flex-1" disabled={filling || rows.length >= MAX_PRICE_ROWS} onClick={addMyServices}>
          {filling && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add my services
        </Button>
      </div>
      {rows.length >= MAX_PRICE_ROWS && <p className="text-xs text-muted-foreground">Up to {MAX_PRICE_ROWS} jobs.</p>}
      <div>
        <Label className="text-xs">Note under the price (optional)</Label>
        <Input className="h-11" value={note} onChange={(e) => setDraft({ ...draft, calcDisclaimer: e.target.value })} />
      </div>
    </div>
  );
}

// ─── Video Introduction Editor ──────────────────────────────
function VideoIntroEditor({ draft, setDraft }: { draft: SectionContent; setDraft: (d: SectionContent) => void }) {
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
    return url;
  };

  const previewUrl = getEmbedUrl(draft.videoUrl || "");

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Video URL</Label>
        <Input
          placeholder="Paste YouTube, Vimeo, or Loom URL"
          value={draft.videoUrl || ""}
          onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
        />
        <p className="text-[10px] text-muted-foreground mt-1">Supports YouTube, Vimeo, and Loom links</p>
      </div>
      {previewUrl && (
        <div className="rounded-lg overflow-hidden border border-border aspect-video">
          <iframe
            src={previewUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      )}
      <div>
        <Label className="text-xs">Section Heading</Label>
        <Input
          placeholder="e.g. Watch Our Story"
          value={draft.videoHeading || ""}
          onChange={(e) => setDraft({ ...draft, videoHeading: e.target.value })}
        />
      </div>
      <div>
        <Label className="text-xs">Caption (optional)</Label>
        <Textarea
          placeholder="Brief description under the video"
          value={draft.videoCaption || ""}
          onChange={(e) => setDraft({ ...draft, videoCaption: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );
}
