import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AutomationPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"
      >
        <Zap className="h-8 w-8 text-primary" />
      </motion.div>
      <h1 className="text-2xl font-bold tracking-tight">Automation</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        Automate follow-ups, lead nurturing, and booking reminders. Set triggers based on contact actions and let CardPilot handle the rest.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="px-3 py-1.5 rounded-lg bg-muted">New Lead</span>
        <ArrowRight className="h-4 w-4" />
        <span className="px-3 py-1.5 rounded-lg bg-muted">Wait 1 hour</span>
        <ArrowRight className="h-4 w-4" />
        <span className="px-3 py-1.5 rounded-lg bg-muted">Send Email</span>
      </div>
      <Button disabled className="mt-4">
        Coming Soon
      </Button>
    </div>
  );
}
