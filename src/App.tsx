import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import PublicCard from "./pages/public/PublicCard";
import PublicBooking from "./pages/public/PublicBooking";
import QRLanding from "./pages/public/QRLanding";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/app/DashboardHome";
import CardBuilder from "./pages/app/CardBuilder";
import ContactsPage from "./pages/app/ContactsPage";
import ContactDetail from "./pages/app/ContactDetail";
import PipelinePage from "./pages/app/PipelinePage";
import TasksPage from "./pages/app/TasksPage";
import BookingManager from "./pages/app/BookingManager";
import EmailMarketing from "./pages/app/EmailMarketing";
import SocialScheduler from "./pages/app/SocialScheduler";
import ContentPage from "./pages/app/ContentPage";
import Analytics from "./pages/app/Analytics";
import AutomationPage from "./pages/app/AutomationPage";
import QRCampaignsPage from "./pages/app/QRCampaignsPage";
import SettingsPage from "./pages/app/SettingsPage";
import AdminPage from "./pages/app/AdminPage";
import TeamPage from "./pages/app/TeamPage";
import LeadsCRM from "./pages/app/LeadsCRM";

const queryClient = new QueryClient();

const App = () => (
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
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            } />

            {/* Public routes — no auth required, minimal data access */}
            <Route path="/q/:campaign" element={<QRLanding />} />
            <Route path="/book/:handle" element={<PublicBooking />} />

            {/* App dashboard — auth required */}
            <Route path="/app" element={
              <ProtectedRoute><DashboardLayout /></ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="card" element={<CardBuilder />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/:id" element={<ContactDetail />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="bookings" element={<BookingManager />} />
              <Route path="email" element={<EmailMarketing />} />
              <Route path="social" element={<SocialScheduler />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="automation" element={<AutomationPage />} />
              <Route path="qr-campaigns" element={<QRCampaignsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>

            {/* Public card — must be last to avoid catching other routes */}
            <Route path="/:handle" element={<PublicCard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
