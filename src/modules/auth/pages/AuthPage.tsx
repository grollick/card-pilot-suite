import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useSearchParams, Navigate } from "react-router-dom";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SOCIAL_PROOF_POINTS = [
  "Get discovered by local customers",
  "Receive leads & booking requests",
  "Professional card in under 2 minutes",
  "Free forever — upgrade anytime",
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const refCode = searchParams.get("ref") || "";
  const [mode, setMode] = useState<"login" | "signup">(initialMode || (refCode ? "signup" : "login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendWait, setResendWait] = useState(0);
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  // Start the 30-second wait as soon as the first email goes out.
  useEffect(() => {
    if (signupSuccess) setResendWait(30);
  }, [signupSuccess]);

  const handleResend = async () => {
    if (resendWait > 0 || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) {
      setResendSent(false);
      toast({ title: "Couldn't resend", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }
    setResendSent(true);
    setResendWait(30);
  };
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      const result = mode === "signup"
        ? await signUp(email, password, undefined, refCode || undefined)
        : await signIn(email, password);
      if (result.error) {
        setFormError(mode === "signup"
          ? "We couldn't create your account. Please try again."
          : "We couldn't sign you in. Check your email and password and try again.");
      } else if (mode === "signup") {
        setSignupSuccess(true);
      } else {
        navigate("/app");
      }
    } catch {
      setFormError(mode === "signup"
        ? "We couldn't create your account. Please try again."
        : "We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Google sign-in failed. Please try again.", variant: "destructive" });
    }
    setGoogleLoading(false);
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — Social proof panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <Link to="/">
            <GuzzlLogo size="lg" to={null} className="[&>span]:text-white [&>span:last-child]:text-white/90" />
          </Link>
          <p className="text-primary-foreground/80 text-lg mb-10 leading-relaxed">
            Create your free card and start capturing leads.
          </p>

          <div className="space-y-5">
            {SOCIAL_PROOF_POINTS.map((point, i) => (
              <motion.div
                key={point}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-primary-foreground/90 mt-0.5 shrink-0" />
                <span className="text-primary-foreground/90 text-sm font-medium">{point}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-primary-foreground/15">
            <p className="text-primary-foreground text-base font-semibold">Guzzl leads like a pro.</p>
            <ul className="mt-3 space-y-1.5 text-primary-foreground/70 text-xs">
              <li>Your card live in minutes</li>
              <li>Leads and bookings in one place</li>
              <li>Free during beta</li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <AnimatePresence mode="wait">
          {signupSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[400px] text-center"
            >
              <div className="h-16 w-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a verification link to <strong className="text-foreground">{email}</strong>. Click it and we'll start building your card instantly.
              </p>
              <div className="rounded-xl border border-border bg-card p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">What happens next</span>
                </div>
                <ol className="text-xs text-muted-foreground space-y-1.5 ml-6 list-decimal">
                  <li>Verify your email</li>
                  <li>We auto-generate your card</li>
                  <li>Start receiving leads</li>
                </ol>
              </div>
              <div className="mt-6 space-y-3">
                <Button variant="outline" className="w-full" onClick={handleResend} disabled={resendWait > 0 || resending}>
                  {resending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  {resendWait > 0 ? `Resend email (${resendWait}s)` : "Resend email"}
                </Button>
                {resendSent && <p className="text-xs text-success" role="status">Sent</p>}
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => { setSignupSuccess(false); setResendSent(false); setMode("signup"); }}
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-[400px]"
            >
              {/* Mobile logo */}
              <div className="lg:hidden text-center mb-6">
                <GuzzlLogo size="xl" />
              </div>

              {/* Headline */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {isSignup ? "Start getting local jobs in minutes" : "Welcome back."}
                </h1>
                {isSignup && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Create your account and we'll build your card automatically.
                  </p>
                )}
              </div>

              {/* Google button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-sm font-medium mb-6"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">or continue with email</span>
                </div>
              </div>

              {/* Form — email + password only */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-sm"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 h-12 text-sm"
                    required
                    minLength={6}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {!isSignup && (
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-sm font-semibold shadow-glow" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isSignup ? "Create Free Account" : "Log In"}
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Trust message */}
              {isSignup && (
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Free to start — no commitment
                </p>
              )}

              {/* Toggle mode */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                      Create account
                    </button>
                  </>
                )}
              </p>

              {/* Security + Terms */}
              <div className="mt-5 space-y-2">
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
                  <Lock className="h-3 w-3 shrink-0" />
                  Your data is protected with modern security standards
                </p>
                {isSignup && (
                  <p className="text-center text-[11px] text-muted-foreground/60 leading-relaxed">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
