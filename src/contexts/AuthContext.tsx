import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  assessSignupRisk,
  recordSignupAttempt,
  generateFingerprint,
  getEmailDomain,
} from "@/utils/antiAbuse";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string, referralCode?: string) => {
    // Anti-abuse checks
    const risk = assessSignupRisk(email);
    const fingerprint = generateFingerprint();
    const domain = getEmailDomain(email);

    // Record attempt for rate limiting
    recordSignupAttempt();

    // Log abuse attempt (fire-and-forget, non-blocking)
    const ipHash = fingerprint; // Use fingerprint as proxy for IP in client-side
    supabase.from("signup_abuse_log").insert({
      ip_hash: ipHash,
      email_domain: domain,
      fingerprint_hash: fingerprint,
      email,
      risk_level: risk.level,
      flags: risk.flags,
      blocked: risk.blocked,
    }).then(() => {});

    // Block high-risk signups
    if (risk.blocked) {
      return { error: new Error("Signup temporarily unavailable. Please try again later.") };
    }

    // Warn on disposable emails
    if (risk.flags.includes("disposable_email")) {
      return { error: new Error("Please use a permanent email address. Temporary emails are not accepted.") };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: name || "", referred_by: referralCode || "" },
      },
    });
    return { error: error as Error | null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(() => ({
    session, user, loading, signUp, signIn, signInWithMagicLink, signOut,
  }), [session, user, loading, signUp, signIn, signInWithMagicLink, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
