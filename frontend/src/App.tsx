import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, Suspense } from "react";
import { useUserPushNotifications } from "./hooks/useUserPushNotifications";
// Import mandatory deposit handler to fix the error
import "./services/mandatoryDepositHandler";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import AMC from "./pages/AMC";
import AMCPlanDetails from "./pages/AMCPlanDetails";
import AMCSubscribe from "./pages/AMCSubscribe";
import Support from "./pages/Support";
import Payment from "./pages/Payment";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import TipsTricks from "./pages/TipsTricks";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefundPolicy from "./pages/CancellationRefundPolicy";
import About from "./pages/About";
import Reschedule from "./pages/Reschedule";
import LaptopService from "./pages/LaptopService";
import RateUs from "./pages/RateUs";
import Shop from "./pages/Shop";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import MobileBottomNav from "./components/MobileBottomNav";
import { AuthProvider } from "./contexts/AuthContext";
import { VendorProvider } from "./contexts/VendorContext";
import MobileAuthGuard from "./components/MobileAuthGuard";

// Admin imports
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUserManagement from "./admin/pages/AdminUserManagement";
import AdminVendorManagement from "./admin/pages/AdminVendorManagement";
import AdminBookingManagement from "./admin/pages/AdminBookingManagement";
import AdminBlogManagement from "./admin/pages/AdminBlogManagement";
import AdminBannerManagement from "./admin/pages/AdminBannerManagement";
import AdminVendorWalletManagement from "./admin/pages/AdminVendorWalletManagement";
import AdminPushNotificationManagement from "./admin/pages/AdminPushNotificationManagement";
import AdminAMCManagement from "./admin/pages/AdminAMCManagement";
import AdminSupportManagement from "./admin/pages/AdminSupportManagement";
import AdminServiceManagement from "./admin/pages/AdminServiceManagement";
import AdminServiceManagementDashboard from "./admin/pages/AdminServiceManagementDashboard";
import AdminPaymentManagement from "./admin/pages/AdminPaymentManagement";
import AdminCardManagement from "./admin/pages/AdminCardManagement";
import AdminCityManagement from "./admin/pages/AdminCityManagement";
import AdminProfile from "./admin/pages/AdminProfile";
import AdminSignup from "./admin/pages/AdminSignup";

