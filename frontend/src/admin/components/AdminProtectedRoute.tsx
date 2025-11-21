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
    refreshTokenLength: adminRefreshToken?.length || 0,
    currentPath: location.pathname,
    tokenValue: adminToken ? `${adminToken.substring(0, 20)}...` : 'null',
    adminDataValue: adminData ? adminData.substring(0, 100) + '...' : 'null',
    rawToken: adminToken,
    rawAdminData: adminData
  });

  // Check if token is valid (not null, not undefined string, not empty)
  const isValidToken = adminToken && adminToken !== 'undefined' && adminToken.trim() !== '';
  const isValidAdminData = adminData && adminData !== 'undefined' && adminData.trim() !== '';

  if (!isValidToken || !isValidAdminData) {
    console.log('AdminProtectedRoute - Missing or invalid token/data, redirecting to login');
    console.log('AdminProtectedRoute - Token valid:', isValidToken);
    console.log('AdminProtectedRoute - Admin data valid:', isValidAdminData);
    console.log('AdminProtectedRoute - Raw token:', adminToken);
    console.log('AdminProtectedRoute - Raw adminData:', adminData);
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
    console.log('AdminProtectedRoute - Parsed admin data:', {
      hasId: !!(parsedAdminData._id || parsedAdminData.id),
      hasEmail: !!parsedAdminData.email,
      role: parsedAdminData.role,
      isValidRole: ['admin', 'super_admin'].includes(parsedAdminData.role)
    });
    
    if ((!parsedAdminData._id && !parsedAdminData.id) || !parsedAdminData.email || !['admin', 'super_admin'].includes(parsedAdminData.role)) {
      console.log('AdminProtectedRoute - Invalid admin data structure');
      console.log('AdminProtectedRoute - Missing fields:', {
        missingId: !parsedAdminData._id && !parsedAdminData.id,
        missingEmail: !parsedAdminData.email,
        invalidRole: !['admin', 'super_admin'].includes(parsedAdminData.role)
      });
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
