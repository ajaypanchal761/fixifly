import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import AMC from "./pages/AMC";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import TipsTricks from "./pages/TipsTricks";
import TermsConditions from "./pages/TermsConditions";
import About from "./pages/About";
import RateUs from "./pages/RateUs";
import Shop from "./pages/Shop";
import ServicePage from "./pages/LaptopService";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import VendorDashboard from "./vendor/pages/VendorDashboard";
import VendorOrders from "./vendor/pages/VendorOrders";
import VendorCustomers from "./vendor/pages/VendorCustomers";
import VendorShop from "./vendor/pages/VendorShop";
import VendorSupport from "./vendor/pages/VendorSupport";
import VendorEarnings from "./vendor/pages/VendorEarnings";
import VendorProfile from "./vendor/pages/VendorProfile";
import VendorPrivacyPolicy from "./vendor/pages/VendorPrivacyPolicy";
import VendorPenaltyCharges from "./vendor/pages/VendorPenaltyCharges";
import VendorMyHub from "./vendor/pages/VendorMyHub";
import VendorTermsConditions from "./vendor/pages/VendorTermsConditions";
import VendorAbout from "./vendor/pages/VendorAbout";
import VendorSearchTasks from "./vendor/pages/VendorSearchTasks";
import VendorNotifications from "./vendor/pages/VendorNotifications";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isBookingPage = location.pathname === "/booking";
  const isProfilePage = location.pathname === "/profile";
  const isVendorPage = location.pathname.startsWith("/vendor");

  return (
    <div className="flex flex-col min-h-screen">
      {!isVendorPage && <Header />}
      <main className="flex-1 pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/amc" element={<AMC />} />
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tips" element={<TipsTricks />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/about" element={<About />} />
          <Route path="/rate" element={<RateUs />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/service/:serviceType" element={<ServicePage />} />
          {/* Vendor Routes */}
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />
          <Route path="/vendor/orders" element={<VendorOrders />} />
          <Route path="/vendor/customers" element={<VendorCustomers />} />
          <Route path="/vendor/shop" element={<VendorShop />} />
          <Route path="/vendor/support" element={<VendorSupport />} />
          <Route path="/vendor/earnings" element={<VendorEarnings />} />
          <Route path="/vendor/privacy" element={<VendorPrivacyPolicy />} />
          <Route path="/vendor/penalty" element={<VendorPenaltyCharges />} />
          <Route path="/vendor/hub" element={<VendorMyHub />} />
          <Route path="/vendor/terms" element={<VendorTermsConditions />} />
          <Route path="/vendor/about" element={<VendorAbout />} />
          <Route path="/vendor/search" element={<VendorSearchTasks />} />
          <Route path="/vendor/notifications" element={<VendorNotifications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isBookingPage && !isProfilePage && !isVendorPage && <Footer />}
      {!isVendorPage && <MobileBottomNav />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
