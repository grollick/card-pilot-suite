import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVerificationChecklist, useRecalculateVerification } from "@/hooks/useVerification";
import VerificationBadge from "@/components/trust/VerificationBadge";
import type { VerificationLevel } from "@/components/trust/VerificationBadge";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const STEPS = [
  { key: "emailVerified", label: "Verify your email", path: "" },
  { key: "hasName", label: "Add your name", path: "/app/settings" },
  { key: "hasProfession", label: "Set your profession", path: "/app/settings" },
  { key: "hasAvatar", label: "Upload a profile photo", path: "/app/settings" },
  { key: "hasPhone", label: "Add phone number", path: "/app/settings" },
  { key: "hasCard", label: "Publish your card", path: "/app/card" },
  { key: "hasActivity", label: "Get your first lead or booking", path: "" },
] as const;

export default function VerificationChecklist() {
  const { data: checklist, isLoading } = useVerificationChecklist();
  const recalculate = useRecalculateVerification();
  const navigate = useNavigate();

  const currentLevel = (checklist?.currentLevel ?? "basic") as VerificationLevel;

  // Auto-recalculate when checklist loads
  useEffect(() => {
    if (checklist && !recalculate.isPending) {
      recalculate.mutate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist?.hasActivity, checklist?.hasCard]);

  if (isLoading || !checklist) return null;

  // Don't show if already pro verified
  if (currentLevel === "pro_verified") return null;

  const completedCount = STEPS.filter((s) => checklist[s.key as keyof typeof checklist]).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  const nextLevel: VerificationLevel = currentLevel === "basic" ? "verified" : "pro_verified";
  const nextLabel = nextLevel === "verified" ? "Verified Business" : "Pro Verified";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Become {nextLabel}
            <VerificationBadge level={nextLevel} size="xs" />
          </CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">{completedCount}/{STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1.5">
        {STEPS.map((step) => {
          const done = !!checklist[step.key as keyof typeof checklist];
          return (
            <button
              key={step.key}
              onClick={() => step.path && !done && navigate(step.path)}
              disabled={done || !step.path}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors disabled:opacity-70 disabled:cursor-default"
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className={`text-xs ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {step.label}
              </span>
              {!done && step.path && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 ml-auto" />
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
