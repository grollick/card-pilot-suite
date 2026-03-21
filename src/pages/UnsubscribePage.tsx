import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type State = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (!res.ok) {
          setState("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setState("already_unsubscribed");
        } else if (data.valid) {
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch {
        setState("error");
      }
    };

    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setState("success");
      } else if (data?.reason === "already_unsubscribed") {
        setState("already_unsubscribed");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="space-y-1">
          <p className="text-2xl">
            <span className="font-extrabold text-primary">guzzl</span>
            <span className="text-foreground">.pro</span>
          </p>
        </div>

        {state === "loading" && (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Validating your request...</p>
          </div>
        )}

        {state === "valid" && (
          <div className="rounded-2xl border border-border bg-card p-8 space-y-4 shadow-sm">
            <AlertCircle className="h-10 w-10 text-warning mx-auto" />
            <h1 className="text-lg font-bold text-foreground">Unsubscribe from emails?</h1>
            <p className="text-sm text-muted-foreground">
              You'll stop receiving app emails from this sender. This won't affect
              your account or login-related emails.
            </p>
            <Button
              onClick={handleUnsubscribe}
              disabled={processing}
              variant="destructive"
              className="w-full"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Unsubscribe
            </Button>
          </div>
        )}

        {state === "success" && (
          <div className="rounded-2xl border border-border bg-card p-8 space-y-4 shadow-sm">
            <CheckCircle className="h-10 w-10 text-[hsl(var(--success))] mx-auto" />
            <h1 className="text-lg font-bold text-foreground">You've been unsubscribed</h1>
            <p className="text-sm text-muted-foreground">
              You won't receive any more app emails from this sender.
            </p>
          </div>
        )}

        {state === "already_unsubscribed" && (
          <div className="rounded-2xl border border-border bg-card p-8 space-y-4 shadow-sm">
            <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h1 className="text-lg font-bold text-foreground">Already unsubscribed</h1>
            <p className="text-sm text-muted-foreground">
              You've already been removed from this email list.
            </p>
          </div>
        )}

        {state === "invalid" && (
          <div className="rounded-2xl border border-border bg-card p-8 space-y-4 shadow-sm">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="text-lg font-bold text-foreground">Invalid link</h1>
            <p className="text-sm text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-border bg-card p-8 space-y-4 shadow-sm">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="text-lg font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              We couldn't process your request. Please try again later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
