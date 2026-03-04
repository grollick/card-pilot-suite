import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "magic">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithMagicLink, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    navigate("/app", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (mode === "magic") {
      result = await signInWithMagicLink(email);
      if (!result.error) {
        toast({ title: "Check your email", description: "We sent you a magic link to sign in." });
        setLoading(false);
        return;
      }
    } else if (mode === "signup") {
      result = await signUp(email, password, name);
      if (!result.error) {
        toast({ title: "Account created!", description: "Check your email to verify your account." });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/"><h1 className="text-2xl font-bold gradient-text">CardPilot</h1></Link>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Sign in with magic link"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="pl-9" required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
            </div>
            {mode !== "magic" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required minLength={6} />
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
            )}

            <Button type="submit" className="w-full shadow-glow" disabled={loading}>
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Magic Link"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            {mode !== "magic" && (
              <button onClick={() => setMode("magic")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Sparkles className="inline h-3 w-3 mr-1" /> Use magic link instead
              </button>
            )}
            <div className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>Don't have an account? <button onClick={() => setMode("signup")} className="text-primary hover:underline">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setMode("login")} className="text-primary hover:underline">Sign in</button></>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
