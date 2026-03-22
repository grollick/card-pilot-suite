import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus, X, Bug, Lightbulb, HelpCircle, ThumbsUp, ImagePlus, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubmitFeedback, type FeedbackType } from "@/hooks/useBetaFeedback";
import { useMyBetaAccess } from "@/hooks/useBetaAccess";
import { cn } from "@/lib/utils";

const TYPES: { value: FeedbackType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "bug", label: "Bug", icon: <Bug className="h-4 w-4" />, color: "text-destructive" },
  { value: "suggestion", label: "Suggestion", icon: <Lightbulb className="h-4 w-4" />, color: "text-primary" },
  { value: "confusing", label: "Confusing", icon: <HelpCircle className="h-4 w-4" />, color: "text-amber-500" },
  { value: "positive", label: "Love it!", icon: <ThumbsUp className="h-4 w-4" />, color: "text-emerald-500" },
];

export default function BetaFeedbackWidget() {
  const { user } = useAuth();
  const { data: beta } = useMyBetaAccess();
  const location = useLocation();
  const submit = useSubmitFeedback();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Only show for authenticated users with beta access
  if (!user || !beta) return null;

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setScreenshotFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    let screenshotUrl: string | undefined;

    if (screenshotFile) {
      setUploading(true);
      const ext = screenshotFile.name.split(".").pop() || "png";
      const path = `feedback/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("feedback-screenshots").upload(path, screenshotFile);
      if (!error) {
        // Store the path only — admins will generate signed URLs to view
        screenshotUrl = path;
      }
      setUploading(false);
    }

    await submit.mutateAsync({
      feedback_type: type,
      message: message.trim(),
      screenshot_url: screenshotUrl,
      page_url: location.pathname,
    });

    setMessage("");
    setScreenshotFile(null);
    setOpen(false);
  };

  return (
    <div className="pointer-events-none">
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 z-50 pointer-events-auto"
          >
            <Button
              onClick={() => setOpen(true)}
              size="sm"
              className="rounded-full shadow-lg gap-1.5 px-3"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl pointer-events-auto"
          >
...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
