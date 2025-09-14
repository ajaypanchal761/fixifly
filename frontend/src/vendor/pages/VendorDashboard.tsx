import VendorHeader from "../components/VendorHeader";
import VendorHero from "../components/VendorHero";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";

const VendorDashboard = () => {
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
        <VendorHero />
        <div className="container mx-auto px-4 py-8">
          {/* Recent Orders Section */}
          <div className="mt-8 md:hidden">
            <h2 className="text-2xl font-bold text-foreground mb-6 animate-slide-up">Recent Orders</h2>
            <div className="service-card overflow-hidden animate-fade-in-delay">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD001</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">John Doe</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Laptop Repair</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹2,500</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD002</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jane Smith</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Desktop Repair</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          In Progress
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹3,200</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD003</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mike Johnson</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Printer Repair</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹1,800</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

export default VendorDashboard;
