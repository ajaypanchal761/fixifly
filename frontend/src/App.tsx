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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import VendorDashboard from "./vendor/pages/VendorDashboard";
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
import VendorTaskDetail from "./vendor/pages/VendorTaskDetail";
import VendorClosedTask from "./vendor/pages/VendorClosedTask";
import VendorClosedTaskDetail from "./vendor/pages/VendorClosedTaskDetail";
import VendorCancelledTaskDetail from "./vendor/pages/VendorCancelledTaskDetail";
import VendorTaskPreview from "./vendor/pages/VendorTaskPreview";
import VendorCancelTaskDetail from "./vendor/pages/VendorCancelTaskDetail";
import VendorRescheduleTask from "./vendor/pages/VendorRescheduleTask";
import VendorLogin from "./vendor/pages/VendorLogin";
import VendorSignup from "./vendor/pages/VendorSignup";
import VendorLanding from "./vendor/pages/VendorLanding";
import VendorProtectedRoute from "./vendor/components/VendorProtectedRoute";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUserManagement from "./admin/pages/AdminUserManagement";
import AdminVendorManagement from "./admin/pages/AdminVendorManagement";
import AdminServiceManagement from "./admin/pages/AdminServiceManagement";
import AdminBookingManagement from "./admin/pages/AdminBookingManagement";
import AdminPaymentManagement from "./admin/pages/AdminPaymentManagement";
import AdminProductManagement from "./admin/pages/AdminProductManagement";
import AdminCardManagement from "./admin/pages/AdminCardManagement";
import AdminBlogManagement from "./admin/pages/AdminBlogManagement";
import AdminAMCManagement from "./admin/pages/AdminAMCManagement";
import AdminSupportManagement from "./admin/pages/AdminSupportManagement";
import AdminAddCategory from "./admin/pages/AdminAddCategory";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isBookingPage = location.pathname === "/booking";
  const isProfilePage = location.pathname === "/profile";
  const isVendorPage = location.pathname.startsWith("/vendor");
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!isVendorPage && !isAdminPage && <Header />}
      <main className="flex-1 pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/signup" element={<VendorSignup />} />
          <Route path="/vendor/landing" element={<VendorLanding />} />
          
          {/* Protected Vendor Routes */}
          <Route path="/vendor" element={
            <VendorProtectedRoute>
              <VendorDashboard />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/profile" element={
            <VendorProtectedRoute>
              <VendorProfile />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/customers" element={
            <VendorProtectedRoute>
              <VendorCustomers />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/shop" element={
            <VendorProtectedRoute>
              <VendorShop />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/support" element={
            <VendorProtectedRoute>
              <VendorSupport />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/earnings" element={
            <VendorProtectedRoute>
              <VendorEarnings />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/privacy" element={
            <VendorProtectedRoute>
              <VendorPrivacyPolicy />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/penalty" element={
            <VendorProtectedRoute>
              <VendorPenaltyCharges />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/hub" element={
            <VendorProtectedRoute>
              <VendorMyHub />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/terms" element={
            <VendorProtectedRoute>
              <VendorTermsConditions />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/about" element={
            <VendorProtectedRoute>
              <VendorAbout />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/search" element={
            <VendorProtectedRoute>
              <VendorSearchTasks />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/notifications" element={
            <VendorProtectedRoute>
              <VendorNotifications />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId" element={
            <VendorProtectedRoute>
              <VendorTaskDetail />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/close" element={
            <VendorProtectedRoute>
              <VendorClosedTask />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/closed" element={
            <VendorProtectedRoute>
              <VendorClosedTaskDetail />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/cancelled" element={
            <VendorProtectedRoute>
              <VendorCancelledTaskDetail />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/cancel" element={
            <VendorProtectedRoute>
              <VendorCancelTaskDetail />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/reschedule" element={
            <VendorProtectedRoute>
              <VendorRescheduleTask />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor/task/:taskId/preview" element={
            <VendorProtectedRoute>
              <VendorTaskPreview />
            </VendorProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
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
              <AdminProductManagement />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/products/add-category" element={
            <AdminProtectedRoute>
              <AdminAddCategory />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/cards" element={
            <AdminProtectedRoute>
              <AdminCardManagement />
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
          <Route path="/admin/support" element={
            <AdminProtectedRoute>
              <AdminSupportManagement />
            </AdminProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isBookingPage && !isProfilePage && !isVendorPage && !isAdminPage && <Footer />}
      {!isVendorPage && !isAdminPage && <MobileBottomNav />}
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
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
