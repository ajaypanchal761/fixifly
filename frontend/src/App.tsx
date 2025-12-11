import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, Suspense } from "react";
// Import mandatory deposit handler to fix the error
import "./services/mandatoryDepositHandler";
// Import push notification service
import { initializePushNotifications, setupForegroundNotificationHandler } from "./services/pushNotificationService";
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
import SearchResults from "./pages/SearchResults";
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
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";

// Vendor imports
import VendorLogin from "./vendor/pages/VendorLogin";
import VendorSignup from "./vendor/pages/VendorSignup";
import VendorVerification from "./vendor/pages/VendorVerification";
import VendorVerified from "./vendor/pages/VendorVerified";
import VendorBenefits from "./vendor/pages/VendorBenefits";
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
import VendorProtectedRoute from "./vendor/components/VendorProtectedRoute";
import ErrorBoundary from "./vendor/components/ErrorBoundary";

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
        <Route path="/service/:serviceType" element={<LaptopService />} />
        <Route path="/search" element={<SearchResults />} />
        
        {/* ================== ADMIN AUTH ROUTES ================== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        
        {/* ================== VENDOR AUTH ROUTES ================== */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/signup" element={<VendorSignup />} />
        <Route path="/vendor/verification" element={<VendorVerification />} />
        <Route path="/vendor/verified" element={<VendorVerified />} />
        <Route path="/vendor/benefits" element={<VendorBenefits />} />

        {/* ================== PROTECTED USER ROUTES ================== */}
        <Route path="/booking" element={<MobileAuthGuard><Booking /></MobileAuthGuard>} />
        <Route path="/checkout" element={<MobileAuthGuard><Checkout /></MobileAuthGuard>} />
        <Route path="/reschedule/:id" element={<MobileAuthGuard><Reschedule /></MobileAuthGuard>} />
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
        <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/profile" element={<AdminProtectedRoute><AdminProfile /></AdminProtectedRoute>} />
        
        {/* User Management */}
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminUserManagement /></AdminProtectedRoute>} />
        
        {/* Vendor Management */}
        <Route path="/admin/vendors" element={<AdminProtectedRoute><AdminVendorManagement /></AdminProtectedRoute>} />
        <Route path="/admin/vendor-wallet" element={<AdminProtectedRoute><AdminVendorWalletManagement /></AdminProtectedRoute>} />
        
        {/* Service Management */}
        <Route path="/admin/service-management" element={<AdminProtectedRoute><AdminServiceManagementDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/products" element={<AdminProtectedRoute><AdminServiceManagement /></AdminProtectedRoute>} />
        <Route path="/admin/bookings" element={<AdminProtectedRoute><AdminBookingManagement /></AdminProtectedRoute>} />
        
        {/* Financial Management */}
        <Route path="/admin/payment-management" element={<AdminProtectedRoute><AdminPaymentManagement /></AdminProtectedRoute>} />
        <Route path="/admin/wallets" element={<AdminProtectedRoute><AdminVendorWalletManagement /></AdminProtectedRoute>} />
        
        {/* Content Management */}
        <Route path="/admin/blogs" element={<AdminProtectedRoute><AdminBlogManagement /></AdminProtectedRoute>} />
        <Route path="/admin/banners" element={<AdminProtectedRoute><AdminBannerManagement /></AdminProtectedRoute>} />
        <Route path="/admin/cards" element={<AdminProtectedRoute><AdminCardManagement /></AdminProtectedRoute>} />
        
        {/* Location & Products */}
        <Route path="/admin/cities" element={<AdminProtectedRoute><AdminCityManagement /></AdminProtectedRoute>} />
        
        {/* AMC Management */}
        <Route path="/admin/amc" element={<AdminProtectedRoute><AdminAMCManagement /></AdminProtectedRoute>} />
        
        {/* Support Management */}
        <Route path="/admin/support" element={<AdminProtectedRoute><AdminSupportManagement /></AdminProtectedRoute>} />
        
        {/* Communication */}
        <Route path="/admin/push-notifications" element={<AdminProtectedRoute><AdminPushNotificationManagement /></AdminProtectedRoute>} />
        <Route path="/admin/notifications" element={<AdminProtectedRoute><AdminPushNotificationManagement /></AdminProtectedRoute>} />

        {/* ================== VENDOR PROTECTED ROUTES ================== */}
        <Route path="/vendor" element={<ErrorBoundary><VendorProtectedRoute><VendorDashboard /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/dashboard" element={<ErrorBoundary><VendorProtectedRoute><VendorDashboard /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/profile" element={<ErrorBoundary><VendorProtectedRoute><VendorProfile /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/earnings" element={<ErrorBoundary><VendorProtectedRoute><VendorEarnings /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/notifications" element={<ErrorBoundary><VendorProtectedRoute><VendorNotifications /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/support" element={<ErrorBoundary><VendorProtectedRoute><VendorSupport /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/shop" element={<ErrorBoundary><VendorProtectedRoute><VendorShop /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/privacy" element={<ErrorBoundary><VendorProtectedRoute><VendorPrivacy /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/terms" element={<ErrorBoundary><VendorProtectedRoute><VendorTermsConditions /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/deposit-penalty" element={<ErrorBoundary><VendorProtectedRoute><VendorDepositPenalty /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/about" element={<ErrorBoundary><VendorProtectedRoute><VendorAbout /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/penalty" element={<ErrorBoundary><VendorProtectedRoute><VendorPenaltyCharges /></VendorProtectedRoute></ErrorBoundary>} />
        
        {/* Vendor Task Routes */}
        <Route path="/vendor/task/:taskId" element={<ErrorBoundary><VendorProtectedRoute><VendorTaskDetail /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/task/:taskId/preview" element={<ErrorBoundary><VendorProtectedRoute><VendorTaskPreview /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/task/:taskId/reschedule" element={<ErrorBoundary><VendorProtectedRoute><VendorRescheduleTask /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/task/:taskId/cancel" element={<ErrorBoundary><VendorProtectedRoute><VendorCancelTaskDetail /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/task/:taskId/cancelled" element={<ErrorBoundary><VendorProtectedRoute><VendorCancelledTaskDetail /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/task/:taskId/close" element={<ErrorBoundary><VendorProtectedRoute><VendorClosedTask /></VendorProtectedRoute></ErrorBoundary>} />
        <Route path="/vendor/task/:taskId/closed" element={<ErrorBoundary><VendorProtectedRoute><VendorClosedTaskDetail /></VendorProtectedRoute></ErrorBoundary>} />
        
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
    
    // Initialize push notifications
    initializePushNotifications().catch((error) => {
      console.error('❌ Failed to initialize push notifications:', error);
    });
    
    // Setup foreground notification handler
    const unsubscribe = setupForegroundNotificationHandler((payload) => {
      console.log('📬 Notification received in foreground:', payload);
      
      // Handle account access granted notification
      if (payload.data?.type === 'account_access_granted') {
        console.log('✅ Account access granted notification received');
        // Dispatch custom event to trigger vendor context refresh
        const event = new CustomEvent('accountAccessGranted', {
          detail: payload.data
        });
        window.dispatchEvent(event);
      }
      
      // Handle booking assignment notification
      if (payload.data?.type === 'booking_assignment') {
        console.log('📅 Booking assignment notification received');
        console.log('📅 Booking assignment data:', payload.data);
        
        // Dispatch custom event to trigger vendor dashboard refresh
        const event = new CustomEvent('bookingAssigned', {
          detail: payload.data
        });
        window.dispatchEvent(event);
        
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          const notificationData = payload.data || {};
          const taskLink = notificationData.link || 
                          (notificationData.bookingId ? `/vendor/task/${notificationData.bookingId}` : null) ||
                          (notificationData.taskId ? `/vendor/task/${notificationData.taskId}` : null) ||
                          '/vendor/dashboard';
          
          const notification = new Notification('📅 New Booking Assigned', {
            body: payload.notification?.body || payload.data?.message || 'A new service booking has been assigned to you.',
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: 'booking-assignment',
            requireInteraction: true,
            data: {
              ...notificationData,
              link: taskLink
            }
          });
          
          // Handle notification click to navigate to task
          notification.onclick = (event) => {
            event.preventDefault();
            console.log('📅 Notification clicked, navigating to:', taskLink);
            window.focus();
            // Use window.location for navigation
            if (window.location.pathname.startsWith('/vendor')) {
              window.location.href = taskLink;
            } else {
              // If not on vendor route, navigate to vendor login first, then task
              window.location.href = `/vendor/login?redirect=${encodeURIComponent(taskLink)}`;
            }
            notification.close();
          };
        }
      }
    });
    
    // Register service worker for PWA functionality - COMMENTED OUT FOR WEBVIEW TESTING
    // if ('serviceWorker' in navigator) {
    //   import('./serviceWorkerRegistration').then(({ register }) => {
    //     register();
    //   }).catch((error) => {
    //     console.error('❌ Service Worker registration failed:', error);
    //   });
    // }
    
    // Force PWA installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA install prompt available');
      e.preventDefault();
      // Store the event for later use
      (window as any).deferredPrompt = e;
    });
    
    // Debug mobile webview detection
    const isMobileWebView = /wv|WebView/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    console.log('📱 Mobile WebView detected:', isMobileWebView);
    console.log('📱 PWA mode detected:', isPWA);
    console.log('🌐 User Agent:', navigator.userAgent);
    
    // Listen for messages from service worker (notification clicks)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('📬 Message received from service worker:', event.data);
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { link, data } = event.data;
        console.log('📅 Notification click message received, navigating to:', link);
        
        // Navigate to the task page
        if (link && link.startsWith('/vendor/task/')) {
          window.location.href = link;
        } else if (link) {
          window.location.href = link;
        }
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
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
