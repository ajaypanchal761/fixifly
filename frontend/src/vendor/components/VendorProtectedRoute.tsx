import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

const VendorProtectedRoute = ({ children }: VendorProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendorData');
    
    if (!vendorToken || !vendorData) {
      // Redirect to login if not authenticated
      navigate('/vendor/login');
    }
  }, [navigate]);

  // Check if user is authenticated
  const vendorToken = localStorage.getItem('vendorToken');
  const vendorData = localStorage.getItem('vendorData');
  
  if (!vendorToken || !vendorData) {
    // Return null while redirecting
    return null;
  }

  return <>{children}</>;
};

export default VendorProtectedRoute;
