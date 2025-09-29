import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminAuthDebug = () => {
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    checkAuthData();
  }, []);

  const checkAuthData = () => {
    const adminToken = localStorage.getItem('adminToken');
    const adminRefreshToken = localStorage.getItem('adminRefreshToken');
    const adminData = localStorage.getItem('adminData');

    setAuthData({
      adminToken: adminToken ? `${adminToken.substring(0, 20)}...` : 'null',
      adminRefreshToken: adminRefreshToken ? `${adminRefreshToken.substring(0, 20)}...` : 'null',
      adminData: adminData ? adminData.substring(0, 200) + '...' : 'null',
      hasToken: !!adminToken,
      hasRefreshToken: !!adminRefreshToken,
      hasAdminData: !!adminData,
      tokenLength: adminToken?.length || 0,
      refreshTokenLength: adminRefreshToken?.length || 0,
      adminDataLength: adminData?.length || 0
    });
  };

  const clearAuthData = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminData');
    checkAuthData();
  };

  const testTokenValidation = () => {
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    const isValidToken = adminToken && adminToken !== 'undefined' && adminToken.trim() !== '';
    const isValidAdminData = adminData && adminData !== 'undefined' && adminData.trim() !== '';
    
    console.log('Token validation test:', {
      isValidToken,
      isValidAdminData,
      adminToken,
      adminData
    });
    
    if (isValidToken && isValidAdminData) {
      try {
        const parsedAdminData = JSON.parse(adminData);
        console.log('Parsed admin data:', parsedAdminData);
        
        const hasValidStructure = (parsedAdminData._id || parsedAdminData.id) && 
                                 parsedAdminData.email && 
                                 ['admin', 'super_admin'].includes(parsedAdminData.role);
        
        console.log('Valid structure:', hasValidStructure);
        return hasValidStructure;
      } catch (error) {
        console.error('JSON parse error:', error);
        return false;
      }
    }
    
    return false;
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Token Status:</h4>
              <p>Has Token: {authData?.hasToken ? 'Yes' : 'No'}</p>
              <p>Token Length: {authData?.tokenLength}</p>
              <p>Token Preview: {authData?.adminToken}</p>
            </div>
            <div>
              <h4 className="font-medium">Admin Data Status:</h4>
              <p>Has Admin Data: {authData?.hasAdminData ? 'Yes' : 'No'}</p>
              <p>Data Length: {authData?.adminDataLength}</p>
              <p>Data Preview: {authData?.adminData}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={checkAuthData} variant="outline">
              Refresh Data
            </Button>
            <Button onClick={clearAuthData} variant="destructive">
              Clear Auth Data
            </Button>
            <Button onClick={testTokenValidation} variant="secondary">
              Test Validation
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Check browser console for detailed validation logs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthDebug;