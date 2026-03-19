import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// ── Public routes — most eagerly loaded for fast render ──
import LegalPage from "@/modules/public/pages/LegalPage";
import HandleOrSeoRoute from "@/modules/public/pages/HandleOrSeoRoute";

// ── Public routes — lazy loaded (heavier) ──
const PublicBooking = lazy(() => import("@/modules/public/pages/PublicBooking"));
const QRLanding = lazy(() => import("@/modules/public/pages/QRLanding"));
const ProductsPage = lazy(() => import("@/modules/public/pages/ProductsPage"));
const DiscoverPage = lazy(() => import("@/modules/public/pages/DiscoverPage"));
const OnDutyMapPage = lazy(() => import("@/modules/public/pages/OnDutyMapPage"));
const RequestServicePage = lazy(() => import("@/modules/public/pages/RequestServicePage"));
const PublicSite = lazy(() => import("@/modules/public/pages/PublicSite"));
const DemoCardPreview = lazy(() => import("@/modules/public/pages/DemoCardPreview"));

// Client Portal — loaded eagerly (public, token-based)
const ClientPortal = lazy(() => import("@/modules/portal/pages/ClientPortal"));
const PublicProjectPage = lazy(() => import("@/modules/public/pages/PublicProjectPage"));
const PublicInvoicePage = lazy(() => import("@/modules/public/pages/PublicInvoicePage"));

// Client Portal v2 — authenticated client dashboard
const ClientAuthPage = lazy(() => import("@/modules/client/pages/ClientAuthPage"));
const ClientDashboard = lazy(() => import("@/modules/client/pages/ClientDashboard"));
const ClientProtectedRoute = lazy(() => import("@/modules/client/components/ClientProtectedRoute"));

// ── Auth & marketing — loaded eagerly (small) ──
import LandingPage from "@/modules/landing/pages/LandingPage";
import IndustryLandingPage from "@/modules/landing/pages/IndustryLandingPage";
import PricingPage from "@/modules/pricing/pages/PricingPage";
import AuthPage from "@/modules/auth/pages/AuthPage";
import ForgotPassword from "@/modules/auth/pages/ForgotPassword";
import ResetPassword from "@/modules/auth/pages/ResetPassword";
import NotFound from "@/modules/shared/pages/NotFound";

// ── Onboarding ──
const Onboarding = lazy(() => import("@/modules/onboarding/pages/Onboarding"));

// ── Dashboard shell ──
const DashboardLayout = lazy(() => import("@/components/DashboardLayout"));

// ── Module pages — lazy loaded, auth-gated ──

// Dashboard
const DashboardHome = lazy(() => import("@/modules/dashboard/pages/DashboardHome"));

// Card Builder
const CardBuilder = lazy(() => import("@/modules/card/pages/CardBuilder"));
const QRBusinessCard = lazy(() => import("@/modules/card/pages/QRBusinessCard"));

// CRM
const ContactsPage = lazy(() => import("@/modules/crm/pages/ContactsPage"));
const ContactDetail = lazy(() => import("@/modules/crm/pages/ContactDetail"));
const PipelinePage = lazy(() => import("@/modules/crm/pages/PipelinePage"));
const TasksPage = lazy(() => import("@/modules/crm/pages/TasksPage"));
const ScanBusinessCard = lazy(() => import("@/modules/crm/pages/ScanBusinessCard"));

// Booking
const BookingManager = lazy(() => import("@/modules/booking/pages/BookingManager"));

// Estimates
const EstimatesPage = lazy(() => import("@/modules/estimates/pages/EstimatesPage"));

// Jobs
const JobsPage = lazy(() => import("@/modules/jobs/pages/JobsPage"));
const JobDetailPage = lazy(() => import("@/modules/jobs/pages/JobDetailPage"));
const JobPipelinePage = lazy(() => import("@/modules/jobs/pages/JobPipelinePage"));

