import { useState } from "react";
import { useNavigate, Link, useSearchParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SOCIAL_PROOF_POINTS = [
  "Digital business card in under 2 minutes",
  "Built-in CRM & automated follow-ups",
  "Online booking & estimates",
  "QR codes, NFC & analytics",
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const refCode = searchParams.get("ref") || "";
  const [mode, setMode] = useState<"login" | "signup">(initialMode || (refCode ? "signup" : "login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (mode === "signup") {
      result = await signUp(email, password, name, refCode || undefined);
      if (!result.error) {
        toast({
          title: "Account created!",
          description: "Check your email to verify your account.",
        });
        setLoading(false);
        return;
      }
    } else {
      result = await signIn(email, password);
      if (!result.error) {
        navigate("/app");
        setLoading(false);
        return;
      }
    }

    if (result?.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
    setLoading(false);
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
            <h2 className="text-3xl font-bold text-primary-foreground mb-2"><span className="font-bold text-primary">guzzl</span>.pro</h2>
          </Link>
          <p className="text-primary-foreground/80 text-lg mb-10 leading-relaxed">
            Join thousands of service professionals using guzzl.pro to grow their business.
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
            <p className="text-primary-foreground/60 text-xs">
              "guzzl.pro helped me double my bookings in the first month."
            </p>
            <p className="text-primary-foreground/40 text-xs mt-2">— Mike R., HVAC Contractor</p>
          </div>
        </motion.div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/">
              <h1 className="text-2xl font-bold text-primary"><span className="font-bold text-primary">guzzl</span>.pro</h1>
            </Link>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {isSignup ? "Create your guzzl.pro account." : "Welcome back."}
            </h1>
            {isSignup && (
              <p className="text-muted-foreground mt-2 text-sm">
                Start capturing leads and booking customers in minutes.
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 text-sm"
                  required
                  autoComplete="name"
                />
              </div>
            )}
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
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 text-sm"
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
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

          {/* Terms */}
          {isSignup && (
            <p className="text-center text-[11px] text-muted-foreground/60 mt-4 leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
