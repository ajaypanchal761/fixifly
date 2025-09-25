import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Check if admin is authenticated
  const adminToken = localStorage.getItem('adminToken');
  const adminRefreshToken = localStorage.getItem('adminRefreshToken');
  const adminData = localStorage.getItem('adminData');

  console.log('AdminProtectedRoute - Authentication check:', {
    hasToken: !!adminToken,
    hasRefreshToken: !!adminRefreshToken,
    hasAdminData: !!adminData,
    tokenLength: adminToken?.length || 0,
    refreshTokenLength: adminRefreshToken?.length || 0
  });

  if (!adminToken || !adminData) {
    console.log('AdminProtectedRoute - Missing token or data, redirecting to login');
    // Clear any partial auth data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminData');
    // Redirect to admin login page with return url
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  try {
    // Verify admin data is valid JSON
    const parsedAdminData = JSON.parse(adminData);
    
    console.log('AdminProtectedRoute - Parsed admin data:', parsedAdminData);
    
    // Check if admin data has required fields (updated to match new structure)
    if (!parsedAdminData._id && !parsedAdminData.id || !parsedAdminData.email || !['admin', 'super_admin'].includes(parsedAdminData.role)) {
      console.log('AdminProtectedRoute - Invalid admin data structure');
      // Clear invalid data and redirect to login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminData');
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Admin is authenticated, render the protected component
    console.log('AdminProtectedRoute - Admin authenticated successfully');
    return <>{children}</>;
  } catch (error) {
    console.error('AdminProtectedRoute - Error parsing admin data:', error);
    // Invalid JSON data, clear and redirect to login
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminData');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
};

export default AdminProtectedRoute;
