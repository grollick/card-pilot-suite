import { Lightbulb, Star, Image, CalendarCheck, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

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
      description: "Visual proof increases conversions by 40%",
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
      description: "Collect visitor info from your card",
      action: "Add form",
      present: hasSection("lead_form"),
    },
  ];

  const completedCount = tips.filter(t => t.present).length;
  const progress = Math.round((completedCount / tips.length) * 100);
  const missingTips = tips.filter(t => !t.present);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-warning/20 bg-warning/5 p-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="h-6 w-6 rounded-lg bg-warning/10 flex items-center justify-center">
          <Lightbulb className="h-3.5 w-3.5 text-warning" />
        </div>
        <h3 className="text-xs font-semibold">Conversion Score</h3>
        <span className="text-xs font-bold text-warning ml-auto">{progress}%</span>
      </div>

      <Progress value={progress} className="h-1.5 mb-3 bg-warning/10 [&>div]:bg-warning" />

      {completedCount === tips.length ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <p className="text-xs font-medium text-success">All conversion features enabled!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Show completed items */}
          {tips.filter(t => t.present).map((tip) => (
            <div key={tip.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg opacity-60">
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              <span className="text-xs text-muted-foreground line-through">{tip.title}</span>
            </div>
          ))}
          
          {/* Show missing items */}
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
      )}
    </motion.div>
  );
}
