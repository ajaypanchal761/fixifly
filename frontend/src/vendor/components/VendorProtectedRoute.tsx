import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

const VendorProtectedRoute = ({ children }: VendorProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, vendor } = useVendor();

  // APK-safe localStorage check
  const [tokenInStorage, setTokenInStorage] = useState<string | null>(null);
  const [vendorDataInStorage, setVendorDataInStorage] = useState<string | null>(null);
  const [waitTimeout, setWaitTimeout] = useState(false);
  
  useEffect(() => {
    try {
      const token = localStorage.getItem('vendorToken');
      const vendorData = localStorage.getItem('vendorData');
      setTokenInStorage(token);
      setVendorDataInStorage(vendorData);
    } catch (error) {
      console.error('localStorage access failed:', error);
      setTokenInStorage(null);
      setVendorDataInStorage(null);
    }
  }, []);
  
  const hasTokenInStorage = !!tokenInStorage && !!vendorDataInStorage;

  let currentPath = 'unknown';
  try {
    currentPath = typeof window !== 'undefined' && window.location ? window.location.pathname : 'unknown';
  } catch (error) {
    console.error('Error accessing window.location:', error);
  }
  
  console.log('🔒 VendorProtectedRoute: Checking authentication...', {
    isLoading,
    isAuthenticated,
    hasVendor: !!vendor,
    vendorId: vendor?.vendorId,
    hasTokenInStorage,
    path: currentPath
  });

  useEffect(() => {
    let currentPath = 'unknown';
    try {
      currentPath = typeof window !== 'undefined' && window.location ? window.location.pathname : 'unknown';
    } catch (error) {
      console.error('Error accessing window.location in useEffect:', error);
    }
    
    console.log('🔒 VendorProtectedRoute useEffect:', {
      isLoading,
      isAuthenticated,
      hasTokenInStorage,
      path: currentPath
    });
    
    // Wait for context to load if we have token
    if (hasTokenInStorage && isLoading) {
      console.log('⏳ VendorProtectedRoute: Token found, waiting for context...');
      return;
    }
    
    // Only redirect if truly not authenticated (no token in storage and context says not authenticated)
    if (!isLoading && !isAuthenticated && !hasTokenInStorage) {
      console.log('⚠️ VendorProtectedRoute: No token found, redirecting to login');
      if (currentPath !== '/vendor/login' && !currentPath.includes('/vendor/signup')) {
        navigate('/vendor/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, hasTokenInStorage]);

  // Show loading if context is still loading
  if (isLoading) {
    console.log('🔄 VendorProtectedRoute: Loading state', {
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

  // If we have token but vendor not loaded yet (race condition), wait a bit more in APK
  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (hasTokenInStorage && !vendor && !isLoading) {
      // Set timeout to stop waiting after 3 seconds
      const timeoutId = setTimeout(() => {
        console.warn('VendorProtectedRoute: Timeout waiting for vendor data, proceeding anyway');
        setWaitTimeout(true);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setWaitTimeout(false);
    }
  }, [hasTokenInStorage, vendor, isLoading]);
  
  if (hasTokenInStorage && !vendor && !waitTimeout) {
    console.log('⏳ VendorProtectedRoute: Token found but vendor not loaded yet, waiting...');
    
    // In APK, give more time for vendor context to load
    let isAPK = false;
    try {
      isAPK = (typeof navigator !== 'undefined' && /wv|WebView/.test(navigator.userAgent || '')) || 
              (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    } catch (error) {
      console.error('Error detecting APK mode:', error);
      isAPK = false;
    }
    
    if (isAPK) {
      // In APK, allow rendering with token if vendor context is still loading
      // This prevents infinite loading screen
      console.log('📱 APK detected: Allowing render with token while vendor loads');
      // Don't block - let it render and vendor context will update
    } else {
      // In browser, show loading but with timeout
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing vendor dashboard...</p>
          </div>
        </div>
      );
    }
  }

  // Allow access if authenticated OR if we have token in storage (fallback for timing issues)
  const shouldAllowAccess = isAuthenticated || hasTokenInStorage;

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
