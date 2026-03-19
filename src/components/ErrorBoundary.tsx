import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** If true, shows a full-page error (used at root level) */
  fullPage?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);

    // Log to system_events if possible (fire-and-forget)
    try {
      const { supabase } = require("@/integrations/supabase/client");
      supabase.from("system_events").insert({
        event_type: "client_error",
        severity: "error",
        message: error.message?.slice(0, 500),
        meta_data: {
          stack: error.stack?.slice(0, 1000),
          componentStack: info.componentStack?.slice(0, 500),
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
      }).then(() => {}).catch(() => {});
    } catch {
      // Silently ignore if logging fails
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorCount: prev.errorCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const tooManyRetries = this.state.errorCount >= 3;

      return (
        <div className={`flex items-center justify-center p-6 ${this.props.fullPage ? "min-h-screen" : "min-h-[50vh]"}`}>
          <div className="text-center max-w-sm">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tooManyRetries
                ? "This error keeps occurring. Try going back to the home page."
                : this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex items-center justify-center gap-2">
              {!tooManyRetries && (
                <Button onClick={this.handleRetry} variant="outline" className="gap-1.5">
                  <RefreshCw className="h-4 w-4" /> Try Again
                </Button>
              )}
              <Button onClick={this.handleGoHome} variant={tooManyRetries ? "default" : "ghost"} className="gap-1.5">
                <Home className="h-4 w-4" /> Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
