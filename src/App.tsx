import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import PublicCard from "./pages/public/PublicCard";
import PublicBooking from "./pages/public/PublicBooking";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/app/DashboardHome";
import CardBuilder from "./pages/app/CardBuilder";
import LeadsCRM from "./pages/app/LeadsCRM";
import BookingManager from "./pages/app/BookingManager";
import EmailMarketing from "./pages/app/EmailMarketing";
import SocialScheduler from "./pages/app/SocialScheduler";
import Analytics from "./pages/app/Analytics";
import SettingsPage from "./pages/app/SettingsPage";
import AdminPage from "./pages/app/AdminPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Dashboard */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="card" element={<CardBuilder />} />
            <Route path="leads" element={<LeadsCRM />} />
            <Route path="booking" element={<BookingManager />} />
            <Route path="email" element={<EmailMarketing />} />
            <Route path="social" element={<SocialScheduler />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Public */}
          <Route path="/:handle" element={<PublicCard />} />
          <Route path="/:handle/book" element={<PublicBooking />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
