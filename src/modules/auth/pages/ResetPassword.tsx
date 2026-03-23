import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/app");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/"><h1 className="text-2xl font-bold gradient-text"><span className="font-black text-primary text-4xl">guzzl</span>.pro</h1></Link>
          <p className="text-sm text-muted-foreground mt-1">Set your new password</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : "Update Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
