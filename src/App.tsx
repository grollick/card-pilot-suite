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

// Public routes — loaded eagerly for fast <500ms render
import PublicBooking from "./pages/public/PublicBooking";
import QRLanding from "./pages/public/QRLanding";
import ProductsPage from "./pages/public/ProductsPage";
import DiscoverPage from "./pages/public/DiscoverPage";
import HandleOrSeoRoute from "./pages/public/HandleOrSeoRoute";

// Auth & marketing — loaded eagerly (small)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// App dashboard — lazy loaded (heavy, auth-gated)
const Onboarding = lazy(() => import("./pages/Onboarding"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const DashboardHome = lazy(() => import("./pages/app/DashboardHome"));
const CardBuilder = lazy(() => import("./pages/app/CardBuilder"));
const ContactsPage = lazy(() => import("./pages/app/ContactsPage"));
const ContactDetail = lazy(() => import("./pages/app/ContactDetail"));
const PipelinePage = lazy(() => import("./pages/app/PipelinePage"));
const TasksPage = lazy(() => import("./pages/app/TasksPage"));
const BookingManager = lazy(() => import("./pages/app/BookingManager"));
const EmailMarketing = lazy(() => import("./pages/app/EmailMarketing"));
const SocialScheduler = lazy(() => import("./pages/app/SocialScheduler"));
const ContentPage = lazy(() => import("./pages/app/ContentPage"));
const Analytics = lazy(() => import("./pages/app/Analytics"));
const AutomationPage = lazy(() => import("./pages/app/AutomationPage"));
const QRCampaignsPage = lazy(() => import("./pages/app/QRCampaignsPage"));
const SettingsPage = lazy(() => import("./pages/app/SettingsPage"));
const AdminPage = lazy(() => import("./pages/app/AdminPage"));
const TeamPage = lazy(() => import("./pages/app/TeamPage"));
const LeadsCRM = lazy(() => import("./pages/app/LeadsCRM"));
const CardViewersPage = lazy(() => import("./pages/app/CardViewersPage"));
const RevenueForecast = lazy(() => import("./pages/app/RevenueForecast"));
const PromotionsPage = lazy(() => import("./pages/app/PromotionsPage"));
const ReferralsPage = lazy(() => import("./pages/app/ReferralsPage"));

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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={
              <ProtectedRoute><Suspense fallback={<LazyFallback />}><Onboarding /></Suspense></ProtectedRoute>
            } />

            {/* Public routes — no auth required, minimal data access */}
            <Route path="/q/:campaign" element={<QRLanding />} />
            <Route path="/book/:handle" element={<PublicBooking />} />
            <Route path="/products" element={<ProductsPage />} />
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
              <Route path="admin" element={<Suspense fallback={<LazyFallback />}><AdminPage /></Suspense>} />
            </Route>

            {/* Public card OR SEO landing — smart routing by slug pattern */}
            <Route path="/:handle" element={<HandleOrSeoRoute />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
