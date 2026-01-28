import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [forceStopLoading, setForceStopLoading] = useState(false);

  // Add timeout to prevent infinite loading (5 seconds)
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('UserProtectedRoute: Loading timeout reached, forcing stop');
        setForceStopLoading(true);
      }, 5000);

      return () => clearTimeout(timeoutId);
    } else {
      setForceStopLoading(false);
    }
  }, [isLoading]);

  if (isLoading && !forceStopLoading) {
    // Show loading spinner while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to home page instead of non-existent login page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;
