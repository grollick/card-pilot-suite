import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useProfileCache } from "@/hooks/useProfileCache";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: profile, isLoading: profileLoading, error: profileError } = useProfileCache();

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // If profile fetch failed, still allow access (don't block the app)
  if (profileError) {
    console.error("[ProtectedRoute] Profile fetch failed:", profileError);
    return <>{children}</>;
  }

  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
