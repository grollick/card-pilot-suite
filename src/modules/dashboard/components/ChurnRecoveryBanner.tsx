import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useChurnRisk } from "@/hooks/useChurnRisk";
import { useState } from "react";

export default function ChurnRecoveryBanner() {
  const { level, recoveryMessage, recoveryAction, isLoading } = useChurnRisk();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (isLoading || dismissed || level === "none" || level === "low") return null;
  if (!recoveryMessage || !recoveryAction) return null;

  const isHigh = level === "high";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={
            isHigh
              ? "border-destructive/30 bg-destructive/5 shadow-sm"
              : "border-yellow-500/30 bg-yellow-500/5 shadow-sm"
          }
        >
          <CardContent className="flex items-center gap-4 py-4 px-5">
            <div
              className={`flex-shrink-0 rounded-lg p-2.5 ${
                isHigh ? "bg-destructive/10" : "bg-yellow-500/10"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  isHigh ? "text-destructive" : "text-yellow-600"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">
                {isHigh ? "We miss you!" : "Keep the momentum going"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {recoveryMessage}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant={isHigh ? "destructive" : "outline"}
                onClick={() => navigate(recoveryAction.route)}
                className="gap-1.5"
              >
                {recoveryAction.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setDismissed(true)}
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
