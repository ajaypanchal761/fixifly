import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';

interface VendorDepositProtectedRouteProps {
  children: React.ReactNode;
}

const VendorDepositProtectedRoute = ({ children }: VendorDepositProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, vendor } = useVendor();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/vendor/login');
      return;
    }

    if (!isLoading && isAuthenticated && vendor) {
      // Check if vendor has made the initial deposit - once deposit is made, always show Yes
      const hasInitialDeposit = vendor.wallet?.hasInitialDeposit || 
                               (vendor.wallet?.currentBalance >= 3999) ||
                               (vendor.wallet?.totalDeposits > 0);
      
      console.log('=== VENDOR DEPOSIT PROTECTED ROUTE DEBUG ===');
      console.log('Vendor ID:', vendor.vendorId);
      console.log('Wallet data:', vendor.wallet);
      console.log('Has initial deposit:', hasInitialDeposit);
      console.log('Current path:', location.pathname);
      
      // Allow access to support and earnings pages even without deposit
      const allowedPagesWithoutDeposit = ['/vendor/support', '/vendor/earnings'];
      const isAllowedPage = allowedPagesWithoutDeposit.includes(location.pathname);
      
      // If no initial deposit and not on allowed pages, redirect to earnings
      if (!hasInitialDeposit && !isAllowedPage) {
        console.log('Redirecting to earnings - no initial deposit');
        navigate('/vendor/earnings');
      } else {
        console.log('Access allowed - has initial deposit or on allowed page');
      }
    }
  }, [isAuthenticated, isLoading, vendor, location.pathname, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Return null while redirecting if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default VendorDepositProtectedRoute;
