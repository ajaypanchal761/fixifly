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

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isBookingPage = location.pathname === "/booking";
  const isProfilePage = location.pathname === "/profile";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isBookingPage && !isProfilePage && <Footer />}
      <MobileBottomNav />
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
