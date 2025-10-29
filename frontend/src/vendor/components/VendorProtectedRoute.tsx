import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

const VendorProtectedRoute = ({ children }: VendorProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, vendor } = useVendor();

  // Also check localStorage directly as a fallback
  const tokenInStorage = localStorage.getItem('vendorToken');
  const vendorDataInStorage = localStorage.getItem('vendorData');
  const hasTokenInStorage = !!tokenInStorage && !!vendorDataInStorage;

  console.log('🔒 VendorProtectedRoute: Checking authentication...', {
    isLoading,
    isAuthenticated,
    hasVendor: !!vendor,
    vendorId: vendor?.vendorId,
    hasTokenInStorage,
    path: window.location.pathname
  });

  useEffect(() => {
    console.log('🔒 VendorProtectedRoute useEffect: isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'hasTokenInStorage:', hasTokenInStorage);
    
    // Wait a bit longer if we have token in storage but context is still loading
    if (hasTokenInStorage && isLoading) {
      console.log('⏳ VendorProtectedRoute: Token found in storage, waiting for context to load...');
      return;
    }
    
    if (!isLoading && !isAuthenticated && !hasTokenInStorage) {
      console.log('⚠️ VendorProtectedRoute: Not authenticated (no token), redirecting to login');
      // Only redirect if not already on login page to prevent loops
      if (window.location.pathname !== '/vendor/login') {
        navigate('/vendor/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, hasTokenInStorage]);

  // Show loading while checking authentication or if we have token but context is loading
  if (isLoading || (hasTokenInStorage && !vendor)) {
    console.log('🔄 VendorProtectedRoute: Still loading vendor data...', {
      isLoading,
      hasTokenInStorage,
      hasVendor: !!vendor
    });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  // Allow access if we have token in storage even if context hasn't updated yet
  const shouldAllowAccess = isAuthenticated || hasTokenInStorage;

  // Return error if not authenticated (but only after loading is complete and no token in storage)
  if (!shouldAllowAccess) {
    console.log('❌ VendorProtectedRoute: Not authenticated, showing error');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access this page</p>
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

  console.log('✅ VendorProtectedRoute: Authenticated, rendering children', {
    isAuthenticated,
    hasTokenInStorage,
    vendorId: vendor?.vendorId
  });
  return <>{children}</>;
};

export default VendorProtectedRoute;
