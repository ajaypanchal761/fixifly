import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";

const VendorCustomers = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  
  // Show 404 error on desktop - must be before any other hooks
  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  

  return (
    <div className="flex flex-col min-h-screen">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 md:hidden">Customers</h1>
          
          {/* Search and Filter */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8 md:hidden">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:hidden">
            {[1, 2, 3, 4, 5, 6].map((customer) => (
              <div key={customer} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {customer === 1 ? 'J' : customer === 2 ? 'S' : customer === 3 ? 'M' : customer === 4 ? 'A' : customer === 5 ? 'R' : 'L'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer === 1 ? 'John Doe' : customer === 2 ? 'Sarah Smith' : customer === 3 ? 'Mike Johnson' : customer === 4 ? 'Anna Wilson' : customer === 5 ? 'Robert Brown' : 'Lisa Davis'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      +91 98765 4321{customer}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-medium">{customer * 2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Order:</span>
                    <span className="font-medium">2 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    View Profile
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors">
                    Message
                  </button>
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

export default VendorCustomers;
