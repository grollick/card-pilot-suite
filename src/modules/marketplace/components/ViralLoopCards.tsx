import { motion } from "framer-motion";
import { ArrowRight, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * Shown to customers after a lead submission or booking.
 * Drives re-engagement + new provider signups.
 */
export function CustomerViralLoop() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4 mt-6"
    >
      {/* Customer re-engagement */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Search className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Need another service?</h3>
            <p className="text-xs text-muted-foreground">Find more trusted pros near you</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {["Plumbing", "Electrical", "Cleaning", "Moving"].map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/marketplace/category/${cat.toLowerCase()}`)}
              className="px-3 py-1.5 text-xs rounded-full border border-border bg-muted/50 text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/marketplace")}>
          Explore more services <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Provider acquisition */}
      <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Are you a service provider?</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Create your own guzzl card and start getting customers — it's free.
        </p>
        <Button size="sm" onClick={() => navigate("/auth?signup=true")}>
          Create Your Free Card <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Compact inline provider CTA for embedding in post-booking or post-lead pages.
 */
export function ProviderSignupBanner() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center justify-between gap-3 p-4 rounded-xl border border-primary/10 bg-primary/[0.03]"
    >
      <div className="flex items-center gap-2.5">
        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Service provider?</span> Create your free guzzl card
        </p>
      </div>
      <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => navigate("/auth?signup=true")}>
        Get Started
      </Button>
    </motion.div>
  );
}
