import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Globe, Instagram, Facebook, Trash2, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SocialLink {
  platform: string;
  url: string;
}

interface Props {
  onNext: (links: SocialLink[]) => void;
  onBack: () => void;
}

const PLATFORM_CONFIG: { key: string; label: string; icon: React.ReactNode; placeholder: string; match: RegExp }[] = [
  { key: "Instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, placeholder: "https://instagram.com/yourhandle", match: /instagram\.com/i },
  { key: "Facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" />, placeholder: "https://facebook.com/yourpage", match: /facebook\.com|fb\.com/i },
  { key: "TikTok", label: "TikTok", icon: <span className="text-xs font-bold">TT</span>, placeholder: "https://tiktok.com/@yourhandle", match: /tiktok\.com/i },
  { key: "Website", label: "Website", icon: <Globe className="h-4 w-4" />, placeholder: "https://yourwebsite.com", match: /^(?!.*(instagram|facebook|fb|tiktok))/i },
];

function detectPlatform(url: string): string | null {
  if (!url) return null;
  for (const p of PLATFORM_CONFIG) {
    if (p.key !== "Website" && p.match.test(url)) return p.key;
  }
  if (url.startsWith("http")) return "Website";
  return null;
}

export default function StepSocialLinks({ onNext, onBack }: Props) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [inputUrl, setInputUrl] = useState("");

  const addLink = useCallback(() => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    // Auto-detect platform
    const detected = detectPlatform(trimmed);
    const platform = detected || "Website";

    // Don't add duplicates for same platform
    if (links.some(l => l.platform === platform)) {
      setLinks(prev => prev.map(l => l.platform === platform ? { ...l, url: trimmed } : l));
    } else {
      setLinks(prev => [...prev, { platform, url: trimmed }]);
    }
    setInputUrl("");
  }, [inputUrl, links]);

  const removeLink = (idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addLink(); }
  };

  const platformIcon = (platform: string) => {
    const cfg = PLATFORM_CONFIG.find(p => p.key === platform);
    return cfg?.icon || <Link2 className="h-4 w-4" />;
  };

  return (
    <motion.div key="social" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
      <div className="text-center space-y-1.5">
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Link2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Connect Your Social Accounts</h2>
        <p className="text-sm text-muted-foreground">Boost your credibility and show your work</p>
      </div>

      {/* Quick-add buttons */}
      <div className="grid grid-cols-2 gap-2">
        {PLATFORM_CONFIG.map(p => {
          const existing = links.find(l => l.platform === p.key);
          return (
            <button
              key={p.key}
              onClick={() => {
                if (!existing) {
                  setLinks(prev => [...prev, { platform: p.key, url: "" }]);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                existing
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border hover:border-primary/30 hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              {p.icon}
              {p.label}
              {existing && existing.url && <span className="ml-auto text-[10px] text-primary">✓</span>}
            </button>
          );
        })}
      </div>

      {/* URL input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Paste any profile link..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addLink} disabled={!inputUrl.trim()}>
            Add
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">We'll auto-detect the platform from your URL</p>
      </div>

      {/* Added links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">{platformIcon(link.platform)}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground">{link.platform}</span>
                {link.url ? (
                  <p className="text-[11px] text-muted-foreground truncate">{link.url}</p>
                ) : (
                  <Input
                    placeholder={PLATFORM_CONFIG.find(p => p.key === link.platform)?.placeholder || "Enter URL"}
                    className="h-7 text-xs mt-1 border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
                    value={link.url}
                    onChange={(e) => {
                      setLinks(prev => prev.map((l, i) => i === idx ? { ...l, url: e.target.value } : l));
                    }}
                  />
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => removeLink(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Benefit message */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-primary/80">Profiles with social links get 2× more views</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          className="flex-1 gap-1"
          onClick={() => onNext(links.filter(l => l.url.trim()))}
        >
          {links.filter(l => l.url.trim()).length > 0 ? "Continue" : "Skip for now"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
