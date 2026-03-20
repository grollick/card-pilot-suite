import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps page content with a lightweight fade+slide entrance.
 * Fast (200ms) so it feels snappy, not sluggish.
 */
export default function PageTransition({ children, className = "" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