// Vendor imports
import VendorLogin from "./vendor/pages/VendorLogin";
import VendorSignup from "./vendor/pages/VendorSignup";
import VendorVerification from "./vendor/pages/VendorVerification";
import VendorVerified from "./vendor/pages/VendorVerified";
import VendorDashboard from "./vendor/pages/VendorDashboard";
import VendorProfile from "./vendor/pages/VendorProfile";
import VendorEarnings from "./vendor/pages/VendorEarnings";
import VendorNotifications from "./vendor/pages/VendorNotifications";
import VendorSupport from "./vendor/pages/VendorSupport";
import VendorShop from "./vendor/pages/VendorShop";
import VendorTaskDetail from "./vendor/pages/VendorTaskDetail";
import VendorTaskPreview from "./vendor/pages/VendorTaskPreview";
import VendorRescheduleTask from "./vendor/pages/VendorRescheduleTask";
import VendorCancelTaskDetail from "./vendor/pages/VendorCancelTaskDetail";
import VendorCancelledTaskDetail from "./vendor/pages/VendorCancelledTaskDetail";
import VendorClosedTask from "./vendor/pages/VendorClosedTask";
import VendorClosedTaskDetail from "./vendor/pages/VendorClosedTaskDetail";
import VendorPrivacy from "./vendor/pages/VendorPrivacyPolicy";
import VendorTermsConditions from "./vendor/pages/VendorTermsConditions";
import VendorDepositPenalty from "./vendor/pages/VendorDepositPenalty";
import VendorAbout from "./vendor/pages/VendorAbout";
import VendorPenaltyCharges from "./vendor/pages/VendorPenaltyCharges";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isVendorRoute = location.pathname.startsWith('/vendor');
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  const isAuthPage = isLoginPage || isSignupPage;
  
  // Initialize user push notifications
  useUserPushNotifications();

  return (
    <div className="min-h-screen bg-background">
      {!isAdminRoute && !isVendorRoute && !isAuthPage && <Header />}
      
      <Routes>
        {/* ================== PUBLIC ROUTES ================== */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/laptop-service" element={<LaptopService />} />
        
        {/* ================== ADMIN AUTH ROUTES ================== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        
        {/* ================== VENDOR AUTH ROUTES ================== */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/signup" element={<VendorSignup />} />
        <Route path="/vendor/verification" element={<VendorVerification />} />
        <Route path="/vendor/verified" element={<VendorVerified />} />

        {/* ================== PROTECTED USER ROUTES ================== */}
        <Route path="/booking" element={<MobileAuthGuard><Booking /></MobileAuthGuard>} />
        <Route path="/checkout" element={<MobileAuthGuard><Checkout /></MobileAuthGuard>} />
        <Route path="/reschedule" element={<MobileAuthGuard><Reschedule /></MobileAuthGuard>} />
        
        {/* AMC Routes */}
        <Route path="/amc" element={<MobileAuthGuard><AMC /></MobileAuthGuard>} />
        <Route path="/amc/plan/:planId" element={<MobileAuthGuard><AMCPlanDetails /></MobileAuthGuard>} />
        <Route path="/amc/subscribe/:planId" element={<MobileAuthGuard><AMCSubscribe /></MobileAuthGuard>} />
        
        {/* Support Routes */}
        <Route path="/support" element={<MobileAuthGuard><Support /></MobileAuthGuard>} />
        <Route path="/payment" element={<MobileAuthGuard><Payment /></MobileAuthGuard>} />
        
        {/* Profile & Settings Routes */}
        <Route path="/profile" element={<MobileAuthGuard><Profile /></MobileAuthGuard>} />
        <Route path="/notifications" element={<MobileAuthGuard><Notifications /></MobileAuthGuard>} />
        
        {/* Information Pages Routes */}
        <Route path="/tips-tricks" element={<MobileAuthGuard><TipsTricks /></MobileAuthGuard>} />
        <Route path="/tips" element={<MobileAuthGuard><TipsTricks /></MobileAuthGuard>} />
        <Route path="/terms-conditions" element={<MobileAuthGuard><TermsConditions /></MobileAuthGuard>} />
        <Route path="/privacy-policy" element={<MobileAuthGuard><PrivacyPolicy /></MobileAuthGuard>} />
        <Route path="/cancellation-refund-policy" element={<MobileAuthGuard><CancellationRefundPolicy /></MobileAuthGuard>} />
        <Route path="/about" element={<MobileAuthGuard><About /></MobileAuthGuard>} />
        <Route path="/rate-us" element={<MobileAuthGuard><RateUs /></MobileAuthGuard>} />
        <Route path="/rate" element={<MobileAuthGuard><RateUs /></MobileAuthGuard>} />
        <Route path="/shop" element={<MobileAuthGuard><Shop /></MobileAuthGuard>} />

        {/* ================== ADMIN PROTECTED ROUTES ================== */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        
        {/* User Management */}
        <Route path="/admin/users" element={<AdminUserManagement />} />
        
        {/* Vendor Management */}
        <Route path="/admin/vendors" element={<AdminVendorManagement />} />
        <Route path="/admin/vendor-wallet" element={<AdminVendorWalletManagement />} />
        
        {/* Service Management */}
        <Route path="/admin/service-management" element={<AdminServiceManagementDashboard />} />
        <Route path="/admin/products" element={<AdminServiceManagement />} />
        <Route path="/admin/bookings" element={<AdminBookingManagement />} />
        
        {/* Financial Management */}
        <Route path="/admin/payment-management" element={<AdminPaymentManagement />} />
        <Route path="/admin/wallets" element={<AdminVendorWalletManagement />} />
        
        {/* Content Management */}
        <Route path="/admin/blogs" element={<AdminBlogManagement />} />
        <Route path="/admin/banners" element={<AdminBannerManagement />} />
        <Route path="/admin/cards" element={<AdminCardManagement />} />
        
        {/* Location & Products */}
        <Route path="/admin/cities" element={<AdminCityManagement />} />
        
        {/* AMC Management */}
        <Route path="/admin/amc" element={<AdminAMCManagement />} />
        
        {/* Support Management */}
        <Route path="/admin/support" element={<AdminSupportManagement />} />
        
        {/* Communication */}
        <Route path="/admin/push-notifications" element={<AdminPushNotificationManagement />} />
        <Route path="/admin/notifications" element={<AdminPushNotificationManagement />} />

        {/* ================== VENDOR PROTECTED ROUTES ================== */}
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/profile" element={<VendorProfile />} />
        <Route path="/vendor/earnings" element={<VendorEarnings />} />
        <Route path="/vendor/notifications" element={<VendorNotifications />} />
        <Route path="/vendor/support" element={<VendorSupport />} />
        <Route path="/vendor/shop" element={<VendorShop />} />
        <Route path="/vendor/privacy" element={<VendorPrivacy />} />
        <Route path="/vendor/terms" element={<VendorTermsConditions />} />
        <Route path="/vendor/deposit-penalty" element={<VendorDepositPenalty />} />
        <Route path="/vendor/about" element={<VendorAbout />} />
        <Route path="/vendor/penalty" element={<VendorPenaltyCharges />} />
        
        {/* Vendor Task Routes */}
        <Route path="/vendor/task/:taskId" element={<VendorTaskDetail />} />
        <Route path="/vendor/task/:taskId/preview" element={<VendorTaskPreview />} />
        <Route path="/vendor/task/:taskId/reschedule" element={<VendorRescheduleTask />} />
        <Route path="/vendor/task/:taskId/cancel" element={<VendorCancelTaskDetail />} />
        <Route path="/vendor/task/:taskId/cancelled" element={<VendorCancelledTaskDetail />} />
        <Route path="/vendor/task/:taskId/close" element={<VendorClosedTask />} />
        <Route path="/vendor/task/:taskId/closed" element={<VendorClosedTaskDetail />} />
        
        {/* ================== 404 ROUTE ================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {!isAdminRoute && !isVendorRoute && !isAuthPage && !isLoginPage && !isSignupPage && <MobileBottomNav />}
    </div>
  );
};

const App = () => {
  useEffect(() => {
    // App initialized - push notifications enabled
    console.log('✅ App initialized - push notifications enabled');
    console.log('🔍 Checking for TooltipProvider issues...');
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      import('./serviceWorkerRegistration').then(({ register }) => {
        register();
      });
    }
    
    // Debug mobile webview detection
    const isMobileWebView = /wv|WebView/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    console.log('📱 Mobile WebView detected:', isMobileWebView);
    console.log('📱 PWA mode detected:', isPWA);
    console.log('🌐 User Agent:', navigator.userAgent);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <VendorProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </VendorProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
