import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { useAhaMoments, type AhaPrompt } from "@/hooks/useAhaMoments";
import { useState } from "react";

export default function AhaPromptBanner() {
  const { topPrompt, isLoading } = useAhaMoments();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  if (isLoading || !topPrompt || dismissed.has(topPrompt.id)) return null;

  const Icon = topPrompt.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={topPrompt.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="flex items-center gap-4 py-4 px-5">
            <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">
                {topPrompt.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {topPrompt.description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => navigate(topPrompt.route)}
                className="gap-1.5"
              >
                {topPrompt.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() =>
                  setDismissed((prev) => new Set(prev).add(topPrompt.id))
                }
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
