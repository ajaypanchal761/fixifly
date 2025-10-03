import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import oneSignalService from "./services/oneSignalService";
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
import About from "./pages/About";
import Reschedule from "./pages/Reschedule";
import LaptopService from "./pages/LaptopService";
import RateUs from "./pages/RateUs";
import Shop from "./pages/Shop";
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
import VendorDashboard from "./vendor/pages/VendorDashboard";
import VendorProfile from "./vendor/pages/VendorProfile";
import VendorEarnings from "./vendor/pages/VendorEarnings";
import VendorNotifications from "./vendor/pages/VendorNotifications";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isVendorRoute = location.pathname.startsWith('/vendor');
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  const isAuthPage = isLoginPage || isSignupPage;

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

        {/* ================== PROTECTED USER ROUTES ================== */}
        <Route path="/booking" element={<MobileAuthGuard><Booking /></MobileAuthGuard>} />
        <Route path="/checkout" element={<MobileAuthGuard><Checkout /></MobileAuthGuard>} />
        <Route path="/reschedule" element={<MobileAuthGuard><Reschedule /></MobileAuthGuard>} />
        
        {/* AMC Routes */}
        <Route path="/amc" element={<MobileAuthGuard><AMC /></MobileAuthGuard>} />
        <Route path="/amc/:planId" element={<MobileAuthGuard><AMCPlanDetails /></MobileAuthGuard>} />
        <Route path="/amc/subscribe/:planId" element={<MobileAuthGuard><AMCSubscribe /></MobileAuthGuard>} />
        
        {/* Support Routes */}
        <Route path="/support" element={<MobileAuthGuard><Support /></MobileAuthGuard>} />
        <Route path="/payment" element={<MobileAuthGuard><Payment /></MobileAuthGuard>} />
        
        {/* Profile & Settings Routes */}
        <Route path="/profile" element={<MobileAuthGuard><Profile /></MobileAuthGuard>} />
        
        {/* Information Pages Routes */}
        <Route path="/tips-tricks" element={<MobileAuthGuard><TipsTricks /></MobileAuthGuard>} />
        <Route path="/terms-conditions" element={<MobileAuthGuard><TermsConditions /></MobileAuthGuard>} />
        <Route path="/about" element={<MobileAuthGuard><About /></MobileAuthGuard>} />
        <Route path="/rate-us" element={<MobileAuthGuard><RateUs /></MobileAuthGuard>} />
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
        
        {/* ================== 404 ROUTE ================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {!isAdminRoute && !isVendorRoute && !isAuthPage && !isLoginPage && !isSignupPage && <MobileBottomNav />}
    </div>
  );
};

const App = () => {
  useEffect(() => {
    // Initialize OneSignal once for the entire app
    const initializeOneSignal = async () => {
      try {
        const OneSignalUtils = await import('./utils/oneSignalUtils');
        const success = await OneSignalUtils.OneSignalUtils.initialize();
        
        if (success) {
          console.log('✅ OneSignal initialized successfully');
        } else if (window.OneSignalIndexedDBError) {
          console.warn('⚠️ OneSignal: Push notifications disabled due to IndexedDB error');
          console.info('💡 This usually happens in incognito mode or with storage disabled');
          console.info('📧 Vendor notifications will still work via email/SMS');
          
          // Initialize fallback service
          try {
            const notificationFallback = await import('./services/notificationFallback');
            notificationFallback.default.initialize('OneSignal IndexedDB error');
            console.log('✅ Fallback notification service initialized');
          } catch (e) {
            console.error('❌ Failed to initialize fallback service:', e);
          }
        } else {
          console.warn('⚠️ OneSignal initialization failed for unknown reasons');
        }
      } catch (error) {
        console.error('❌ Error initializing OneSignal:', error);
        
        // Check if it's an IndexedDB-related error
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes('indexedDB.open') || errorMessage.includes('backing store')) {
          console.warn('🔧 OneSignal: Detected IndexedDB error, push notifications disabled');
          console.info('💡 Possible solutions: clear browser storage, disable incognito mode, or check browser permissions');
          window.OneSignalIndexedDBError = true;
          
          // Initialize fallback service
          try {
            const notificationFallback = await import('./services/notificationFallback');
            notificationFallback.default.initialize(`IndexedDB error: ${errorMessage}`);
            console.log('✅ Fallback notification service activated');
          } catch (e) {
            console.error('❌ Failed to initialize fallback service:', e);
          }
        }
      }
    };

    initializeOneSignal();
  }, []);

  return (
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
};

export default App;
