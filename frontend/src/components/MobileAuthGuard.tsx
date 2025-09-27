import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface MobileAuthGuardProps {
  children: React.ReactNode;
}

const MobileAuthGuard: React.FC<MobileAuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on mobile
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    // Only apply mobile auth guard on mobile devices
    if (isMobile && !isLoading) {
      // Allow access to login and signup pages
      const publicRoutes = ['/login', '/signup'];
      const isPublicRoute = publicRoutes.includes(location.pathname);

      // If not authenticated and not on a public route, redirect to login
      if (!isAuthenticated && !isPublicRoute) {
        navigate('/login', { replace: true });
      }
    }
  }, [isMobile, isAuthenticated, isLoading, location.pathname, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // On mobile, if not authenticated and not on public route, don't render children
  if (isMobile && !isAuthenticated && !['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default MobileAuthGuard;
