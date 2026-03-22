import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import TopBar from "@/components/TopBar";
import ProductTour from "@/components/ProductTour";
import FloatingHelpButton from "@/components/FloatingHelpButton";
import UpgradeTriggers from "@/components/UpgradeTriggers";
import BetaStatusBanner from "@/components/BetaStatusBanner";
import BetaFeedbackWidget from "@/components/BetaFeedbackWidget";
import PullToRefresh from "@/components/PullToRefresh";
import ScreenshotTool from "@/components/ScreenshotTool";
import { useIsAdmin } from "@/hooks/useAdminStats";

export default function DashboardLayout() {
  const { data: isAdmin } = useIsAdmin();

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
      {isAdmin && <ScreenshotTool />}
    </SidebarProvider>
  );
}
