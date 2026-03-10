import { Lightbulb, Star, Image, CalendarCheck, MessageSquare, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ConversionTip {
  id: string;
  icon: typeof Star;
  title: string;
  description: string;
  action: string;
  route?: string;
  present: boolean;
}

interface ConversionTipsProps {
  sections: Array<{ id: string; enabled: boolean; content?: any }>;
}

export default function ConversionTips({ sections }: ConversionTipsProps) {
  const navigate = useNavigate();

  const hasSection = (id: string) => sections.some(s => s.id === id && s.enabled);
  const hasSectionContent = (id: string) => {
    const sec = sections.find(s => s.id === id);
    return sec?.enabled && sec?.content;
  };

  const tips: ConversionTip[] = [
    {
      id: "testimonials",
      icon: Star,
      title: "Add testimonials",
      description: "Cards with reviews get 3× more leads",
      action: "Add section",
      present: hasSection("testimonials"),
    },
    {
      id: "gallery",
      icon: Image,
      title: "Add gallery photos",
      description: "Visual proof of work increases conversions by 40%",
      action: "Add photos",
      present: hasSection("gallery"),
    },
    {
      id: "booking",
      icon: CalendarCheck,
      title: "Enable booking",
      description: "Direct scheduling captures leads faster",
      action: "Enable",
      route: "/app/bookings",
      present: hasSection("booking"),
    },
    {
      id: "lead_form",
      icon: MessageSquare,
      title: "Enable lead capture form",
      description: "Collect visitor info directly from your card",
      action: "Add form",
      present: hasSection("lead_form"),
    },
  ];

  const missingTips = tips.filter(t => !t.present);

  if (missingTips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-warning/20 bg-warning/5 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-warning/10 flex items-center justify-center">
          <Lightbulb className="h-3.5 w-3.5 text-warning" />
        </div>
        <h3 className="text-xs font-semibold">Conversion Tips</h3>
      </div>

      <div className="space-y-2">
        {missingTips.slice(0, 3).map((tip) => (
          <button
            key={tip.id}
            onClick={() => tip.route && navigate(tip.route)}
            className="flex items-start gap-2.5 w-full text-left p-2 rounded-lg hover:bg-warning/5 transition-colors group"
          >
            <tip.icon className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{tip.title}</p>
              <p className="text-[11px] text-muted-foreground">{tip.description}</p>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0 group-hover:text-warning transition-colors" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
