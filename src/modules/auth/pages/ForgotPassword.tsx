import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <GuzzlLogo size="xl" />
          <p className="text-sm text-muted-foreground mt-1">Reset your password</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm">Check your email for a password reset link.</p>
              <Link to="/auth"><Button variant="outline" className="w-full"><ArrowLeft className="h-4 w-4 mr-1" /> Back to login</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : "Send Reset Link"}
              </Button>
              <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:text-foreground">Back to login</Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
