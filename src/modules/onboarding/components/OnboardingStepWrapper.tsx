import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  stepKey: string;
}

export default function OnboardingStepWrapper({ children, stepKey }: Props) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {children}
    </motion.div>
  );
}
