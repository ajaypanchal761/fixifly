import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";

const VendorOrders = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8 md:hidden animate-slide-up">Orders Management</h1>
          
          {/* Orders Filter */}
          <div className="service-card mb-8 md:hidden animate-fade-in-delay">
            <div className="flex flex-wrap gap-4">
              <button className="btn-tech text-sm px-4 py-2">
                All Orders
              </button>
              <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">
                Pending
              </button>
              <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">
                In Progress
              </button>
              <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">
                Completed
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4 md:hidden">
            {[1, 2, 3, 4, 5].map((order) => (
              <div key={order} className="service-card animate-fade-in-delay" style={{ animationDelay: `${order * 0.1}s` }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.toString().padStart(3, '0')}</h3>
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Customer:</span> John Doe
                      </div>
                      <div>
                        <span className="font-medium">Service:</span> Laptop Repair
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ₹2,500
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

export default VendorOrders;
