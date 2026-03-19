import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ClientAuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await supabase.functions.invoke("client-auth", {
        body: { email: email.trim().toLowerCase(), action: "send-magic-link" },
      });

      if (res.error || res.data?.error) {
        toast.error(res.data?.error || "Failed to send login link");
        return;
      }

      setSent(true);
      toast.success("Login link sent! Check your email.");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Client Portal</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Access your bookings, services, and more — all in one place.
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-[hsl(var(--success))]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a login link to <span className="font-medium text-foreground">{email}</span>.
                  Click the link to access your portal.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-4"
              >
                Use a different email
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Enter the email you used when booking a service.
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 shadow-glow">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {loading ? "Sending..." : "Send Login Link"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by <span className="font-medium text-foreground">guzzl.pro</span>
        </p>
      </motion.div>
    </div>
  );
}
