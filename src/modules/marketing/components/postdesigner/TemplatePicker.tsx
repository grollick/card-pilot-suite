import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { POST_TEMPLATES, PROFESSION_OPTIONS, CATEGORY_OPTIONS, FORMAT_DIMENSIONS } from "../../data/postTemplates";
import type { PostTemplate, TemplateProfession, TemplateCategory } from "../../data/postTemplates";

interface Props {
  onSelect: (template: PostTemplate) => void;
}

const APP_SOURCE_LABELS: Record<string, string> = {
  "canva-real-estate-templates": "Canva",
};

export default function TemplatePicker({ onSelect }: Props) {
  const [profession, setProfession] = useState<TemplateProfession | "all">("all");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [showAppOnly, setShowAppOnly] = useState(false);

  const filtered = POST_TEMPLATES.filter((t) => {
    if (profession !== "all" && t.profession !== profession && t.profession !== "general") return false;
    if (category !== "all" && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (showAppOnly && !t.appSource) return false;
    return true;
  });

  const hasAppTemplates = POST_TEMPLATES.some((t) => t.appSource);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border space-y-2">
        <h3 className="font-semibold text-sm">Templates</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* App source filter */}
        {hasAppTemplates && (
          <div className="flex items-center gap-1.5">
            <Badge
              variant={showAppOnly ? "default" : "outline"}
              className="cursor-pointer text-[10px] h-5 gap-1"
              onClick={() => setShowAppOnly(!showAppOnly)}
            >
              <Sparkles className="h-2.5 w-2.5" />
              Installed App Templates
            </Badge>
          </div>
        )}

        {/* Profession filter */}
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={profession === "all" ? "default" : "outline"}
            className="cursor-pointer text-[10px] h-5"
            onClick={() => setProfession("all")}
          >
            All
          </Badge>
          {PROFESSION_OPTIONS.filter(p => p.value !== "general").map((p) => (
            <Badge
              key={p.value}
              variant={profession === p.value ? "default" : "outline"}
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setProfession(p.value)}
            >
              {p.label}
            </Badge>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={category === "all" ? "secondary" : "outline"}
            className="cursor-pointer text-[10px] h-5"
            onClick={() => setCategory("all")}
          >
            All Types
          </Badge>
          {CATEGORY_OPTIONS.map((c) => (
            <Badge
              key={c.value}
              variant={category === c.value ? "secondary" : "outline"}
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Badge>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 grid grid-cols-2 gap-2">
          {filtered.map((t) => {
            const dim = FORMAT_DIMENSIONS[t.format];
            const appLabel = t.appSource ? APP_SOURCE_LABELS[t.appSource] : null;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="group relative rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/50 transition-all text-left"
              >
                {appLabel && (
                  <div className="absolute top-1 right-1 z-10">
                    <span className="inline-flex items-center gap-0.5 rounded bg-primary/90 px-1.5 py-0.5 text-[8px] font-semibold text-primary-foreground">
                      <Sparkles className="h-2 w-2" />
                      {appLabel}
                    </span>
                  </div>
                )}
                <div
                  className="w-full"
                  style={{
                    aspectRatio: `${dim.w} / ${dim.h}`,
                    backgroundColor: t.bgColor,
                    maxHeight: 120,
                  }}
                >
                  {/* Mini preview of elements */}
                  <div className="relative w-full h-full overflow-hidden">
                    {t.elements
                      .filter(el => el.type === "text" || el.type === "badge")
                      .slice(0, 3)
                      .map((el) => (
                        <div
                          key={el.id}
                          className="absolute truncate"
                          style={{
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.width}%`,
                            fontSize: "6px",
                            fontWeight: el.fontWeight ?? "400",
                            color: el.type === "badge" ? (el.badgeColor ?? "#FFF") : (el.color ?? "#FFF"),
                            lineHeight: 1.2,
                          }}
                        >
                          {el.type === "text" ? el.text : el.badgeText}
                        </div>
                      ))}
                  </div>
                </div>
                <div className="p-1.5 bg-card">
                  <p className="text-[10px] font-medium truncate">{t.name}</p>
                  <p className="text-[9px] text-muted-foreground capitalize">{t.profession} · {t.format}</p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-2 text-xs text-muted-foreground text-center py-8">
              No templates found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
