import { FileText, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const mockBlocks = [
  { id: "1", title: "Professional Bio", type: "Bio", preview: "I help homeowners find their dream property with personalized service…", usedIn: ["Card", "Email"] },
  { id: "2", title: "5-Star Testimonial — Sarah J.", type: "Testimonial", preview: "\"Working with them was the best decision we made…\"", usedIn: ["Card", "Social"] },
  { id: "3", title: "Spring Promo 2026", type: "Offer", preview: "Book before March 15 and get 15% off your first consultation.", usedIn: ["Email", "Social"] },
  { id: "4", title: "Service Overview", type: "Bio", preview: "Full-service real estate including buying, selling, and property management…", usedIn: ["Card"] },
];

export default function ContentPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground text-sm mt-1">Reusable content blocks for cards, emails & social</p>
        </div>
        <Button className="shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> New Block
        </Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockBlocks.map(block => (
          <div key={block.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{block.title}</p>
                  <Badge variant="secondary" className="text-[10px] mt-0.5">{block.type}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{block.preview}</p>
            <div className="flex gap-1 mt-3">
              {block.usedIn.map(u => (
                <span key={u} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{u}</span>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
