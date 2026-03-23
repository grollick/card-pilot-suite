import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "@/components/TopBar";
import ProductTour from "@/components/ProductTour";
import FloatingHelpButton from "@/components/FloatingHelpButton";
import UpgradeTriggers from "@/components/UpgradeTriggers";
import BetaStatusBanner from "@/components/BetaStatusBanner";
import BetaFeedbackWidget from "@/components/BetaFeedbackWidget";
import PullToRefresh from "@/components/PullToRefresh";

export default function DashboardLayout() {
  const location = useLocation();

  useEffect(() => {
    const unlockPointerState = () => {
      const hasOpenDialog = !!document.querySelector('[role="dialog"][data-state="open"]');
      if (hasOpenDialog) return;

      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }

      if (document.documentElement.style.pointerEvents === "none") {
        document.documentElement.style.pointerEvents = "";
      }
    };

    unlockPointerState();
    const raf = window.requestAnimationFrame(unlockPointerState);
    const timeout = window.setTimeout(unlockPointerState, 120);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 overflow-auto flex flex-col min-w-0">
          <TopBar />
          <PullToRefresh>
            <div className="p-4 md:p-6 lg:p-8">
              <BetaStatusBanner />
              <Outlet />
            </div>
          </PullToRefresh>
        </div>
      </div>
      <ProductTour />
      <FloatingHelpButton />
      <UpgradeTriggers />
      <BetaFeedbackWidget />
    </SidebarProvider>
  );
}
