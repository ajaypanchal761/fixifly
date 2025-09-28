import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import AMC from "./pages/AMC";
import AMCPlanDetails from "./pages/AMCPlanDetails";
import AMCSubscribe from "./pages/AMCSubscribe";
import Support from "./pages/Support";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import TipsTricks from "./pages/TipsTricks";
import TermsConditions from "./pages/TermsConditions";
import About from "./pages/About";
import RateUs from "./pages/RateUs";
import Shop from "./pages/Shop";
import ServicePage from "./pages/LaptopService";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import SearchResults from "./pages/SearchResults";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import MobileAuthGuard from "./components/MobileAuthGuard";
import VendorDashboard from "./vendor/pages/VendorDashboard";
import VendorCustomers from "./vendor/pages/VendorCustomers";
import VendorShop from "./vendor/pages/VendorShop";
import VendorEarnings from "./vendor/pages/VendorEarnings";
import ErrorBoundary from "./vendor/components/ErrorBoundary";
import VendorProfile from "./vendor/pages/VendorProfile";
import VendorPrivacyPolicy from "./vendor/pages/VendorPrivacyPolicy";
import VendorPenaltyCharges from "./vendor/pages/VendorPenaltyCharges";
import VendorMyHub from "./vendor/pages/VendorMyHub";
import VendorTermsConditions from "./vendor/pages/VendorTermsConditions";
import VendorAbout from "./vendor/pages/VendorAbout";
import VendorSearchTasks from "./vendor/pages/VendorSearchTasks";
import VendorNotifications from "./vendor/pages/VendorNotifications";
import VendorTaskDetail from "./vendor/pages/VendorTaskDetail";
import VendorClosedTask from "./vendor/pages/VendorClosedTask";
import VendorClosedTaskDetail from "./vendor/pages/VendorClosedTaskDetail";
import VendorCancelledTaskDetail from "./vendor/pages/VendorCancelledTaskDetail";
import VendorTaskPreview from "./vendor/pages/VendorTaskPreview";
import VendorCancelTaskDetail from "./vendor/pages/VendorCancelTaskDetail";
import VendorRescheduleTask from "./vendor/pages/VendorRescheduleTask";
import VendorSupport from "./vendor/pages/VendorSupport";
import VendorLogin from "./vendor/pages/VendorLogin";
import VendorSignup from "./vendor/pages/VendorSignup";
import VendorLanding from "./vendor/pages/VendorLanding";
import VendorProtectedRoute from "./vendor/components/VendorProtectedRoute";
import VendorDepositProtectedRoute from "./vendor/components/VendorDepositProtectedRoute";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUserManagement from "./admin/pages/AdminUserManagement";
import AdminVendorManagement from "./admin/pages/AdminVendorManagement";
import AdminServiceManagement from "./admin/pages/AdminServiceManagement";
import AdminServiceManagementDashboard from "./admin/pages/AdminServiceManagementDashboard";
import AdminBookingManagement from "./admin/pages/AdminBookingManagement";
import AdminPaymentManagement from "./admin/pages/AdminPaymentManagement";
import AdminCardManagement from "./admin/pages/AdminCardManagement";
import AdminCityManagement from "./admin/pages/AdminCityManagement";
import AdminBlogManagement from "./admin/pages/AdminBlogManagement";
import AdminAMCManagement from "./admin/pages/AdminAMCManagement";
import AdminVendorWalletManagement from "./admin/pages/AdminVendorWalletManagement";
import AdminSupportManagement from "./admin/pages/AdminSupportManagement";
import AdminBannerManagement from "./admin/pages/AdminBannerManagement";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminSignup from "./admin/pages/AdminSignup";
import AdminProfile from "./admin/pages/AdminProfile";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { VendorProvider } from "./contexts/VendorContext";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isBookingPage = location.pathname === "/booking";
  const isProfilePage = location.pathname === "/profile";
  const isVendorPage = location.pathname.startsWith("/vendor");
  const isAdminPage = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";

  return (
    <div className="flex flex-col min-h-screen">
      {!isVendorPage && !isAdminPage && !isLoginPage && !isSignupPage && <Header />}
      <main className="flex-1 pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={
            <MobileAuthGuard>
              <Index />
            </MobileAuthGuard>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/booking" element={
            <MobileAuthGuard>
              <Booking />
            </MobileAuthGuard>
          } />
          <Route path="/amc" element={
            <MobileAuthGuard>
              <AMC />
            </MobileAuthGuard>
          } />
          <Route path="/amc/plan/:planId" element={
            <MobileAuthGuard>
              <AMCPlanDetails />
            </MobileAuthGuard>
          } />
          <Route path="/amc/subscribe/:planId" element={
            <MobileAuthGuard>
              <AMCSubscribe />
            </MobileAuthGuard>
          } />
          <Route path="/support" element={
            <MobileAuthGuard>
              <Support />
            </MobileAuthGuard>
          } />
          <Route path="/payment" element={
            <MobileAuthGuard>
              <Payment />
            </MobileAuthGuard>
          } />
          <Route path="/profile" element={
            <MobileAuthGuard>
              <Profile />
            </MobileAuthGuard>
          } />
          <Route path="/tips" element={
            <MobileAuthGuard>
              <TipsTricks />
            </MobileAuthGuard>
          } />
          <Route path="/terms-conditions" element={
            <MobileAuthGuard>
              <TermsConditions />
            </MobileAuthGuard>
          } />
          <Route path="/about" element={
            <MobileAuthGuard>
              <About />
            </MobileAuthGuard>
          } />
          <Route path="/rate" element={
            <MobileAuthGuard>
              <RateUs />
            </MobileAuthGuard>
          } />
          <Route path="/shop" element={
            <MobileAuthGuard>
              <Shop />
            </MobileAuthGuard>
          } />
          <Route path="/search" element={
            <MobileAuthGuard>
              <SearchResults />
            </MobileAuthGuard>
          } />
          <Route path="/service/:serviceType" element={
            <MobileAuthGuard>
              <ServicePage />
            </MobileAuthGuard>
          } />
          <Route path="/product/:productId" element={
            <MobileAuthGuard>
              <ProductDetail />
            </MobileAuthGuard>
          } />
          <Route path="/checkout" element={
            <MobileAuthGuard>
              <Checkout />
            </MobileAuthGuard>
          } />
          {/* Vendor Routes */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/signup" element={<VendorSignup />} />
          <Route path="/vendor/landing" element={<VendorLanding />} />
          
          {/* Protected Vendor Routes */}
          <Route path="/vendor" element={
            <VendorDepositProtectedRoute>
              <VendorDashboard />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/profile" element={
            <VendorDepositProtectedRoute>
              <VendorProfile />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/customers" element={
            <VendorDepositProtectedRoute>
              <VendorCustomers />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/shop" element={
            <VendorDepositProtectedRoute>
              <VendorShop />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/earnings" element={
            <VendorProtectedRoute>
              <ErrorBoundary>
                <VendorEarnings />
              </ErrorBoundary>
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/support" element={
            <VendorProtectedRoute>
              <VendorSupport />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/privacy" element={
            <VendorDepositProtectedRoute>
              <VendorPrivacyPolicy />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/penalty" element={
            <VendorDepositProtectedRoute>
              <VendorPenaltyCharges />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/hub" element={
            <VendorDepositProtectedRoute>
              <VendorMyHub />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/terms" element={
            <VendorDepositProtectedRoute>
              <VendorTermsConditions />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/about" element={
            <VendorDepositProtectedRoute>
              <VendorAbout />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/search" element={
            <VendorDepositProtectedRoute>
              <VendorSearchTasks />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/notifications" element={
            <VendorDepositProtectedRoute>
              <VendorNotifications />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId" element={
            <VendorDepositProtectedRoute>
              <VendorTaskDetail />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/close" element={
            <VendorDepositProtectedRoute>
              <VendorClosedTask />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/closed" element={
            <VendorDepositProtectedRoute>
              <VendorClosedTaskDetail />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/cancelled" element={
            <VendorDepositProtectedRoute>
              <VendorCancelledTaskDetail />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/cancel" element={
            <VendorDepositProtectedRoute>
              <VendorCancelTaskDetail />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/reschedule" element={
            <VendorDepositProtectedRoute>
              <VendorRescheduleTask />
            </VendorDepositProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/preview" element={
            <VendorDepositProtectedRoute>
              <VendorTaskPreview />
            </VendorDepositProtectedRoute>
          } />
          
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <AdminUserManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/vendors" element={
            <AdminProtectedRoute>
              <AdminVendorManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <AdminProtectedRoute>
              <AdminServiceManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/service-management" element={
            <AdminProtectedRoute>
              <AdminServiceManagementDashboard />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/payment-management" element={
            <AdminProtectedRoute>
              <AdminPaymentManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <AdminProtectedRoute>
              <AdminBookingManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <AdminProtectedRoute>
              <AdminPaymentManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <AdminProtectedRoute>
              <AdminServiceManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminProtectedRoute>
              <AdminServiceManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/cards" element={
            <AdminProtectedRoute>
              <AdminCardManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/cities" element={
            <AdminProtectedRoute>
              <AdminCityManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/blogs" element={
            <AdminProtectedRoute>
              <AdminBlogManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/amc" element={
            <AdminProtectedRoute>
              <AdminAMCManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/vendor-wallet" element={
            <AdminProtectedRoute>
              <AdminVendorWalletManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/support" element={
            <AdminProtectedRoute>
              <AdminSupportManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/banners" element={
            <AdminProtectedRoute>
              <AdminBannerManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <AdminProtectedRoute>
              <AdminProfile />
            </AdminProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isBookingPage && !isProfilePage && !isVendorPage && !isAdminPage && <Footer />}
      {!isVendorPage && !isAdminPage && !isLoginPage && !isSignupPage && <MobileBottomNav />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <VendorProvider>
            <AppContent />
          </VendorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
