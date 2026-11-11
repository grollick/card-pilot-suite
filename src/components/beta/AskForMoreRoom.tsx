import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmitFeedback } from "@/hooks/useBetaFeedback";

export const BETA_UPGRADE_MESSAGE =
  "Paid plans aren't open yet. Tell us you need more room and we'll sort you out.";

interface Props extends Omit<ButtonProps, "onClick" | "children"> {
  /** Which limit or feature the user ran into */
  limit: string;
  label?: string;
}

/** Free beta replacement for "Upgrade" buttons: logs a "more room" request to Feedback & Bugs. */
export default function AskForMoreRoom({ limit, label = "Ask for more room", className, ...rest }: Props) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const submit = useSubmitFeedback();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const send = async () => {
    if (!user || state !== "idle") return;
    setState("sending");
    try {
      await submit.mutateAsync({
        feedback_type: "suggestion",
        message: `More room request: ${limit}`,
        page_url: pathname,
        meta_json: { kind: "more_room_request", limit },
        silent: true,
      });
    } catch {
      setState("idle");
      return;
    }
    setState("sent");
    toast.success("Request sent. We'll be in touch.");
  };

  return (
    <Button {...rest} className={className} onClick={send} disabled={state !== "idle" || !user}>
      {state === "sent" ? (<><Check className="h-4 w-4 mr-1.5" /> Request sent. We'll be in touch.</>) : state === "sending" ? "Sending…" : label}
    </Button>
  );
}
