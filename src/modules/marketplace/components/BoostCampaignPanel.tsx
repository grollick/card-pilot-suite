import { useState } from "react";
import { Rocket, TrendingUp, Eye, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const BOOST_OPTIONS = [
  {
    id: "weekly",
    label: "Weekly Boost",
    price: "$9",
    period: "/week",
    multiplier: "2×",
    description: "Appear higher in search results for 7 days",
    benefits: ["2× profile visibility", "Priority in category pages", "Boosted badge on profile"],
  },
  {
    id: "monthly",
    label: "Monthly Boost",
    price: "$29",
    period: "/month",
    multiplier: "3×",
    popular: true,
    description: "Maximum exposure for 30 days — best value",
    benefits: ["3× profile visibility", "Featured on homepage", "Priority in all searches", "Boosted badge on profile"],
  },
];

export default function BoostCampaignPanel() {
  const [selected, setSelected] = useState("monthly");
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Boost Your Profile</h2>
        </div>
        <p className="text-sm text-muted-foreground">Get more customers by increasing your visibility in search results.</p>
      </div>

      {/* Visibility preview */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Current visibility</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/4 rounded-full bg-muted-foreground/40" />
              </div>
              <span className="text-xs text-muted-foreground">Standard</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center my-2">
          <TrendingUp className="h-4 w-4 text-success" />
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
            <Zap className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">With {selected === "monthly" ? "Monthly" : "Weekly"} Boost</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full bg-success ${selected === "monthly" ? "w-full" : "w-2/3"}`} />
              </div>
              <span className="text-xs font-medium text-success">{selected === "monthly" ? "3×" : "2×"} visibility</span>
            </div>
          </div>
        </div>
      </div>

      {/* Boost options */}
      <div className="p-5 space-y-3">
        {BOOST_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected === opt.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{opt.label}</span>
                {opt.popular && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Best Value</Badge>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground">{opt.price}</span>
                <span className="text-xs text-muted-foreground">{opt.period}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{opt.description}</p>
            <div className="space-y-1">
              {opt.benefits.map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-success flex-shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </button>
        ))}

        <Button
          className="w-full"
          onClick={() => {
            toast.success(`${selected === "monthly" ? "Monthly" : "Weekly"} Boost activated!`);
          }}
        >
          <Rocket className="h-4 w-4 mr-2" />
          Activate {selected === "monthly" ? "Monthly" : "Weekly"} Boost
        </Button>

        <p className="text-[11px] text-center text-muted-foreground">
          Cancel anytime. Boost starts immediately after activation.
        </p>
      </div>
    </div>
  );
}
