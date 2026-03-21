import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  company: string;
  onNext: () => void;
}

export default function StepYoureLive({ company, onNext }: Props) {
  return (
    <motion.div
      key="youre-live"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="text-center space-y-6 py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
        className="mx-auto h-20 w-20 rounded-full flex items-center justify-center bg-success/10"
      >
        <CheckCircle2 className="h-10 w-10 text-success" />
      </motion.div>

      <div className="space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-foreground"
        >
          You're Live! 🎉
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground max-w-xs mx-auto"
        >
          {company
            ? `${company} is now discoverable — customers can find and contact you.`
            : "Customers can now find you and request your services."}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-3"
      >
        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happens next</p>
          <ul className="space-y-1.5 text-sm text-foreground text-left">
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span> Your card is published and shareable
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span> You can receive estimate requests
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span> You can edit everything anytime
            </li>
          </ul>
        </div>

        <Button onClick={onNext} size="lg" className="w-full h-12 text-base font-semibold gap-2">
          Continue <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
