import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PLAN_TIERS } from "@/lib/plans";
import HeroSection from "@/modules/landing/components/HeroSection";
import ProfessionsBar from "@/modules/landing/components/ProfessionsBar";
import HowItWorksSection from "@/modules/landing/components/HowItWorksSection";
import FeaturesSection from "@/modules/landing/components/FeaturesSection";
import WorkflowSection from "@/modules/landing/components/WorkflowSection";
import QRProductsSection from "@/modules/landing/components/QRProductsSection";
import TestimonialsSection from "@/modules/landing/components/TestimonialsSection";
import PricingSection from "@/modules/landing/components/PricingSection";
import FooterSection from "@/modules/landing/components/FooterSection";

export default function Index() {
  const visiblePlans = PLAN_TIERS.filter((p) => p.key !== "agency");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            <span className="gradient-text">CardPilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/products">
              <Button variant="ghost" size="sm">Products</Button>
            </Link>
            <a href="#pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </a>
            <Link to="/auth">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow">
                Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <ProfessionsBar />
      <HowItWorksSection />
      <FeaturesSection />
      <WorkflowSection />
      <QRProductsSection />
      <TestimonialsSection />
      <PricingSection visiblePlans={visiblePlans} />
      <FooterSection />
    </div>
  );
}
