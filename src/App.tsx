import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// ── Public routes — loaded eagerly for fast <500ms render ──
import PublicBooking from "@/modules/public/pages/PublicBooking";
import QRLanding from "@/modules/public/pages/QRLanding";
import ProductsPage from "@/modules/public/pages/ProductsPage";
import DiscoverPage from "@/modules/public/pages/DiscoverPage";
import HandleOrSeoRoute from "@/modules/public/pages/HandleOrSeoRoute";
import PublicSite from "@/modules/public/pages/PublicSite";

// ── Auth & marketing — loaded eagerly (small) ──
import LandingPage from "@/modules/landing/pages/LandingPage";
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

// CRM
const ContactsPage = lazy(() => import("@/modules/crm/pages/ContactsPage"));
const ContactDetail = lazy(() => import("@/modules/crm/pages/ContactDetail"));
const PipelinePage = lazy(() => import("@/modules/crm/pages/PipelinePage"));
const TasksPage = lazy(() => import("@/modules/crm/pages/TasksPage"));

// Booking
const BookingManager = lazy(() => import("@/modules/booking/pages/BookingManager"));

// Estimates
const EstimatesPage = lazy(() => import("@/modules/estimates/pages/EstimatesPage"));

// Jobs
const JobsPage = lazy(() => import("@/modules/jobs/pages/JobsPage"));
const JobDetailPage = lazy(() => import("@/modules/jobs/pages/JobDetailPage"));

// Marketing
const EmailMarketing = lazy(() => import("@/modules/marketing/pages/EmailMarketing"));
const SocialScheduler = lazy(() => import("@/modules/marketing/pages/SocialScheduler"));
const ContentPage = lazy(() => import("@/modules/marketing/pages/ContentPage"));
const PromotionsPage = lazy(() => import("@/modules/marketing/pages/PromotionsPage"));
const ReferralsPage = lazy(() => import("@/modules/marketing/pages/ReferralsPage"));
const AutomationPage = lazy(() => import("@/modules/marketing/pages/AutomationPage"));
const QRCampaignsPage = lazy(() => import("@/modules/marketing/pages/QRCampaignsPage"));

// Analytics
const Analytics = lazy(() => import("@/modules/analytics/pages/Analytics"));
const CardViewersPage = lazy(() => import("@/modules/analytics/pages/CardViewersPage"));
const RevenueForecast = lazy(() => import("@/modules/analytics/pages/RevenueForecast"));

// Marketplace
const ProjectsPage = lazy(() => import("@/modules/marketplace/pages/ProjectsPage"));
const ReviewsPage = lazy(() => import("@/modules/marketplace/pages/ReviewsPage"));

// AI Assistant
const AssistantPage = lazy(() => import("@/modules/assistant/pages/AssistantPage"));
const AgencyDashboard = lazy(() => import("@/modules/agency/pages/AgencyDashboard"));

// App Marketplace
const MarketplacePage = lazy(() => import("@/modules/apps/pages/MarketplacePage"));

// Settings
const SettingsPage = lazy(() => import("@/modules/settings/pages/SettingsPage"));
const AdminPage = lazy(() => import("@/modules/settings/pages/AdminPage"));
const TeamPage = lazy(() => import("@/modules/settings/pages/TeamPage"));

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={
              <ProtectedRoute><Suspense fallback={<LazyFallback />}><Onboarding /></Suspense></ProtectedRoute>
            } />

            {/* Public routes — no auth required */}
            <Route path="/q/:campaign" element={<QRLanding />} />
            <Route path="/book/:handle" element={<PublicBooking />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/site/:handle" element={<PublicSite />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/discover/:profession" element={<DiscoverPage />} />
            <Route path="/discover/:profession/:city" element={<DiscoverPage />} />

            {/* App dashboard — auth required, lazy loaded */}
            <Route path="/app" element={
              <ProtectedRoute><Suspense fallback={<LazyFallback />}><DashboardLayout /></Suspense></ProtectedRoute>
            }>
              <Route index element={<Suspense fallback={<LazyFallback />}><DashboardHome /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<LazyFallback />}><DashboardHome /></Suspense>} />
              <Route path="card" element={<Suspense fallback={<LazyFallback />}><CardBuilder /></Suspense>} />
              <Route path="contacts" element={<Suspense fallback={<LazyFallback />}><ContactsPage /></Suspense>} />
              <Route path="contacts/:id" element={<Suspense fallback={<LazyFallback />}><ContactDetail /></Suspense>} />
              <Route path="pipeline" element={<Suspense fallback={<LazyFallback />}><PipelinePage /></Suspense>} />
              <Route path="tasks" element={<Suspense fallback={<LazyFallback />}><TasksPage /></Suspense>} />
              <Route path="bookings" element={<Suspense fallback={<LazyFallback />}><BookingManager /></Suspense>} />
              <Route path="email" element={<Suspense fallback={<LazyFallback />}><EmailMarketing /></Suspense>} />
              <Route path="social" element={<Suspense fallback={<LazyFallback />}><SocialScheduler /></Suspense>} />
              <Route path="content" element={<Suspense fallback={<LazyFallback />}><ContentPage /></Suspense>} />
              <Route path="analytics" element={<Suspense fallback={<LazyFallback />}><Analytics /></Suspense>} />
              <Route path="automation" element={<Suspense fallback={<LazyFallback />}><AutomationPage /></Suspense>} />
              <Route path="qr-campaigns" element={<Suspense fallback={<LazyFallback />}><QRCampaignsPage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<LazyFallback />}><SettingsPage /></Suspense>} />
              <Route path="team" element={<Suspense fallback={<LazyFallback />}><TeamPage /></Suspense>} />
              <Route path="viewers" element={<Suspense fallback={<LazyFallback />}><CardViewersPage /></Suspense>} />
              <Route path="revenue" element={<Suspense fallback={<LazyFallback />}><RevenueForecast /></Suspense>} />
              <Route path="promotions" element={<Suspense fallback={<LazyFallback />}><PromotionsPage /></Suspense>} />
              <Route path="referrals" element={<Suspense fallback={<LazyFallback />}><ReferralsPage /></Suspense>} />
              <Route path="projects" element={<Suspense fallback={<LazyFallback />}><ProjectsPage /></Suspense>} />
              <Route path="reviews" element={<Suspense fallback={<LazyFallback />}><ReviewsPage /></Suspense>} />
              <Route path="estimates" element={<Suspense fallback={<LazyFallback />}><EstimatesPage /></Suspense>} />
              <Route path="jobs" element={<Suspense fallback={<LazyFallback />}><JobsPage /></Suspense>} />
              <Route path="jobs/:id" element={<Suspense fallback={<LazyFallback />}><JobDetailPage /></Suspense>} />
              <Route path="assistant" element={<Suspense fallback={<LazyFallback />}><AssistantPage /></Suspense>} />
              <Route path="agency" element={<Suspense fallback={<LazyFallback />}><AgencyDashboard /></Suspense>} />
              <Route path="marketplace" element={<Suspense fallback={<LazyFallback />}><MarketplacePage /></Suspense>} />
              <Route path="admin" element={<Suspense fallback={<LazyFallback />}><AdminPage /></Suspense>} />
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
);

export default App;
