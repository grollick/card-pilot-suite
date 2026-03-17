import { PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

interface HelpVideoCardProps {
  title: string;
  description: string;
  duration?: string;
  thumbnail?: string;
}

export default function HelpVideoCard({ title, description, duration = "2 min" }: HelpVideoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Thumbnail placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
          <PlayCircle className="h-6 w-6 text-primary" />
        </div>
        <span className="absolute bottom-2 right-2 text-2xs bg-black/60 text-white px-2 py-0.5 rounded-md font-medium">
          {duration}
        </span>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold text-foreground mb-0.5">{title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </motion.div>
  );
}
