import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowRight } from "lucide-react";
import { useSuccessStories, SuccessStory } from "@/hooks/useSuccessStories";

interface Props {
  location: "landing" | "dashboard" | "onboarding";
  className?: string;
  compact?: boolean;
}

export default function SuccessStoryBanner({ location, className = "", compact = false }: Props) {
  const { data: stories = [] } = useSuccessStories(location);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (stories.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % stories.length), 6000);
    return () => clearInterval(t);
  }, [stories.length]);

  if (!stories.length) return null;

  const story = stories[idx];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Trophy className="h-4 w-4 text-warning shrink-0" />
        <AnimatePresence mode="wait">
          <motion.span
            key={story.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-muted-foreground"
          >
            <strong className="text-foreground">{story.user_name}</strong> ({story.business_type}) — {story.result_text}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={story.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35 }}
          className="flex items-start gap-3"
        >
          <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{story.user_name}</span>
              <span className="text-xs text-muted-foreground">· {story.business_type}</span>
            </div>
            <p className="text-sm text-foreground mt-0.5">{story.result_text}{story.timeframe && ` in ${story.timeframe}`}</p>
            {story.quote && <p className="text-xs text-muted-foreground italic mt-1">"{story.quote}"</p>}
            {story.metric_value && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xl font-bold text-primary">{story.metric_value}</span>
                <span className="text-xs text-muted-foreground">{story.metric_label}</span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      {stories.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
