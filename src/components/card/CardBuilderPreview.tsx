import { CreditCard, Eye, Pencil, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { getPatternSvg, type CardThemeOverrides, METALLIC_GRADIENTS, type MetallicType } from "./CardThemeEditor";
import { CTA_ICON_MAP } from "./CtaEditor";
import type { CtaItem } from "./CtaEditor";
import type { ResolvedCardTheme } from "@/lib/cardTokens";
import type { CardSection } from "@/hooks/useCard";

interface Props {
  profile: any;
  previewTheme: ResolvedCardTheme;
  currentThemeOverrides: CardThemeOverrides;
  sections: CardSection[];
  coverUrl: string | null;
  coverOffsetY: number;
  avatarUrl: string | null;
  avatarBgColor: string;
  avatarRotation: number;
  logoUrl: string | null;
  logoFrostedBg: boolean;
  logoPosition: string;
  logoSize: string;
  logoOpacity: number;
  logoPadding: number;
  logoNameGap?: number;
  ctaConfig: CtaItem[];
  ctaIconsOnly: boolean;
  editName: string | null;
  editCompany: string | null;
  displayJobTitle: string;
  boldLastName?: boolean;
  uppercaseName?: boolean;
  nameLetterSpacing?: number;
  nameFontWeight?: number;
  firstNameFontWeight?: number | null;
  nameItalic?: boolean;
  nameFontSize?: number | null;
  subtitleFontSize?: number | null;
  onAvatarChange: (url: string) => void;
  setEditingSection: (id: string | null) => void;
}

function getSectionPreview(section: CardSection) {
  const c = section.content;
  if (!c) return <p className="text-xs text-muted-foreground text-center">{section.label} Section</p>;
  switch (section.id) {
    case "hero":
      return c.tagline ? (
        <div className="text-center">
          <p className="text-sm font-semibold">{c.tagline}</p>
          {c.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{c.subtitle}</p>}
        </div>
      ) : <p className="text-xs text-muted-foreground text-center">Hero Section</p>;
    case "about":
      return c.text ? <p className="text-xs leading-relaxed">{c.text}</p> : <p className="text-xs text-muted-foreground text-center">About Section</p>;
    case "services":
      return c.items?.length ? (
        <div className="space-y-1.5">
          {c.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span>{item.name || "Untitled"}</span>
              {item.price && <span className="text-muted-foreground">{item.price}</span>}
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground text-center">Services Section</p>;
    case "testimonials":
      return c.testimonials?.length ? (
        <div className="space-y-2">
          {c.testimonials.map((t: any, i: number) => (
            <div key={i} className="text-xs italic">"{t.text}" — <span className="font-medium not-italic">{t.name}</span></div>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground text-center">Testimonials Section</p>;
    case "gallery":
      return c.images?.length ? (
        <div className="grid grid-cols-3 gap-1">
          {c.images.slice(0, 6).map((img: any, i: number) => (
            <img key={i} src={img.url} alt={img.caption || ""} className="w-full h-16 object-cover rounded" />
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground text-center">Gallery Section</p>;
    case "social":
      return c.links?.length ? (
        <div className="flex flex-wrap gap-2">
          {c.links.map((l: any, i: number) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{l.platform}</span>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground text-center">Social Links</p>;
    case "contact":
      return (
        <div className="text-center">
          <p className="text-xs font-medium">{c.heading || "Get in Touch"}</p>
          {c.description && <p className="text-[10px] text-muted-foreground mt-0.5">{c.description}</p>}
        </div>
      );
    case "booking":
      return <p className="text-xs text-center font-medium">{c.bookingHeading || "Book an Appointment"}</p>;
    default:
      return <p className="text-xs text-muted-foreground text-center">{section.label} Section</p>;
  }
}

export default function CardBuilderPreview({
  profile, previewTheme, currentThemeOverrides, sections,
  coverUrl, coverOffsetY, avatarUrl, avatarBgColor, avatarRotation,
  logoUrl, logoFrostedBg, logoPosition, logoSize, logoOpacity, logoPadding, logoNameGap = 8,
  ctaConfig, ctaIconsOnly, editName, editCompany, displayJobTitle,
  boldLastName, uppercaseName, nameLetterSpacing, nameFontWeight, firstNameFontWeight, nameItalic, nameFontSize, subtitleFontSize, onAvatarChange, setEditingSection,
}: Props) {
  const [previewDevice, setPreviewDevice] = useState<"phone" | "tablet">("phone");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logoPx = logoSize === "small" ? 36 : logoSize === "large" ? 64 : 48;
  const posMap: Record<string, string> = {
    "top-left": "top-2 left-2", "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2", "bottom-right": "bottom-2 right-2",
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
          {(["phone", "tablet"] as const).map((d) => (
            <button key={d} onClick={() => setPreviewDevice(d)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                previewDevice === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "phone" ? <Smartphone className="h-3.5 w-3.5" /> : <Tablet className="h-3.5 w-3.5" />}
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        {profile?.handle && (
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4" /> Preview as Visitor
            </a>
          </Button>
        )}
      </div>

      {/* Device Frame */}
      <div className="flex items-start justify-center py-4 transition-all duration-300">
        <div className={`relative mx-auto transition-all duration-300 ${previewDevice === "phone" ? "w-[300px]" : "w-[500px]"}`}>
          {previewDevice === "phone" && <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[120px] h-[26px] bg-foreground/90 rounded-b-2xl" />}
          {previewDevice === "tablet" && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-[8px] h-[8px] bg-foreground/40 rounded-full" />}
          <div className={`border-[6px] border-foreground/90 bg-foreground/90 shadow-xl overflow-hidden transition-all duration-300 ${
            previewDevice === "phone" ? "rounded-[2.5rem]" : "rounded-[1.5rem]"
          }`}>
            <div className={`overflow-hidden bg-background relative pb-6 transition-all duration-300 ${
              previewDevice === "phone" ? "rounded-[2rem]" : "rounded-[1rem]"
            }`}>
              <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 h-[4px] rounded-full bg-foreground/30 ${
                previewDevice === "phone" ? "w-[100px]" : "w-[140px]"
              }`} />
              <div className="lg:max-h-[calc(100vh-10rem)] overflow-y-auto scroll-smooth snap-y snap-proximity">
                <div className="relative" style={{
                  background: currentThemeOverrides.gradientBg?.enabled
                    ? `linear-gradient(${currentThemeOverrides.gradientBg.direction}, ${previewTheme.palette.background}, ${currentThemeOverrides.gradientBg.color2})`
                    : previewTheme.palette.background,
                }}>
                  {currentThemeOverrides.bgPattern?.type && currentThemeOverrides.bgPattern.type !== "none" && (
                    <div
                      className={`absolute inset-0 pointer-events-none ${(currentThemeOverrides.bgPattern as any).coverage === "gaps" ? "z-[0]" : "z-[1]"}`}
                      style={{
                        opacity: currentThemeOverrides.bgPattern.opacity,
                        backgroundImage: getPatternSvg(currentThemeOverrides.bgPattern.type, currentThemeOverrides.bgPattern.color || previewTheme.palette.secondary),
                        backgroundSize: currentThemeOverrides.bgPattern.type === "noise" ? "200px 200px" : `${currentThemeOverrides.bgPattern.scale ?? 20}px ${currentThemeOverrides.bgPattern.scale ?? 20}px`,
                      }}
                    />
                  )}

                  {/* Cover */}
                  <div className="h-28 relative overflow-hidden z-[2]" style={{
                    marginLeft: -8,
                    marginRight: -8,
                    marginTop: -8,
                    background: coverUrl ? undefined : `linear-gradient(135deg, ${previewTheme.palette.primary}33, ${previewTheme.palette.primary}0D)`,
                  }}>
                    {coverUrl && (
                      <img src={coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `center ${coverOffsetY}%` }} />
                    )}
                    {logoUrl && logoPosition !== "beside-name" && logoPosition !== "beside-name-right" && (
                      <div
                        className={`absolute ${posMap[logoPosition]} rounded-lg flex items-center justify-center ${logoFrostedBg ? 'bg-white/80 backdrop-blur-sm shadow-sm' : ''}`}
                        style={{ height: logoPx, width: logoPx, opacity: logoOpacity / 100, padding: logoPadding }}
                      >
                        <img src={logoUrl} alt="logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="px-5 pb-5 -mt-10 relative z-[2]">
                    {/* Avatar */}
                    <div
                      className="h-20 w-20 rounded-2xl border-4 flex items-center justify-center mb-3 cursor-pointer relative group overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        borderColor: previewTheme.palette.background,
                        backgroundColor: avatarBgColor === "transparent" ? `${previewTheme.palette.secondary}15` : avatarBgColor,
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className={`h-full w-full rounded-2xl ${avatarBgColor !== "transparent" ? "object-contain" : "object-cover"}`} style={{ transform: `rotate(${avatarRotation}deg)` }} />
                      ) : (
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !profile) return;
                        try {
                          const { supabase } = await import("@/integrations/supabase/client");
                          const ext = file.name.split(".").pop() || "jpg";
                          const path = `${profile.id}/avatar.${ext}`;
                          const { error } = await supabase.storage.from("card-assets").upload(path, file, { upsert: true });
                          if (error) throw error;
                          const { data } = supabase.storage.from("card-assets").getPublicUrl(path);
                          const url = `${data.publicUrl}?t=${Date.now()}`;
                          await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
                          onAvatarChange(url);
                          toast.success("Photo uploaded!");
                        } catch (err: any) { toast.error(err.message || "Upload failed"); }
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: logoNameGap }}>
                      {logoUrl && logoPosition === "beside-name" && (
                        <div
                          className={`rounded-lg flex items-center justify-center flex-shrink-0 ${logoFrostedBg ? 'bg-white/80 backdrop-blur-sm shadow-sm' : ''}`}
                          style={{ height: logoPx, width: logoPx, opacity: logoOpacity / 100, padding: logoPadding }}
                        >
                          <img src={logoUrl} alt="logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <h3 style={{ color: (() => { const me = currentThemeOverrides.metallicEffect; return me?.type && me.type !== "none" && me.applyToName ? "transparent" : previewTheme.palette.secondary; })(), fontFamily: `'${previewTheme.fonts.primary}', sans-serif`, fontWeight: nameFontWeight ?? 700, fontStyle: nameItalic ? "italic" : undefined, fontSize: nameFontSize ?? 18, ...(uppercaseName ? { textTransform: 'uppercase' as const } : {}), ...(nameLetterSpacing ? { letterSpacing: `${nameLetterSpacing}px` } : {}), ...(() => { const me = currentThemeOverrides.metallicEffect; if (me?.type && me.type !== "none" && me.applyToName) { return { background: METALLIC_GRADIENTS[me.type as Exclude<MetallicType, "none">], WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent", backgroundClip: "text" as const }; } return {}; })() }}>
                        {(() => {
                          const full = (editName ?? profile?.name) || "Your Name";
                          const display = uppercaseName ? full.toUpperCase() : full;
                          const parts = display.trim().split(/\s+/);
                          if (parts.length <= 1) {
                            if (firstNameFontWeight != null) return <span style={{ fontWeight: firstNameFontWeight }}>{display}</span>;
                            if (boldLastName) return <span style={{ fontWeight: 800 }}>{display}</span>;
                            return display;
                          }
                          const last = parts.pop()!;
                          const firstName = parts.join(" ");
                          const firstStyle = firstNameFontWeight != null ? { fontWeight: firstNameFontWeight } : undefined;
                          const lastStyle = boldLastName ? { fontWeight: 800 } : undefined;
                          return <>{firstStyle ? <span style={firstStyle}>{firstName}</span> : firstName} {lastStyle ? <span style={lastStyle}>{last}</span> : last}</>;
                        })()}
                      </h3>
                      {logoUrl && logoPosition === "beside-name-right" && (
                        <div
                          className={`rounded-lg flex items-center justify-center flex-shrink-0 ${logoFrostedBg ? 'bg-white/80 backdrop-blur-sm shadow-sm' : ''}`}
                          style={{ height: logoPx, width: logoPx, opacity: logoOpacity / 100, padding: logoPadding }}
                        >
                          <img src={logoUrl} alt="logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                    <p style={{ color: `${previewTheme.palette.secondary}99`, fontSize: subtitleFontSize ?? 14 }}>{displayJobTitle}</p>
                    {(editCompany ?? profile?.company) && (
                      <p className="text-xs mt-0.5" style={{ color: `${previewTheme.palette.secondary}70` }}>{editCompany ?? profile?.company}</p>
                    )}

                    {/* CTA Buttons */}
                    {(() => {
                      const enabledCtas = ctaConfig.filter(c => c.enabled);
                      const primary = enabledCtas.find(c => c.isPrimary) || enabledCtas[0];
                      const secondary = enabledCtas.filter(c => c !== primary);

                      if (ctaIconsOnly) {
                        return (
                          <div className="flex items-center justify-center gap-3 mt-4">
                            {enabledCtas.map(c => (
                              <button key={c.id} className="h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                                style={{
                                  background: c.isPrimary ? previewTheme.palette.primary : "transparent",
                                  color: c.isPrimary ? previewTheme.palette.background : previewTheme.palette.primary,
                                  border: c.isPrimary ? "none" : `1.5px solid ${previewTheme.palette.primary}40`,
                                }} title={c.label}
                              >{CTA_ICON_MAP[c.id]}</button>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2 mt-4">
                          {primary && (
                            <button className="w-full text-xs font-semibold py-2.5 rounded-lg transition-colors"
                              style={{ background: previewTheme.palette.primary, color: previewTheme.palette.background }}>
                              {primary.label}
                            </button>
                          )}
                          {secondary.length > 0 && (
                            <div className="flex gap-2">
                              {secondary.map(c => (
                                <button key={c.id} className="flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors"
                                  style={{ borderColor: `${previewTheme.palette.primary}40`, color: previewTheme.palette.primary, background: "transparent" }}>
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Section Previews */}
                    {sections.filter((s) => s.enabled).map((section) => (
                      <div key={section.id}
                        className="mt-4 p-3 rounded-lg border border-dashed border-border/60 bg-muted/20 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                        onClick={() => setEditingSection(section.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</span>
                          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {getSectionPreview(section)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