// Invoices
const InvoicesPage = lazy(() => import("@/modules/invoices/pages/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("@/modules/invoices/pages/InvoiceDetailPage"));

// Recurring
const RecurringPlansPage = lazy(() => import("@/modules/recurring/pages/RecurringPlansPage"));
const RecurringPlanDetailPage = lazy(() => import("@/modules/recurring/pages/RecurringPlanDetailPage"));

// Marketing
const EmailMarketing = lazy(() => import("@/modules/marketing/pages/EmailMarketing"));
const SocialScheduler = lazy(() => import("@/modules/marketing/pages/SocialScheduler"));
const PostDesigner = lazy(() => import("@/modules/marketing/pages/PostDesigner"));
const ContentPage = lazy(() => import("@/modules/marketing/pages/ContentPage"));
const PromotionsPage = lazy(() => import("@/modules/marketing/pages/PromotionsPage"));
const ReferralsPage = lazy(() => import("@/modules/marketing/pages/ReferralsPage"));
const AutomationPage = lazy(() => import("@/modules/marketing/pages/AutomationPage"));
const AutoCampaignsPage = lazy(() => import("@/modules/marketing/pages/AutoCampaignsPage"));
const AutopilotPage = lazy(() => import("@/modules/automation/pages/AutopilotPage"));
const QRCampaignsPage = lazy(() => import("@/modules/marketing/pages/QRCampaignsPage"));
const BoostPage = lazy(() => import("@/modules/marketing/pages/BoostPage"));

// Analytics
const Analytics = lazy(() => import("@/modules/analytics/pages/Analytics"));
const GrowthDashboard = lazy(() => import("@/modules/analytics/pages/GrowthDashboard"));
const CardViewersPage = lazy(() => import("@/modules/analytics/pages/CardViewersPage"));
const RevenueForecast = lazy(() => import("@/modules/analytics/pages/RevenueForecast"));
const IndustryInsightsPage = lazy(() => import("@/modules/analytics/pages/IndustryInsightsPage"));

// Marketplace
const ProjectsPage = lazy(() => import("@/modules/marketplace/pages/ProjectsPage"));
const ReviewsPage = lazy(() => import("@/modules/marketplace/pages/ReviewsPage"));
const MarketplacePerformancePage = lazy(() => import("@/modules/marketplace/pages/MarketplacePerformancePage"));
const JobRequestsPage = lazy(() => import("@/modules/marketplace/pages/JobRequestsPage"));
const RequestStatusPage = lazy(() => import("@/modules/public/pages/RequestStatusPage"));

// AI Assistant
const AssistantPage = lazy(() => import("@/modules/assistant/pages/AssistantPage"));
const AgencyDashboard = lazy(() => import("@/modules/agency/pages/AgencyDashboard"));

// App Marketplace
const MarketplacePage = lazy(() => import("@/modules/apps/pages/MarketplacePage"));

// Team
const TeamManagementPage = lazy(() => import("@/modules/team/pages/TeamManagementPage"));
const TechDashboardPage = lazy(() => import("@/modules/team/pages/TechDashboardPage"));

// Settings
const SettingsPage = lazy(() => import("@/modules/settings/pages/SettingsPage"));
const AdminPage = lazy(() => import("@/modules/settings/pages/AdminPage"));
const PlatformAdminDashboard = lazy(() => import("@/modules/admin/pages/PlatformAdminDashboard"));
const LandingPageManager = lazy(() => import("@/modules/admin/pages/LandingPageManager"));
const SalesCrmPage = lazy(() => import("@/modules/admin/pages/SalesCrmPage"));
const UserPageBuilder = lazy(() => import("@/modules/website/pages/UserPageBuilder"));
const TeamPage = lazy(() => import("@/modules/settings/pages/TeamPage"));

// Help
const HelpCenter = lazy(() => import("@/modules/help/pages/HelpCenter"));

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

/** Wrap lazy-loaded routes in error boundary + suspense */
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LazyFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (auth, not found, validation)
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <ErrorBoundary fullPage>
  <ThemeProvider attribute="class" defaultTheme="light" storageKey="guzzl-pro-theme">
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
          <Routes>
            {/* Auth & marketing */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={
              <ProtectedRoute><LazyRoute><Onboarding /></LazyRoute></ProtectedRoute>
            } />

            {/* Industry landing pages */}
            <Route path="/for/:industry" element={<IndustryLandingPage />} />

            {/* Demo cards — no auth */}
            <Route path="/demo/:slug" element={<LazyRoute><DemoCardPreview /></LazyRoute>} />

            {/* Public routes — no auth required */}
            <Route path="/q/:campaign" element={<LazyRoute><QRLanding /></LazyRoute>} />
            <Route path="/book/:handle" element={<LazyRoute><PublicBooking /></LazyRoute>} />
            <Route path="/products" element={<LazyRoute><ProductsPage /></LazyRoute>} />
            <Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
            <Route path="/terms" element={<LegalPage pageKey="terms" />} />
            <Route path="/site/:handle" element={<LazyRoute><PublicSite /></LazyRoute>} />
            <Route path="/discover" element={<LazyRoute><DiscoverPage /></LazyRoute>} />
            <Route path="/discover/map" element={<LazyRoute><OnDutyMapPage /></LazyRoute>} />
            <Route path="/discover/:profession" element={<LazyRoute><DiscoverPage /></LazyRoute>} />
            <Route path="/discover/:profession/:city" element={<LazyRoute><DiscoverPage /></LazyRoute>} />
            <Route path="/request-service" element={<LazyRoute><RequestServicePage /></LazyRoute>} />
            <Route path="/request-status/:token" element={<LazyRoute><RequestStatusPage /></LazyRoute>} />
            <Route path="/project/:projectId" element={<LazyRoute><PublicProjectPage /></LazyRoute>} />
            <Route path="/portal/:token" element={<LazyRoute><ClientPortal /></LazyRoute>} />
            <Route path="/pay/:token" element={<LazyRoute><PublicInvoicePage /></LazyRoute>} />

            {/* Client Portal v2 — authenticated */}
            <Route path="/client/auth" element={<LazyRoute><ClientAuthPage /></LazyRoute>} />
            <Route path="/client" element={
              <LazyRoute>
                <Suspense fallback={<LazyFallback />}>
                  <ClientProtectedRoute>
                    <ClientDashboard />
                  </ClientProtectedRoute>
                </Suspense>
              </LazyRoute>
            } />

            <Route path="/app" element={
              <ProtectedRoute><LazyRoute><DashboardLayout /></LazyRoute></ProtectedRoute>
            }>
              <Route index element={<LazyRoute><DashboardHome /></LazyRoute>} />
              <Route path="dashboard" element={<LazyRoute><DashboardHome /></LazyRoute>} />
              <Route path="card/qr" element={<LazyRoute><QRBusinessCard /></LazyRoute>} />
              <Route path="card" element={<LazyRoute><CardBuilder /></LazyRoute>} />
              <Route path="contacts" element={<LazyRoute><ContactsPage /></LazyRoute>} />
              <Route path="contacts/:id" element={<LazyRoute><ContactDetail /></LazyRoute>} />
              <Route path="pipeline" element={<LazyRoute><PipelinePage /></LazyRoute>} />
              <Route path="tasks" element={<LazyRoute><TasksPage /></LazyRoute>} />
              <Route path="scan-card" element={<LazyRoute><ScanBusinessCard /></LazyRoute>} />
              <Route path="bookings" element={<LazyRoute><BookingManager /></LazyRoute>} />
              <Route path="email" element={<LazyRoute><EmailMarketing /></LazyRoute>} />
              <Route path="social" element={<LazyRoute><SocialScheduler /></LazyRoute>} />
              <Route path="post-designer" element={<LazyRoute><PostDesigner /></LazyRoute>} />
              <Route path="content" element={<LazyRoute><ContentPage /></LazyRoute>} />
              <Route path="analytics" element={<LazyRoute><Analytics /></LazyRoute>} />
              <Route path="growth" element={<LazyRoute><GrowthDashboard /></LazyRoute>} />
              <Route path="automation" element={<LazyRoute><AutomationPage /></LazyRoute>} />
              <Route path="auto-campaigns" element={<LazyRoute><AutoCampaignsPage /></LazyRoute>} />
              <Route path="autopilot" element={<LazyRoute><AutopilotPage /></LazyRoute>} />
              <Route path="qr-campaigns" element={<LazyRoute><QRCampaignsPage /></LazyRoute>} />
              <Route path="settings" element={<LazyRoute><SettingsPage /></LazyRoute>} />
              <Route path="team" element={<LazyRoute><TeamPage /></LazyRoute>} />
              <Route path="viewers" element={<LazyRoute><CardViewersPage /></LazyRoute>} />
              <Route path="revenue" element={<LazyRoute><RevenueForecast /></LazyRoute>} />
              <Route path="industry-insights" element={<LazyRoute><IndustryInsightsPage /></LazyRoute>} />
              <Route path="promotions" element={<LazyRoute><PromotionsPage /></LazyRoute>} />
              <Route path="referrals" element={<LazyRoute><ReferralsPage /></LazyRoute>} />
              <Route path="boost" element={<LazyRoute><BoostPage /></LazyRoute>} />
              <Route path="projects" element={<LazyRoute><ProjectsPage /></LazyRoute>} />
              <Route path="reviews" element={<LazyRoute><ReviewsPage /></LazyRoute>} />
              <Route path="marketplace-performance" element={<LazyRoute><MarketplacePerformancePage /></LazyRoute>} />
              <Route path="job-requests" element={<LazyRoute><JobRequestsPage /></LazyRoute>} />
              <Route path="estimates" element={<LazyRoute><EstimatesPage /></LazyRoute>} />
              <Route path="jobs" element={<LazyRoute><JobsPage /></LazyRoute>} />
              <Route path="jobs/:id" element={<LazyRoute><JobDetailPage /></LazyRoute>} />
              <Route path="job-pipeline" element={<LazyRoute><JobPipelinePage /></LazyRoute>} />
              <Route path="invoices" element={<LazyRoute><InvoicesPage /></LazyRoute>} />
              <Route path="invoices/:id" element={<LazyRoute><InvoiceDetailPage /></LazyRoute>} />
              <Route path="recurring" element={<LazyRoute><RecurringPlansPage /></LazyRoute>} />
              <Route path="recurring/:id" element={<LazyRoute><RecurringPlanDetailPage /></LazyRoute>} />
              <Route path="assistant" element={<LazyRoute><AssistantPage /></LazyRoute>} />
              <Route path="agency" element={<LazyRoute><AgencyDashboard /></LazyRoute>} />
              <Route path="marketplace" element={<LazyRoute><MarketplacePage /></LazyRoute>} />
              <Route path="admin" element={<LazyRoute><AdminPage /></LazyRoute>} />
              <Route path="platform-admin" element={<LazyRoute><PlatformAdminDashboard /></LazyRoute>} />
              <Route path="landing-pages" element={<LazyRoute><LandingPageManager /></LazyRoute>} />
              <Route path="page-builder" element={<LazyRoute><UserPageBuilder /></LazyRoute>} />
              <Route path="sales-crm" element={<LazyRoute><SalesCrmPage /></LazyRoute>} />
              <Route path="team-management" element={<LazyRoute><TeamManagementPage /></LazyRoute>} />
              <Route path="tech-dashboard" element={<LazyRoute><TechDashboardPage /></LazyRoute>} />
              <Route path="help" element={<LazyRoute><HelpCenter /></LazyRoute>} />
            </Route>

            {/* Public card OR SEO landing — smart routing */}
            <Route path="/:handle" element={<HandleOrSeoRoute />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
