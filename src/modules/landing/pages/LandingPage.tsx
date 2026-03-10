import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PLAN_TIERS } from "@/lib/plans";
import HeroSection from "@/components/landing/HeroSection";
import ProfessionsBar from "@/components/landing/ProfessionsBar";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import QRProductsSection from "@/components/landing/QRProductsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FooterSection from "@/components/landing/FooterSection";

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
