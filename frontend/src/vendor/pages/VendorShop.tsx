import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";
import { Store, Clock, Bell } from "lucide-react";

const VendorShop = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  
  // Show 404 error on desktop - must be before any other hooks
  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <VendorHeader />
      <main className="flex-1 flex items-center justify-center pb-24 pt-20 overflow-hidden">
        <div className="w-full max-w-md mx-auto px-4">
          {/* Coming Soon Header */}
          <div className="text-center animate-slide-up">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Vendor Shop</h1>
            <h2 className="text-2xl font-semibold text-gradient mb-2">Coming Soon</h2>
            <p className="text-muted-foreground text-lg mb-8">We're working hard to bring you an amazing shopping experience</p>
            
            {/* Contact Info */}
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Have questions? Contact our support team for more information.
              </p>
            </div>
          </div>
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorShop;
