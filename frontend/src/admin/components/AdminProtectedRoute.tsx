import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Check if admin is authenticated
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');

  if (!adminToken || !adminData) {
    // Redirect to admin login page with return url
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  try {
    // Verify admin data is valid JSON
    const parsedAdminData = JSON.parse(adminData);
    
    // Check if admin data has required fields
    if (!parsedAdminData.id || !parsedAdminData.email || parsedAdminData.role !== 'admin') {
      // Clear invalid data and redirect to login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Admin is authenticated, render the protected component
    return <>{children}</>;
  } catch (error) {
    // Invalid JSON data, clear and redirect to login
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
};

export default AdminProtectedRoute;
