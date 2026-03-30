import { motion } from "framer-motion";
import { Share2, ArrowRight, Eye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareCtaWidgetProps {
  views?: number;
  onShare: () => void;
}

export default function ShareCtaWidget({ views = 0, onShare }: ShareCtaWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-accent/[0.02] p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Get your first lead</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Send your card link to customers, post it online, or add it to your invoices.
          </p>
          {views > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{views} card views so far</span>
            </div>
          )}
        </div>
        <Button size="lg" className="font-semibold flex-shrink-0" onClick={onShare}>
          Share Your Card <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Tip */}
      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-background/60 border border-border">
        <Lightbulb className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pro tip:</span> Providers who share their card within 24 hours get their first lead 3× faster.
        </p>
      </div>
    </motion.div>
  );
}
