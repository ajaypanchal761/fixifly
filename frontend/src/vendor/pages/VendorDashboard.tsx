import VendorHeader from "../components/VendorHeader";
import VendorHero from "../components/VendorHero";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";

const VendorDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
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
