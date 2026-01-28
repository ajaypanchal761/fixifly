import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface MobileAuthGuardProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication on mobile
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/booking',
  '/checkout',
  '/amc',
  '/terms-conditions',
  '/privacy-policy',
  '/cancellation-refund-policy',
  '/tips-tricks',
  '/tips',
  '/about',
  '/rate-us',
  '/rate',
  '/support'
];

const MobileAuthGuard: React.FC<MobileAuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on mobile (memoized to prevent recalculation)
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  }, []);

  // Check if current route or any parent route matches public routes (memoized)
  const isPublicRoute = useMemo(() => {
    return PUBLIC_ROUTES.some(route =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
  }, [location.pathname]);

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirectedRef.current = false;
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  }, [location.pathname]);

  useEffect(() => {
    // Only apply mobile auth guard on mobile devices
    // Skip if loading, already redirected, or on auth pages
    if (!isMobile || isLoading || hasRedirectedRef.current) {
      return;
    }

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

    // If not authenticated and not on a public route and not already on auth page
    if (!isAuthenticated && !isPublicRoute && !isAuthPage) {
      hasRedirectedRef.current = true;
      // Use timeout to prevent immediate re-trigger and allow state to settle
      redirectTimeoutRef.current = setTimeout(() => {
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }, 50);
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [isMobile, isAuthenticated, isLoading, location.pathname, navigate, isPublicRoute]);

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
  if (isMobile && !isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
};

export default MobileAuthGuard;

