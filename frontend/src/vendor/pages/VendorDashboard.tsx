import VendorHeader from "../components/VendorHeader";
import VendorHero from "../components/VendorHero";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVendor } from "@/contexts/VendorContext";

const VendorDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { vendor, isLoading } = useVendor();

  console.log('🔍 VendorDashboard: Component rendered');
  console.log('🔍 VendorDashboard: isMobile:', isMobile);
  console.log('🔍 VendorDashboard: Current path:', window.location.pathname);
  console.log('🔍 VendorDashboard: Vendor:', vendor?.vendorId);
  console.log('🔍 VendorDashboard: isLoading:', isLoading);

  // Redirect to earnings page if vendor doesn't have initial deposit
  useEffect(() => {
    console.log('🔄 VendorDashboard useEffect: isLoading:', isLoading, 'vendor:', vendor?.vendorId);
    
    if (!isLoading && vendor) {
      const hasInitialDeposit = vendor.wallet?.hasInitialDeposit || 
                               (vendor.wallet?.currentBalance >= 3999) ||
                               (vendor.wallet?.totalDeposits > 0);
      
      console.log('🔄 VendorDashboard: hasInitialDeposit:', hasInitialDeposit);
      console.log('🔄 VendorDashboard: wallet data:', vendor.wallet);
      
      if (!hasInitialDeposit) {
        console.log('🔄 VendorDashboard: Redirecting to earnings - no initial deposit');
        navigate('/vendor/earnings', { replace: true });
      } else {
        console.log('✅ VendorDashboard: Vendor has initial deposit, staying on dashboard');
      }
    } else if (!isLoading && !vendor) {
      console.log('⚠️ VendorDashboard: No vendor data found');
    }
  }, [vendor, isLoading, navigate]);

  // Show loading while vendor data is being fetched
  if (isLoading) {
    console.log('🔄 VendorDashboard: Loading vendor data...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if vendor not found
  if (!vendor) {
    console.log('⚠️ VendorDashboard: No vendor found, redirecting to login');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to continue</p>
          <button 
            onClick={() => navigate('/vendor/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ VendorDashboard: Rendering dashboard for vendor:', vendor.vendorId);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
        <VendorHero />
        <div className="container mx-auto px-4 py-8">
          {!isMobile && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to Vendor Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Push notifications are now enabled for vendors! You'll receive instant notifications when new tasks are assigned.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📱 Mobile Optimized</h3>
                <p className="text-blue-600">
                  For the best experience, please access the vendor dashboard from your mobile device.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorDashboard;
