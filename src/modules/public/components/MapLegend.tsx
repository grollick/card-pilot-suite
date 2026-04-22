import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PROFESSION_ICON_RULES, PROFESSION_ICON_FALLBACK } from "./professionIcons";

export default function MapLegend() {
  const [open, setOpen] = useState(false);
  const items = [...PROFESSION_ICON_RULES, { ...PROFESSION_ICON_FALLBACK, match: /./ }];

  return (
    <div className="absolute bottom-3 left-3 z-20 pointer-events-auto max-w-[60vw] sm:max-w-xs">
      <div className="rounded-lg border border-border bg-background/95 backdrop-blur shadow-md overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
          aria-expanded={open}
        >
          <span>Legend</span>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
        {open && (
          <ul className="max-h-64 overflow-auto px-2 pb-2 pt-1 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="h-3 w-3 text-white" strokeWidth={2.25} />
                  </span>
                  <span className="text-foreground/80">{item.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
