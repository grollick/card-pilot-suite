import { motion } from "framer-motion";
import type { WidgetSize } from "../hooks/useDashboardLayout";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

const SIZE_CLASSES: Record<WidgetSize, string> = {
  full: "col-span-12",
  half: "col-span-12 lg:col-span-6",
  third: "col-span-12 lg:col-span-4",
  "two-thirds": "col-span-12 lg:col-span-8",
  "three-fifths": "col-span-12 lg:col-span-7",
  "two-fifths": "col-span-12 lg:col-span-5",
};

interface Props {
  size: WidgetSize;
  children: React.ReactNode;
  className?: string;
}

export default function DashboardWidgetWrapper({ size, children, className }: Props) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(SIZE_CLASSES[size], className)}
    >
      {children}
    </motion.div>
  );
}
