import { useState } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
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
}

interface SectionEditorProps {
  sectionId: string;
  sectionLabel: string;
  content: SectionContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: SectionContent) => void;
}

const SOCIAL_PLATFORMS = [
  "Instagram", "Facebook", "Twitter/X", "LinkedIn", "TikTok", "YouTube", "Snapchat", "Pinterest", "Website",
];

export default function SectionEditor({
  sectionId,
  sectionLabel,
  content,
  open,
  onOpenChange,
  onSave,
}: SectionEditorProps) {
  const [draft, setDraft] = useState<SectionContent>(content);

  // Reset draft when opening
  const handleOpenChange = (val: boolean) => {
    if (val) setDraft(content);
    onOpenChange(val);
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit {sectionLabel}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {sectionId === "hero" && <HeroEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "about" && <AboutEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "services" && <ServicesEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "testimonials" && <TestimonialsEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "gallery" && <GalleryEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "social" && <SocialEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "contact" && <ContactEditor draft={draft} setDraft={setDraft} />}
          {sectionId === "booking" && <BookingEditor draft={draft} setDraft={setDraft} />}

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
