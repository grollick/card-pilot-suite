import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ClientProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [profileReady, setProfileReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    const setupProfile = async () => {
      try {
        // Ensure client profile exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke("client-auth", {
            body: { email: user.email, action: "setup-profile" },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
        setProfileReady(true);
      } catch {
        setProfileReady(true); // Continue anyway
      } finally {
        setChecking(false);
      }
    };

    setupProfile();
  }, [user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/client/auth" replace />;

  return <>{children}</>;
}
