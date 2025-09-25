import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

const VendorProtectedRoute = ({ children }: VendorProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useVendor();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/vendor/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

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

export default VendorProtectedRoute;
