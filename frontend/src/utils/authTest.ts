// Authentication Test Utility
export const testAdminAuth = () => {
  console.log('=== ADMIN AUTHENTICATION TEST ===');
  
  const adminToken = localStorage.getItem('adminToken');
  const adminRefreshToken = localStorage.getItem('adminRefreshToken');
  const adminData = localStorage.getItem('adminData');
  
  console.log('1. Token Check:');
  console.log('   - Access Token:', adminToken ? `${adminToken.substring(0, 20)}...` : 'MISSING');
  console.log('   - Refresh Token:', adminRefreshToken ? `${adminRefreshToken.substring(0, 20)}...` : 'MISSING');
  
  console.log('2. Admin Data Check:');
  console.log('   - Admin Data:', adminData ? 'PRESENT' : 'MISSING');
  
  if (adminData) {
    try {
      const parsed = JSON.parse(adminData);
      console.log('   - Parsed Data:', parsed);
      console.log('   - Has ID:', !!(parsed._id || parsed.id));
      console.log('   - Has Email:', !!parsed.email);
      console.log('   - Has Role:', !!parsed.role);
      console.log('   - Valid Role:', ['admin', 'super_admin'].includes(parsed.role));
    } catch (error) {
      console.log('   - Parse Error:', error);
    }
  }
  
  console.log('3. Authentication Status:');
  const isAuthenticated = !!(adminToken && adminData);
  console.log('   - Authenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('   - Missing:', {
      token: !adminToken,
      data: !adminData
    });
  }
  
  console.log('=== END TEST ===');
  return isAuthenticated;
};

export const clearAdminAuth = () => {
  console.log('Clearing admin authentication data...');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminData');
  console.log('Admin authentication data cleared.');
};

// Make it available globally for debugging
(window as any).testAdminAuth = testAdminAuth;
(window as any).clearAdminAuth = clearAdminAuth;
